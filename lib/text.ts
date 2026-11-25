/**
 * Small text and input-cleaning helpers shared by the browser, API routes and tests.
 * Pure functions only: no database, no server-only imports.
 */

/** "Blue Room!" -> "blue-room". Always matches the database check: ^[a-z0-9]+(-[a-z0-9]+)*$ */
export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
}

export function isValidSlug(value: string): boolean {
  return /^[a-z0-9]+(-[a-z0-9]+)*$/.test(value) && value.length <= 60;
}

const URL_MAX = 500;
const EMAIL_MAX = 200;

/** Collapses whitespace, trims and caps the length. Anything that is not a string becomes "". */
export function cleanText(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\s+/g, " ").trim().slice(0, max);
}

/**
 * Only http(s) links are ever stored (blocks javascript: and friends).
 * "example.com/x" becomes "https://example.com/x". Returns "" when unusable.
 */
export function normalizeUrl(value: unknown): string {
  const raw = cleanText(value, URL_MAX);
  if (!raw || raw.startsWith("@")) return "";
  const withScheme = /^[a-z][a-z0-9+.-]*:/i.test(raw) ? raw : `https://${raw}`;
  try {
    const url = new URL(withScheme);
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    if (!url.hostname.includes(".")) return "";
    return url.toString();
  } catch {
    return "";
  }
}

export function normalizeEmail(value: unknown): string {
  const email = cleanText(value, EMAIL_MAX).toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : "";
}
