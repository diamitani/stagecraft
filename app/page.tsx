import StagecraftHome from "@/components/marketing/home/StagecraftHome";
import { listPublicVenues } from "@/lib/stagecraft";
import { listPublicArtists } from "@/lib/artists";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Stagecraft | Book Venues and Shows | Artispreneur",
  description: "Stagecraft is the venue side of Artispreneur. Venues list their room and open dates, artists ask for a night, and the venue says yes.",
  path: "/",
});

// Shows the live venue and artist counts, so it is never served from a cache.
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [venues, artists] = await Promise.all([listPublicVenues(), listPublicArtists()]);
  return <StagecraftHome venues={venues} artistCount={artists.length} />;
}
