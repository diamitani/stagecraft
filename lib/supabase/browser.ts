"use client";

import { createBrowserClient } from "@supabase/ssr";

/** The browser-side Supabase client. Used only for sign-in; all data goes through the API routes. */
export function createBrowserAuthClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  return createBrowserClient(url, key);
}
