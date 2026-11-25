/** Where the sign-in email link lands: swaps the one-time code for a session, then sends the person on. */
import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { safeNext } from "@/lib/safe-next";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams, origin } = req.nextUrl;
  const next = safeNext(searchParams.get("next"));
  const code = searchParams.get("code");

  if (code && isSupabaseConfigured()) {
    const { error } = await createServerAuthClient().auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(`${origin}${next}`);
  }
  return NextResponse.redirect(`${origin}/login?error=link&next=${encodeURIComponent(next)}`);
}
