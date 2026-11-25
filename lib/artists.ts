/**
 * Artist profiles (server-only, read only). Reads the artist_listings table, the same table that
 * powers the artist directory on artispreneur.com. Artists claim and edit their page there.
 */
import "server-only";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isValidSlug } from "@/lib/text";
import type { ArtistLinks, ArtistListing } from "@/lib/artists-shared";

const COLUMNS = "id,slug,name,genre,city,bio,image_url,website_url,booking_email,links,status,is_published";

interface Row {
  id: string;
  slug: string;
  name: string;
  genre: string | null;
  city: string | null;
  bio: string | null;
  image_url: string | null;
  website_url: string | null;
  booking_email: string | null;
  links: ArtistLinks | null;
  status: "unclaimed" | "claimed";
  is_published: boolean;
}

function toListing(row: Row): ArtistListing {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    genre: row.genre ?? "",
    city: row.city ?? "",
    bio: row.bio ?? "",
    imageUrl: row.image_url ?? "",
    websiteUrl: row.website_url ?? "",
    bookingEmail: row.booking_email ?? "",
    links: row.links && typeof row.links === "object" ? row.links : {},
    status: row.status,
    isPublished: row.is_published,
  };
}

/** Published artists for the directory. Empty list if the database isn't configured or can't be read. */
export async function listPublicArtists(limit = 500): Promise<ArtistListing[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createServiceClient()
    .from("artist_listings")
    .select(COLUMNS)
    .eq("is_published", true)
    .order("name", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("[artists] list failed", error.message);
    return [];
  }
  return (data as Row[]).map(toListing);
}

export async function getArtistBySlug(slug: string): Promise<ArtistListing | null> {
  if (!isSupabaseConfigured() || !isValidSlug(slug)) return null;
  const { data, error } = await createServiceClient()
    .from("artist_listings")
    .select(COLUMNS)
    .eq("slug", slug)
    .eq("is_published", true)
    .maybeSingle();
  if (error || !data) return null;
  return toListing(data as Row);
}
