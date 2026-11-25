/**
 * POST /api/stagecraft/waitlist — join the Stagecraft interest list as a
 * venue, artist, sponsor or fan. Public: no sign-in needed.
 */
import { NextRequest, NextResponse } from "next/server";
import { getRequestUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { cleanWaitlistInput } from "@/lib/stagecraft-shared";
import { joinWaitlist } from "@/lib/stagecraft";
import { readJsonObject, stagecraftErrorResponse, tooManyRequests } from "@/lib/stagecraft-http";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await readJsonObject(req);
  if (!body) return NextResponse.json({ error: "Those details are invalid." }, { status: 422 });

  const cleaned = cleanWaitlistInput(body);
  if (!cleaned.ok) return NextResponse.json({ error: cleaned.error }, { status: 422 });

  if (!isSupabaseConfigured()) {
    return NextResponse.json({ error: "The list isn't open yet. Please check back soon." }, { status: 503 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const limited = await tooManyRequests(`ip:${ip}`, "stagecraft-waitlist");
  if (limited) return limited;

  try {
    const user = await getRequestUser();
    await joinWaitlist(cleaned.value, user?.id ?? null);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return stagecraftErrorResponse(error, "Could not add you to the list. Please try again.");
  }
}
