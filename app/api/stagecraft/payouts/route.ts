/**
 * POST /api/stagecraft/payouts — the venue owner starts (or resumes) Stripe
 * payout setup. Returns { url } for Stripe's hosted onboarding.
 * The current payout status comes back with GET /api/stagecraft/venue.
 */
import { NextRequest, NextResponse } from "next/server";
import { startPayoutOnboarding } from "@/lib/stagecraft-payments";
import { requireStagecraftUser, stagecraftErrorResponse } from "@/lib/stagecraft-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireStagecraftUser();
  if ("error" in auth) return auth.error;
  try {
    const url = await startPayoutOnboarding(auth.user, req.nextUrl.origin);
    return NextResponse.json({ ok: true, url });
  } catch (error) {
    return stagecraftErrorResponse(error, "Could not start payout setup.");
  }
}
