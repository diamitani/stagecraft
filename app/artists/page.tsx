import { DirectoryHero } from "@/components/directory/DirectoryHero";
import { DirectoryTabs } from "@/components/directory/DirectoryTabs";
import ArtistsDirectoryClient from "@/components/artists/ArtistsDirectoryClient";
import { ButtonLink } from "@/components/ui/button";
import { listPublicVenues } from "@/lib/stagecraft";
import { listPublicArtists } from "@/lib/artists";
import { primaryGenre } from "@/lib/artists-shared";
import { artispreneurUrl, pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Independent Artist Directory | Stagecraft",
  description: "Discover independent artists from the Artispreneur community and find the venues where they play.",
  path: "/artists",
});

export const dynamic = "force-dynamic";

export default async function ArtistsPage() {
  const [venues, artists] = await Promise.all([listPublicVenues(), listPublicArtists()]);
  const cities = new Set(artists.map((a) => a.city.toLowerCase()).filter(Boolean)).size;
  const genres = new Set(artists.map((a) => primaryGenre(a.genre).toLowerCase()).filter(Boolean)).size;
  const claimed = artists.filter((a) => a.status === "claimed").length;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <DirectoryHero
        eyebrow="Artist directory"
        title="Independent artists, ready to book."
        sub="Artist pages come from the Artispreneur community. Find who is playing in your city, then offer them a night at your venue."
        stats={[
          { label: "Artists", value: String(artists.length), hint: "with public pages" },
          { label: "Claimed pages", value: String(claimed), hint: "run by the artist" },
          { label: "Cities", value: String(cities) },
          { label: "Genres", value: String(genres) },
        ]}
        action={<ButtonLink href={artispreneurUrl("/app/workspace?tab=record#public-page")} variant="gold">Create my artist page</ButtonLink>}
      />
      <div className="mt-6">
        <DirectoryTabs active="artists" venueCount={venues.length} artistCount={artists.length} />
      </div>
      <ArtistsDirectoryClient artists={artists} />
    </div>
  );
}
