import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle, Globe, MapPin, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { getRequestUser, isSupabaseConfigured } from "@/lib/supabase/server";
import { getAvailability, getVenueBySlug, userOwnsVenue } from "@/lib/stagecraft";
import { AMENITY_LABELS, VENUE_TYPE_LABELS, formatMoney, todayDay } from "@/lib/stagecraft-shared";
import { absoluteUrl } from "@/lib/site";
import { Notice } from "@/components/ui/primitives";
import VenueBookingPanel from "@/components/stagecraft/VenueBookingPanel";

type Props = { params: { slug: string } };

// Reads the signed-in viewer and the live calendar, so render per request.
export const dynamic = "force-dynamic";

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const venue = await getVenueBySlug(params.slug);
  if (!venue) return { title: "Venue not found", robots: { index: false } };
  const place = [venue.city, venue.region].filter(Boolean).join(", ");
  const title = `${venue.name}, ${place} | Book this venue`;
  const description = venue.description
    ? venue.description.slice(0, 160)
    : `${venue.name} is a ${VENUE_TYPE_LABELS[venue.venueType].toLowerCase()} in ${place}. Check open dates and send a booking request.`;
  const url = absoluteUrl(`/venues/${venue.slug}`);
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { type: "website", siteName: "Stagecraft", title, description, url, ...(venue.imageUrl ? { images: [{ url: venue.imageUrl, alt: venue.name }] } : {}) },
  };
}

export default async function VenuePage({ params }: Props) {
  const viewer = isSupabaseConfigured() ? await getRequestUser() : null;
  const venue = await getVenueBySlug(params.slug, viewer?.id);
  if (!venue) notFound();

  const today = todayDay();
  const isOwner = viewer ? await userOwnsVenue(viewer.id, venue.slug) : false;

  // If the calendar can't be read, say so instead of showing every date as open.
  let unavailable: string[] | null = null;
  try {
    const availability = await getAvailability(venue.id, today);
    unavailable = Array.from(new Set([...availability.blocked, ...availability.booked]));
  } catch {
    unavailable = null;
  }

  const place = [venue.city, venue.region].filter(Boolean).join(", ");

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
      <Link href="/venues" className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-soft hover:text-brand">
        <ArrowLeft className="h-4 w-4" />All venues
      </Link>

      {!venue.isPublished ? (
        <div className="mt-4"><Notice tone="warn">This page is hidden. Only you can see it. Publish it from your venue dashboard.</Notice></div>
      ) : null}

      <div className="mt-6 grid gap-10 lg:grid-cols-[minmax(0,1fr)_26rem]">
        <div className="min-w-0">
          {venue.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- venue photos come from any host the owner pastes
            <img src={venue.imageUrl} alt={`${venue.name} venue photo`} className="mb-6 aspect-[16/9] w-full rounded-ap border border-line object-cover" />
          ) : null}

          <p className="ap-eyebrow">{VENUE_TYPE_LABELS[venue.venueType]}</p>
          <h1 className="mt-2 break-words font-display text-4xl font-bold leading-tight text-ink sm:text-5xl">{venue.name}</h1>

          <div className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-soft">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-4 w-4" />{venue.address ? `${venue.address}, ${place}` : place}</span>
            {venue.capacity ? <span className="inline-flex items-center gap-1.5"><UsersThree className="h-4 w-4" />Holds {venue.capacity.toLocaleString("en-US")}</span> : null}
            {venue.websiteUrl ? (
              <a href={venue.websiteUrl} target="_blank" rel="noopener noreferrer nofollow" className="inline-flex items-center gap-1.5 font-semibold text-brand hover:underline">
                <Globe className="h-4 w-4" />Website
              </a>
            ) : null}
          </div>

          <dl className="mt-6 grid gap-4 rounded-ap border border-line bg-muted p-5 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Rental fee</dt>
              <dd className="mt-1 font-display text-xl font-bold text-ink">
                {venue.rentalFeeCents === null ? "Ask the venue" : venue.rentalFeeCents === 0 ? "No rental fee" : `From ${formatMoney(venue.rentalFeeCents)}`}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-wide text-ink-faint">Deposit to hold a date</dt>
              <dd className="mt-1 font-display text-xl font-bold text-ink">{venue.depositCents > 0 ? formatMoney(venue.depositCents) : "None listed"}</dd>
            </div>
          </dl>

          {venue.description ? (
            <section className="mt-8" aria-labelledby="about-heading">
              <h2 id="about-heading" className="font-display text-xl font-bold text-ink">About this venue</h2>
              <p className="mt-2 whitespace-pre-line text-[15px] leading-relaxed text-ink-soft">{venue.description}</p>
            </section>
          ) : null}

          {venue.genres.length > 0 ? (
            <section className="mt-8" aria-labelledby="genres-heading">
              <h2 id="genres-heading" className="font-display text-xl font-bold text-ink">Music they book</h2>
              <ul className="mt-3 flex flex-wrap gap-2">
                {venue.genres.map((genre) => <li key={genre} className="rounded-full border border-line bg-card px-3 py-1 text-sm font-medium text-ink-soft">{genre}</li>)}
              </ul>
            </section>
          ) : null}

          {venue.amenities.length > 0 ? (
            <section className="mt-8" aria-labelledby="amenities-heading">
              <h2 id="amenities-heading" className="font-display text-xl font-bold text-ink">What the room has</h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {venue.amenities.map((amenity) => (
                  <li key={amenity} className="flex items-center gap-2 text-sm text-ink-soft"><CheckCircle className="h-4 w-4 shrink-0 text-success" weight="fill" />{AMENITY_LABELS[amenity]}</li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          {unavailable === null ? (
            <Notice tone="warn">This venue&apos;s calendar couldn&apos;t be loaded right now. Refresh the page to try again.</Notice>
          ) : (
            <VenueBookingPanel
              venueSlug={venue.slug}
              venueName={venue.name}
              today={today}
              unavailable={unavailable}
              depositCents={venue.depositCents}
              signedIn={Boolean(viewer)}
              isOwner={isOwner}
              defaultArtistName=""
              defaultEmail={viewer?.email ?? ""}
            />
          )}
        </aside>
      </div>
    </div>
  );
}
