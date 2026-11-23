import { NextRequest, NextResponse } from "next/server";
import { createServerAuthClient, isSupabaseConfigured } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  if (isSupabaseConfigured()) {
    try {
      await createServerAuthClient().auth.signOut();
    } catch {
      // Sending them home is still the right outcome.
    }
  }
  return NextResponse.redirect(`${req.nextUrl.origin}/`, { status: 303 });
}
