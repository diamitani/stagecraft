/**
 * GET  /api/stagecraft/bookings — the signed-in user's bookings: requests
 *   they sent as an artist and requests their venue received.
 * POST /api/stagecraft/bookings — an artist asks a venue for a date.
 *   Body: { venueSlug, eventDate, eventType, expectedAttendance, artistName, artistEmail, message }
 */
import { NextRequest, NextResponse } from "next/server";
import { cleanBookingInput, todayDay } from "@/lib/stagecraft-shared";
import { cleanText } from "@/lib/text";
import { createBooking, listMyBookings } from "@/lib/stagecraft";
import { reconcileDeposits } from "@/lib/stagecraft-payments";
import { notifyVenueOfDeposit, notifyVenueOfRequest } from "@/lib/stagecraft-email";
import { readJsonObject, requireStagecraftUser, stagecraftErrorResponse, tooManyRequests } from "@/lib/stagecraft-http";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireStagecraftUser();
  if ("error" in auth) return auth.error;
  try {
    // Catch any deposit that was paid since we last looked, then list.
    const justPaid = await reconcileDeposits(auth.user.id);
    for (const paid of justPaid) {
      await notifyVenueOfDeposit(paid.venueContactEmail, paid);
    }
    const bookings = await listMyBookings(auth.user.id);
    return NextResponse.json({ ...bookings, depositsJustConfirmed: justPaid.length });
  } catch (error) {
    return stagecraftErrorResponse(error, "Could not load your bookings.");
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireStagecraftUser();
  if ("error" in auth) return auth.error;
  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Request details are invalid." }, { status: 422 });

  const cleaned = cleanBookingInput(body, { today: todayDay(), fallbackEmail: auth.user.email });
  if (!cleaned.ok) return NextResponse.json({ error: cleaned.error }, { status: 422 });

  const limited = await tooManyRequests(auth.user.id, "stagecraft-booking");
  if (limited) return limited;

  try {
    const result = await createBooking(auth.user, cleanText(body.venueSlug, 80), cleaned.value);
    await notifyVenueOfRequest(result.venueContactEmail, result.booking);
    return NextResponse.json({ ok: true, booking: result.booking }, { status: 201 });
  } catch (error) {
    return stagecraftErrorResponse(error, "Could not send your request.");
  }
}
