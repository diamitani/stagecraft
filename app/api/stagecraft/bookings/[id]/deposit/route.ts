/**
 * POST /api/stagecraft/bookings/[id]/deposit — the artist pays the deposit
 * on an accepted booking. Returns { url } for Stripe's hosted checkout, or
 * { alreadyPaid: true } when the deposit has in fact been paid.
 */
import { NextRequest, NextResponse } from "next/server";
import { startDepositCheckout } from "@/lib/stagecraft-payments";
import { notifyVenueOfDeposit } from "@/lib/stagecraft-email";
import { requireStagecraftUser, stagecraftErrorResponse } from "@/lib/stagecraft-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireStagecraftUser();
  if ("error" in auth) return auth.error;
  try {
    const result = await startDepositCheckout(auth.user.id, params.id, req.nextUrl.origin);
    if (result.outcome === "already_paid") {
      if (result.justConfirmed) await notifyVenueOfDeposit(result.booking.venueContactEmail, result.booking);
      return NextResponse.json({ ok: true, alreadyPaid: true });
    }
    return NextResponse.json({ ok: true, url: result.url });
  } catch (error) {
    return stagecraftErrorResponse(error, "Could not start the deposit payment.");
  }
}
