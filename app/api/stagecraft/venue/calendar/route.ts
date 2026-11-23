/**
 * POST /api/stagecraft/venue/calendar — the venue owner marks one day as
 * unavailable ({ day, blocked: true }) or opens it back up (blocked: false).
 * Returns the updated calendar.
 */
import { NextRequest, NextResponse } from "next/server";
import { isValidDay } from "@/lib/stagecraft-shared";
import { getAvailability, getOwnVenue, setBlockedDay } from "@/lib/stagecraft";
import { readJsonObject, requireStagecraftUser, stagecraftErrorResponse } from "@/lib/stagecraft-http";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireStagecraftUser();
  if ("error" in auth) return auth.error;
  const body = await readJsonObject(req);
  if (!body || !isValidDay(body.day) || typeof body.blocked !== "boolean") {
    return NextResponse.json({ error: "Pick a date from the calendar." }, { status: 422 });
  }
  try {
    await setBlockedDay(auth.user.id, body.day, body.blocked);
    const venue = await getOwnVenue(auth.user.id);
    const availability = venue ? await getAvailability(venue.id) : { blocked: [], booked: [] };
    return NextResponse.json({ ok: true, availability });
  } catch (error) {
    return stagecraftErrorResponse(error, "Could not update your calendar.");
  }
}
