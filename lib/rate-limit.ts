/**
 * A small per-server rate limiter, so nobody can hammer the booking and waitlist endpoints.
 *
 * It keeps counts in memory, so each server instance counts on its own. That is enough to stop
 * accidental floods and simple abuse. If Stagecraft grows, swap this for a shared store
 * (for example a Supabase table or Upstash Redis) without changing the callers.
 */

export interface EndpointRateCheck {
  allowed: boolean;
  retryAfterSeconds: number;
}

const LIMITS: Record<string, { perMinute: number; perHour: number }> = {
  "stagecraft-waitlist": { perMinute: 5, perHour: 30 },
  "stagecraft-booking": { perMinute: 6, perHour: 40 },
};
const DEFAULT_LIMIT = { perMinute: 30, perHour: 300 };

const hits = new Map<string, number[]>();
const HOUR = 3_600_000;
const MINUTE = 60_000;

export async function checkEndpointRateLimit(callerKey: string, endpoint: string): Promise<EndpointRateCheck> {
  const { perMinute, perHour } = LIMITS[endpoint] ?? DEFAULT_LIMIT;
  const key = `${endpoint}:${callerKey}`;
  const now = Date.now();
  const recent = (hits.get(key) ?? []).filter((t) => now - t < HOUR);

  const lastMinute = recent.filter((t) => now - t < MINUTE);
  if (lastMinute.length >= perMinute) {
    return { allowed: false, retryAfterSeconds: Math.ceil((lastMinute[0] + MINUTE - now) / 1000) };
  }
  if (recent.length >= perHour) {
    return { allowed: false, retryAfterSeconds: Math.ceil((recent[0] + HOUR - now) / 1000) };
  }

  recent.push(now);
  hits.set(key, recent);

  // Keep memory bounded: drop idle keys now and then.
  if (hits.size > 5000) {
    for (const [k, times] of hits) if (times.every((t) => now - t >= HOUR)) hits.delete(k);
  }
  return { allowed: true, retryAfterSeconds: 0 };
}
