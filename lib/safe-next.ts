/** Only same-site paths are allowed as a "go here after sign-in" target. Blocks open redirects. */
export function safeNext(value: unknown, fallback = "/dashboard"): string {
  if (typeof value !== "string") return fallback;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return fallback;
  return value.slice(0, 300);
}

export function loginHrefFor(next: unknown): string {
  return `/login?next=${encodeURIComponent(safeNext(next))}`;
}
