import type { Metadata } from "next";

export const SITE_NAME = "Stagecraft";
export const TAGLINE = "Art Means Business.";

/** The main Artispreneur site. Stagecraft is its venue side, so account, EPK and directory links point there. */
export const ARTISPRENEUR_URL = (process.env.NEXT_PUBLIC_ARTISPRENEUR_URL || "https://www.artispreneur.com").replace(/\/$/, "");

/** Public address of this site, used in emails and link previews. Set NEXT_PUBLIC_SITE_URL in production. */
export const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` : "") ||
  "http://localhost:3000"
).replace(/\/$/, "");

export function absoluteUrl(path: string): string {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

export function artispreneurUrl(path: string): string {
  return `${ARTISPRENEUR_URL}${path.startsWith("/") ? path : `/${path}`}`;
}

/** Title, description, canonical link and link-preview tags for a page. */
export function pageMetadata(input: { title: string; description: string; path: string }): Metadata {
  const url = absoluteUrl(input.path);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: SITE_NAME, title: input.title, description: input.description, url },
    twitter: { card: "summary", title: input.title, description: input.description },
  };
}
