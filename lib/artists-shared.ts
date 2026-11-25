/**
 * Artist profile types shared by the browser and the server.
 * These match the artist_listings table that Artispreneur uses, so Stagecraft shows
 * the same artist pages that live on artispreneur.com.
 */

export const LINK_KEYS = ["instagram", "tiktok", "youtube", "spotify", "apple", "soundcloud"] as const;
export type LinkKey = (typeof LINK_KEYS)[number];
export type ArtistLinks = Partial<Record<LinkKey, string>>;

export const LINK_LABELS: Record<LinkKey, string> = {
  instagram: "Instagram",
  tiktok: "TikTok",
  youtube: "YouTube",
  spotify: "Spotify",
  apple: "Apple Music",
  soundcloud: "SoundCloud",
};

/** What the public site is allowed to see. Never includes a private contact email or owner id. */
export interface ArtistListing {
  id: string;
  slug: string;
  name: string;
  genre: string;
  city: string;
  bio: string;
  imageUrl: string;
  websiteUrl: string;
  bookingEmail: string;
  links: ArtistLinks;
  status: "unclaimed" | "claimed";
  isPublished: boolean;
}

/** First genre word ("R&B / Soul" -> "R&B") so filter pills stay short. */
export function primaryGenre(genre: string): string {
  return genre.split(/[\/,]/)[0].trim();
}
