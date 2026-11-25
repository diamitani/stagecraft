/**
 * PATCH /api/stagecraft/bookings/[id] — accept, decline or cancel a booking.
 *   Body: { action: "accept" | "decline" | "cancel", deposit?, note? }
 *   - accept / decline: the venue owner only.
 *   - cancel: either side.
 *   - deposit (dollars) applies to accept. Leave it out to use the venue's
 *     usual deposit; send 0 for no deposit.
 */
import { NextRequest, NextResponse } from "next/server";
import { cleanText } from "@/lib/text";
import { BOOKING_LIMITS, MIN_DEPOSIT_CENTS, dollarsToCents, isBookingAction } from "@/lib/stagecraft-shared";
import { actOnBooking, getBookingActionContext } from "@/lib/stagecraft";
import { getPayoutStatus } from "@/lib/stagecraft-payments";
import { notifyArtistOfAnswer, notifyVenueOfCancellation } from "@/lib/stagecraft-email";
import { readJsonObject, requireStagecraftUser, stagecraftErrorResponse } from "@/lib/stagecraft-http";

export const dynamic = "force-dynamic";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireStagecraftUser();
  if ("error" in auth) return auth.error;
  const body = await readJsonObject(req);
  if (!body || !isBookingAction(body.action)) {
    return NextResponse.json({ error: "Choose accept, decline or cancel." }, { status: 422 });
  }
  const action = body.action;

  try {
    const context = await getBookingActionContext(auth.user.id, params.id);

    let depositCents = 0;
    if (action === "accept") {
      const typed = dollarsToCents(body.deposit);
      if (!typed.ok) return NextResponse.json({ error: "Deposit should be a dollar amount, like 100." }, { status: 422 });
      depositCents = typed.cents ?? context.venueDefaultDepositCents;
      if (depositCents > 0 && depositCents < MIN_DEPOSIT_CENTS) {
        return NextResponse.json({ error: "A deposit has to be at least $1. Use 0 for no deposit." }, { status: 422 });
      }
      // Asking for a deposit only makes sense if the venue can actually be paid.
      if (depositCents > 0 && context.actor === "venue") {
        const payouts = await getPayoutStatus(auth.user.id);
        if (!payouts.stripeConfigured) {
          return NextResponse.json({ error: "Card payments aren't switched on for Stagecraft yet. Accept with a deposit of 0 for now." }, { status: 409 });
        }
        if (!payouts.ready) {
          return NextResponse.json({ error: "Finish your payout setup before asking for a deposit, or accept with a deposit of 0." }, { status: 409 });
        }
      }
    }

    const result = await actOnBooking(auth.user.id, params.id, action, {
      depositCents,
      note: cleanText(body.note, BOOKING_LIMITS.note),
    });

    if (result.actor === "venue") await notifyArtistOfAnswer(result.notifyEmail, result.booking);
    else await notifyVenueOfCancellation(result.notifyEmail, result.booking);

    return NextResponse.json({ ok: true, booking: result.booking });
  } catch (error) {
    return stagecraftErrorResponse(error, "Could not update that booking.");
  }
}
