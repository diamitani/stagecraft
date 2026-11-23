/**
 * Small helpers shared by the /api/stagecraft routes (server-only).
 */
import "server-only";
import { NextResponse } from "next/server";
import { getRequestUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { checkEndpointRateLimit } from "@/lib/rate-limit";
import { StagecraftError } from "@/lib/stagecraft";

export type StagecraftUser = { id: string; email?: string };

/** The signed-in user, or the JSON error response to return instead. */
export async function requireStagecraftUser(): Promise<{ user: StagecraftUser } | { error: NextResponse }> {
  if (!isSupabaseConfigured()) {
    return { error: NextResponse.json({ error: "Stagecraft isn't connected to the database yet." }, { status: 503 }) };
  }
  const user = await getRequestUser();
  if (!user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  return { user };
}

/** Turns a thrown error into a JSON response. Only StagecraftError messages are shown to the user. */
export function stagecraftErrorResponse(error: unknown, fallback: string): NextResponse {
  if (error instanceof StagecraftError) return NextResponse.json({ error: error.message }, { status: error.status });
  console.error("[stagecraft]", fallback, error instanceof Error ? error.message : error);
  return NextResponse.json({ error: fallback }, { status: 502 });
}

export async function readJsonObject(req: Request): Promise<Record<string, unknown> | null> {
  const body = await req.json().catch(() => null);
  return body && typeof body === "object" && !Array.isArray(body) ? (body as Record<string, unknown>) : null;
}

/** A 429 response when this caller is going too fast, otherwise null. */
export async function tooManyRequests(key: string, endpoint: string): Promise<NextResponse | null> {
  const rate = await checkEndpointRateLimit(key, endpoint);
  if (rate.allowed) return null;
  return NextResponse.json(
    { error: "You're doing that a lot. Give it a minute and try again." },
    { status: 429, headers: { "Retry-After": String(Math.max(1, Math.ceil(rate.retryAfterSeconds))) } },
  );
}
