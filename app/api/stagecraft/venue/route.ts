/**
 * GET /api/stagecraft/venue — the signed-in user's venue (or null), its
 *   calendar, and whether it can take deposits yet.
 * PUT /api/stagecraft/venue — create or update that venue. One per account.
 */
import { NextRequest, NextResponse } from "next/server";
import { cleanVenueInput, type PayoutStatus } from "@/lib/stagecraft-shared";
import { getAvailability, getOwnVenue, saveOwnVenue } from "@/lib/stagecraft";
import { getPayoutStatus } from "@/lib/stagecraft-payments";
import { readJsonObject, requireStagecraftUser, stagecraftErrorResponse } from "@/lib/stagecraft-http";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStagecraftUser();
  if ("error" in auth) return auth.error;
  try {
    const venue = await getOwnVenue(auth.user.id);
    const availability = venue ? await getAvailability(venue.id) : { blocked: [], booked: [] };
    // A Stripe outage should not hide the venue editor, so payouts can be "unknown".
    let payouts: PayoutStatus | null = null;
    try {
      payouts = await getPayoutStatus(auth.user.id);
    } catch {
      payouts = null;
    }
    return NextResponse.json({ venue, availability, payouts, accountEmail: auth.user.email ?? "" });
  } catch (error) {
    return stagecraftErrorResponse(error, "Could not load your venue.");
  }
}

export async function PUT(req: NextRequest) {
  const auth = await requireStagecraftUser();
  if ("error" in auth) return auth.error;
  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Venue details are invalid." }, { status: 422 });

  const cleaned = cleanVenueInput(body, auth.user.email);
  if (!cleaned.ok) return NextResponse.json({ error: cleaned.error }, { status: 422 });

  try {
    const venue = await saveOwnVenue(auth.user.id, cleaned.value);
    return NextResponse.json({ ok: true, venue });
  } catch (error) {
    return stagecraftErrorResponse(error, "Could not save your venue.");
  }
}
