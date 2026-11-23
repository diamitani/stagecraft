/**
 * Stripe Connect helpers (server-only).
 *
 * Every venue gets its own connected Stripe account (created with the Accounts v2 API), so deposits
 * are paid straight to the venue. Stagecraft keeps a platform fee on each deposit.
 *
 * Needs STRIPE_SECRET_KEY. Connect must be enabled on your Stripe account.
 */
import "server-only";
import Stripe from "stripe";

let cached: Stripe | null = null;

/** The shared Stripe client, or null when STRIPE_SECRET_KEY is not set. */
export function getStripeClient(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!cached) cached = new Stripe(key);
  return cached;
}

function requireStripe(): Stripe {
  const stripe = getStripeClient();
  if (!stripe) throw new Error("Missing STRIPE_SECRET_KEY");
  return stripe;
}

/** Creates the venue's connected account. Never pass a top-level `type` with the v2 API. */
export async function createConnectedAccount(params: { displayName: string; contactEmail: string; country?: string }) {
  const stripe = requireStripe();
  return stripe.v2.core.accounts.create({
    display_name: params.displayName,
    contact_email: params.contactEmail,
    identity: { country: params.country ?? "us" },
    dashboard: "full",
    defaults: { responsibilities: { fees_collector: "stripe", losses_collector: "stripe" } },
    configuration: {
      customer: {},
      merchant: { capabilities: { card_payments: { requested: true } } },
    },
  });
}

/** A Stripe-hosted link where the venue adds its business and bank details. */
export async function createAccountOnboardingLink(params: { accountId: string; refreshUrl: string; returnUrl: string }) {
  const stripe = requireStripe();
  return stripe.v2.core.accountLinks.create({
    account: params.accountId,
    use_case: {
      type: "account_onboarding",
      account_onboarding: {
        configurations: ["merchant", "customer"],
        refresh_url: params.refreshUrl,
        return_url: params.returnUrl,
      },
    },
  });
}

export interface ConnectedAccountStatus {
  accountId: string;
  readyToProcessPayments: boolean;
}

/** Live from Stripe: can this account take card payments right now? */
export async function getConnectedAccountStatus(stripeAccountId: string): Promise<ConnectedAccountStatus> {
  const stripe = requireStripe();
  const account = await stripe.v2.core.accounts.retrieve(stripeAccountId, {
    include: ["configuration.merchant", "requirements"],
  });
  const cardPayments = account?.configuration?.merchant?.capabilities?.card_payments?.status ?? null;
  return { accountId: account.id, readyToProcessPayments: cardPayments === "active" };
}

/** A Stripe Checkout page for a one-off charge on the venue's account, with Stagecraft's fee taken out. */
export async function createDirectChargeCheckoutSession(params: {
  accountId: string;
  productName: string;
  unitAmountCents: number;
  currency?: string;
  quantity?: number;
  applicationFeeAmountCents?: number;
  successUrl: string;
  cancelUrl: string;
  customerEmail?: string;
}): Promise<Stripe.Checkout.Session> {
  const stripe = requireStripe();
  const fee = params.applicationFeeAmountCents ?? 0;
  return stripe.checkout.sessions.create(
    {
      mode: "payment",
      line_items: [
        {
          price_data: {
            currency: (params.currency ?? "usd").toLowerCase(),
            product_data: { name: params.productName },
            unit_amount: params.unitAmountCents,
          },
          quantity: params.quantity ?? 1,
        },
      ],
      customer_email: params.customerEmail,
      payment_intent_data: { application_fee_amount: fee > 0 ? fee : undefined },
      success_url: params.successUrl,
      cancel_url: params.cancelUrl,
    },
    { stripeAccount: params.accountId },
  );
}
