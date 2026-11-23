import VenuesDirectoryClient from "@/components/stagecraft/VenuesDirectoryClient";
import { listPublicVenues } from "@/lib/stagecraft";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Find a Venue | Stagecraft",
  description: "Browse venues for live music, check their open dates, and send a booking request straight to the venue.",
  path: "/venues",
});

// A venue must show up the moment its owner saves it, so never serve a cached copy.
export const dynamic = "force-dynamic";

export default async function VenuesPage() {
  const venues = await listPublicVenues();
  return <VenuesDirectoryClient venues={venues} />;
}
