/**
 * Server-side Supabase clients for Stagecraft.
 *
 * Two clients, both server-only:
 * - Service-role client: bypasses RLS. Used for ALL data reads/writes in
 *   API routes. Access-tier gating (public view vs full table) is enforced
 *   in code, never by trusting the browser.
 * - Anon (SSR) client: used only for Supabase Auth session handling
 *   (cookies). Never exposes the service key.
 *
 * No service key ever reaches the browser.
 */
import "server-only";
import { cookies, headers } from "next/headers";
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function supabaseUrl(): string {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("SUPABASE_URL is not configured");
  return url.replace(/\/$/, "");
}

function serviceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured");
  return key;
}

function anonKey(): string {
  const key = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("SUPABASE_ANON_KEY is not configured");
  return key;
}

/** True when the server can talk to Supabase (both keys present). */
export function isSupabaseConfigured(): boolean {
  return Boolean(
    (process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL) &&
      (process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) &&
      process.env.SUPABASE_SERVICE_ROLE_KEY,
  );
}

/**
 * Service-role client (server-only). Bypasses RLS, so every access rule is enforced in code
 * (see lib/stagecraft.ts).
 */
export function createServiceClient(): SupabaseClient {
  return createClient(supabaseUrl(), serviceRoleKey(), {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * SSR client bound to the request cookies (anon key). Used for Auth:
 * reading the session in server components / route handlers and for the
 * /auth/callback code exchange.
 */
export function createServerAuthClient() {
  const cookieStore = cookies();
  return createServerClient(supabaseUrl(), anonKey(), {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (
        toSet: { name: string; value: string; options?: CookieOptions }[],
      ) => {
        try {
          toSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        } catch {
          // Called from a Server Component render (e.g. the (app) layout
          // calling auth.getUser()): cookie writes are not allowed there.
          // Safe to ignore — the request's existing cookies are still
          // readable via getAll, which is all a page render needs.
        }
      },
    },
  });
}

export interface RequestUser {
  id: string;
  email?: string;
}

/**
 * Resolve the signed-in user for an API route, or null when anonymous.
 *
 * Order: (1) Supabase Auth session cookies via the SSR client;
 * (2) `Authorization: Bearer <access_token>` (lets API clients and tests
 * authenticate without cookies).
 */
export async function getRequestUser(): Promise<RequestUser | null> {
  try {
    const supabase = createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) return { id: user.id, email: user.email ?? undefined };
  } catch {
    // Fall through to the Bearer-token path.
  }

  try {
    const authHeader = headers().get("authorization");
    const match = /^Bearer\s+(.+)$/i.exec(authHeader ?? "");
    if (!match) return null;
    const anon = createClient(supabaseUrl(), anonKey(), {
      auth: { persistSession: false, autoRefreshToken: false },
    });
    const {
      data: { user },
      error,
    } = await anon.auth.getUser(match[1]);
    if (error || !user) return null;
    return { id: user.id, email: user.email ?? undefined };
  } catch {
    return null;
  }
}
