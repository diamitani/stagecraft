/**
 * Stagecraft deposits (server-only), built on the existing Stripe Connect
 * setup in lib/stripe-connect.ts.
 *
 * How the money moves: the artist pays the deposit on the VENUE's connected
 * Stripe account (a direct charge), and Stagecraft keeps a platform fee
 * (PLATFORM_FEE_PERCENT in lib/stagecraft-shared.ts). The venue therefore
 * needs a connected account that can take card payments before it can ask
 * for a deposit.
 *
 * There is no webhook dependency. A deposit is confirmed by asking Stripe
 * for the Checkout Session and checking that it is paid in full; that check
 * runs when the artist returns from checkout and again whenever either side
 * opens their bookings, so a closed browser tab cannot leave a paid booking
 * stuck.
 */
import "server-only";
import { createServiceClient } from "@/lib/supabase/server";
import {
  createAccountOnboardingLink,
  createConnectedAccount,
  createDirectChargeCheckoutSession,
  getConnectedAccountStatus,
  getStripeClient,
} from "@/lib/stripe-connect";
import { dayLabel, type PayoutStatus } from "@/lib/stagecraft-shared";
import {
  StagecraftError,
  confirmDepositPaid,
  getDepositBookingForArtist,
  getOwnVenue,
  listAwaitingDeposit,
  saveDepositSession,
  type DepositBooking,
} from "@/lib/stagecraft";

const STRIPE_OFF = "Card payments aren't switched on for Stagecraft yet.";

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

async function connectedAccountIdFor(userId: string): Promise<string | null> {
  const { data, error } = await createServiceClient()
    .from("connect_accounts")
    .select("stripe_account_id")
    .eq("user_id", userId)
    .order("created_at", { ascending: true })
    .limit(1);
  if (error) throw new StagecraftError("Could not check your payout setup.", 502);
  return (data as { stripe_account_id: string }[] | null)?.[0]?.stripe_account_id ?? null;
}

/** Live from Stripe: can this venue owner take deposits right now? */
export async function getPayoutStatus(userId: string): Promise<PayoutStatus> {
  if (!isStripeConfigured()) return { stripeConfigured: false, hasAccount: false, ready: false };
  const accountId = await connectedAccountIdFor(userId);
  if (!accountId) return { stripeConfigured: true, hasAccount: false, ready: false };
  try {
    const status = await getConnectedAccountStatus(accountId);
    return { stripeConfigured: true, hasAccount: true, ready: status.readyToProcessPayments };
  } catch (error) {
    console.error("[stagecraft] payout status failed", error instanceof Error ? error.message : error);
    throw new StagecraftError("Could not reach Stripe to check your payout setup. Try again in a minute.", 502);
  }
}

/**
 * Starts (or resumes) Stripe onboarding for the venue owner and returns the
 * Stripe-hosted link to send them to.
 */
export async function startPayoutOnboarding(user: { id: string; email?: string }, origin: string): Promise<string> {
  if (!isStripeConfigured()) throw new StagecraftError(STRIPE_OFF, 503);
  const venue = await getOwnVenue(user.id);
  if (!venue) throw new StagecraftError("Create your venue first, then set up payouts.", 409);

  let accountId = await connectedAccountIdFor(user.id);
  try {
    if (!accountId) {
      const account = await createConnectedAccount({
        displayName: venue.name,
        contactEmail: venue.contactEmail || user.email || "",
      });
      accountId = account.id as string;
      const { error } = await createServiceClient().from("connect_accounts").insert({
        user_id: user.id,
        stripe_account_id: accountId,
        display_name: venue.name,
        contact_email: venue.contactEmail || user.email || null,
      });
      if (error) throw new StagecraftError("Could not save your payout setup.", 502);
    }
    const link = await createAccountOnboardingLink({
      accountId,
      refreshUrl: `${origin}/dashboard?tab=venue&payouts=retry`,
      returnUrl: `${origin}/dashboard?tab=venue&payouts=done`,
    });
    if (!link?.url) throw new Error("Stripe returned no onboarding link");
    return link.url as string;
  } catch (error) {
    if (error instanceof StagecraftError) throw error;
    console.error("[stagecraft] payout onboarding failed", error instanceof Error ? error.message : error);
    throw new StagecraftError("Stripe couldn't start payout setup. Try again in a minute.", 502);
  }
}

/** True when Stripe says this Checkout Session was paid in full for this booking's deposit. */
async function sessionIsPaid(booking: DepositBooking): Promise<{ paid: boolean; openUrl: string | null }> {
  const stripe = getStripeClient();
  if (!stripe || !booking.stripeSessionId || !booking.stripeAccountId) return { paid: false, openUrl: null };
  const session = await stripe.checkout.sessions.retrieve(booking.stripeSessionId, {}, { stripeAccount: booking.stripeAccountId });
  const paid = session.payment_status === "paid" && session.amount_total === booking.depositCents;
  return { paid, openUrl: session.status === "open" ? session.url : null };
}

/**
 * Checks Stripe for every booking of this user that is waiting on a deposit
 * and confirms the ones that were paid. Never throws: a Stripe hiccup here
 * must not stop the bookings list from loading.
 */
export async function reconcileDeposits(userId: string): Promise<DepositBooking[]> {
  if (!isStripeConfigured()) return [];
  const confirmed: DepositBooking[] = [];
  try {
    for (const booking of await listAwaitingDeposit(userId)) {
      try {
        const { paid } = await sessionIsPaid(booking);
        if (paid && (await confirmDepositPaid(booking.id, booking.stripeSessionId as string))) confirmed.push(booking);
      } catch (error) {
        console.error("[stagecraft] deposit check failed", booking.id, error instanceof Error ? error.message : error);
      }
    }
  } catch (error) {
    console.error("[stagecraft] deposit reconcile failed", error instanceof Error ? error.message : error);
  }
  return confirmed;
}

export type DepositCheckout =
  | { outcome: "checkout"; url: string }
  | { outcome: "already_paid"; booking: DepositBooking; justConfirmed: boolean };

/**
 * The artist pays the deposit. Reuses a checkout that is still open instead
 * of creating a second one, so nobody can pay the same deposit twice.
 */
export async function startDepositCheckout(userId: string, bookingId: string, origin: string): Promise<DepositCheckout> {
  if (!isStripeConfigured()) throw new StagecraftError(STRIPE_OFF, 503);
  const booking = await getDepositBookingForArtist(userId, bookingId);
  if (booking.status === "confirmed") return { outcome: "already_paid", booking, justConfirmed: false };
  if (booking.status !== "accepted" || booking.depositCents <= 0) {
    throw new StagecraftError("There's no deposit to pay on this booking.", 409);
  }

  try {
    if (booking.stripeSessionId) {
      const existing = await sessionIsPaid(booking);
      if (existing.paid) {
        const justConfirmed = await confirmDepositPaid(booking.id, booking.stripeSessionId);
        return { outcome: "already_paid", booking, justConfirmed };
      }
      if (existing.openUrl) return { outcome: "checkout", url: existing.openUrl };
    }

    const accountId = await connectedAccountIdFor(booking.venueOwnerId);
    if (!accountId) throw new StagecraftError("This venue hasn't finished its payout setup yet. Ask them to finish it, then try again.", 409);
    const status = await getConnectedAccountStatus(accountId);
    if (!status.readyToProcessPayments) {
      throw new StagecraftError("This venue can't take card payments yet. Ask them to finish their payout setup.", 409);
    }

    const session = await createDirectChargeCheckoutSession({
      accountId,
      productName: `Deposit: ${booking.venueName}, ${dayLabel(booking.eventDate)}`,
      unitAmountCents: booking.depositCents,
      currency: "usd",
      quantity: 1,
      applicationFeeAmountCents: booking.platformFeeCents,
      customerEmail: booking.artistEmail,
      successUrl: `${origin}/dashboard?tab=requests&deposit=paid`,
      cancelUrl: `${origin}/dashboard?tab=requests&deposit=cancelled`,
    });
    if (!session.url) throw new Error("Stripe returned no checkout link");
    await saveDepositSession(booking.id, session.id, accountId);
    return { outcome: "checkout", url: session.url };
  } catch (error) {
    if (error instanceof StagecraftError) throw error;
    console.error("[stagecraft] deposit checkout failed", error instanceof Error ? error.message : error);
    throw new StagecraftError("Stripe couldn't start the payment. Try again in a minute.", 502);
  }
}
