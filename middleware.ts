import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";

/**
 * Keeps the sign-in session fresh. Supabase tokens expire, and refreshing one means writing new
 * cookies, which a page render is not allowed to do, so it happens here first.
 * Does nothing when Supabase is not configured (for example, a local run without keys).
 */
export async function middleware(request: NextRequest) {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let response = NextResponse.next({ request });
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll: (toSet) => {
        toSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        toSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
      },
    },
  });
  try {
    await supabase.auth.getUser();
  } catch {
    // A Supabase outage must not take the public pages down.
  }
  return response;
}

export const config = {
  matcher: ["/dashboard/:path*", "/api/:path*", "/login", "/auth/:path*"],
};
