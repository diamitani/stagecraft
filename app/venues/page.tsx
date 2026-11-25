import { DirectoryHero } from "@/components/directory/DirectoryHero";
import { DirectoryTabs } from "@/components/directory/DirectoryTabs";
import VenuesDirectoryClient from "@/components/stagecraft/VenuesDirectoryClient";
import { ButtonLink } from "@/components/ui/button";
import { listPublicVenues } from "@/lib/stagecraft";
import { listPublicArtists } from "@/lib/artists";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Venue Directory | Find a Venue to Play | Stagecraft",
  description: "Browse venues for live music by city, type, size and the music they book. Check open dates and send a booking request straight to the venue.",
  path: "/venues",
});

// A venue must show up the moment its owner saves it, so never serve a cached copy.
export const dynamic = "force-dynamic";

export default async function VenuesPage({ searchParams }: { searchParams: { city?: string } }) {
  const [venues, artists] = await Promise.all([listPublicVenues(), listPublicArtists()]);
  const cities = new Set(venues.map((v) => v.city.toLowerCase())).size;
  const genres = new Set(venues.flatMap((v) => v.genres.map((g) => g.toLowerCase()))).size;
  const withCapacity = venues.filter((v) => v.capacity);
  const largest = withCapacity.length ? Math.max(...withCapacity.map((v) => v.capacity as number)) : 0;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DirectoryHero
        eyebrow="Stagecraft directory"
        title="Find a venue. Ask for a night."
        sub="Every room on Stagecraft lists its capacity, pricing and open dates. Pick a date and send the venue a booking request."
        stats={[
          { label: "Venues", value: String(venues.length), hint: "listed by their owners" },
          { label: "Cities", value: String(cities) },
          { label: "Music styles", value: String(genres), hint: "booked across venues" },
          { label: "Largest room", value: largest ? largest.toLocaleString("en-US") : "0", hint: largest ? "capacity" : "no rooms yet" },
        ]}
        action={<ButtonLink href="/dashboard?tab=venue" variant="gold">List my venue</ButtonLink>}
      />
      <div className="mt-6">
        <DirectoryTabs active="venues" venueCount={venues.length} artistCount={artists.length} />
      </div>
      <VenuesDirectoryClient venues={venues} initialCity={searchParams.city ?? ""} />
    </div>
  );
}
