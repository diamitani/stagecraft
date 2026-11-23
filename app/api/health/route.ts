import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

/**
 * GET /api/health: a quick "is the site up, and which settings are filled in" check.
 * Reports only yes/no for each setting, never the values.
 */
export function GET() {
  const has = (...names: string[]) => names.every((name) => Boolean(process.env[name]));
  return NextResponse.json({
    ok: true,
    database: has("NEXT_PUBLIC_SUPABASE_URL", "NEXT_PUBLIC_SUPABASE_ANON_KEY", "SUPABASE_SERVICE_ROLE_KEY"),
    stripe: has("STRIPE_SECRET_KEY"),
    email: has("RESEND_API_KEY"),
  });
}
