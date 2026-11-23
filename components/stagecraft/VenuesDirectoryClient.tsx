"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MagnifyingGlass, MapPin, UsersThree } from "@phosphor-icons/react";
import { ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/stagecraft/fields";
import { VENUE_TYPES, VENUE_TYPE_LABELS, formatMoney, venueMatchesSearch, type Venue } from "@/lib/stagecraft-shared";

const CAPACITY_BANDS = [
  { id: "any", label: "Any size", min: 0, max: Infinity },
  { id: "small", label: "Up to 100", min: 0, max: 100 },
  { id: "medium", label: "101 to 500", min: 101, max: 500 },
  { id: "large", label: "501 and up", min: 501, max: Infinity },
] as const;

function priceLine(venue: Venue): string {
  if (venue.rentalFeeCents === null) return "Ask for pricing";
  if (venue.rentalFeeCents === 0) return "No rental fee";
  return `From ${formatMoney(venue.rentalFeeCents)}`;
}

export default function VenuesDirectoryClient({ venues }: { venues: Venue[] }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [size, setSize] = useState<(typeof CAPACITY_BANDS)[number]["id"]>("any");

  const typesInUse = useMemo(() => VENUE_TYPES.filter((t) => venues.some((v) => v.venueType === t)), [venues]);

  const filtered = useMemo(() => {
    const band = CAPACITY_BANDS.find((b) => b.id === size) ?? CAPACITY_BANDS[0];
    return venues.filter((venue) => {
      if (!venueMatchesSearch(venue, search)) return false;
      if (type !== "all" && venue.venueType !== type) return false;
      if (band.id !== "any" && (venue.capacity === null || venue.capacity < band.min || venue.capacity > band.max)) return false;
      return true;
    });
  }, [venues, search, type, size]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-col justify-between gap-6 border-b border-line pb-8 md:flex-row md:items-end">
        <div>
          <p className="ap-eyebrow">Stagecraft</p>
          <h1 className="mt-2 font-display text-4xl font-bold tracking-tight text-ink sm:text-5xl">Find a venue</h1>
          <p className="mt-2 max-w-2xl text-base text-ink-soft">
            Browse places to play, check their open dates, and send a booking request straight to the venue.
          </p>
        </div>
        <ButtonLink href="/dashboard?tab=venue" variant="secondary">List my venue</ButtonLink>
      </div>

      {venues.length > 0 ? (
        <>
          <div className="mt-8 grid gap-3 sm:grid-cols-[minmax(0,1fr)_12rem_12rem]">
            <div className="relative">
              <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
              <input
                type="search"
                placeholder="Search by name, city, or style of music"
                aria-label="Search venues"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-[10px] border border-line bg-card py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              />
            </div>
            <Select aria-label="Venue type" value={type} onChange={(e) => setType(e.target.value)}>
              <option value="all">All types</option>
              {typesInUse.map((t) => <option key={t} value={t}>{VENUE_TYPE_LABELS[t]}</option>)}
            </Select>
            <Select aria-label="Capacity" value={size} onChange={(e) => setSize(e.target.value as typeof size)}>
              {CAPACITY_BANDS.map((band) => <option key={band.id} value={band.id}>{band.label}</option>)}
            </Select>
          </div>

          <p className="mt-4 text-sm text-ink-faint" aria-live="polite">
            {filtered.length === venues.length ? `${venues.length} ${venues.length === 1 ? "venue" : "venues"}` : `${filtered.length} of ${venues.length} venues`}
          </p>

          {filtered.length === 0 ? (
            <p className="mt-6 rounded-ap border border-line bg-card p-8 text-center text-sm text-ink-soft">No venues match that search. Try a different city or clear the filters.</p>
          ) : (
            <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filtered.map((venue) => (
                <article key={venue.id} className="group relative flex flex-col overflow-hidden rounded-ap border border-line bg-card shadow-ap transition-all duration-200 hover:-translate-y-1 hover:border-brand hover:shadow-ap-lg">
                  {venue.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element -- venue photos come from any host the owner pastes
                    <img src={venue.imageUrl} alt="" loading="lazy" className="h-40 w-full object-cover" />
                  ) : null}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <h2 className="min-w-0 font-display text-xl font-bold text-ink group-hover:text-brand">
                        <Link href={`/venues/${venue.slug}`} className="after:absolute after:inset-0">{venue.name}</Link>
                      </h2>
                      <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-ink-soft">{VENUE_TYPE_LABELS[venue.venueType]}</span>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
                      <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{[venue.city, venue.region].filter(Boolean).join(", ")}</span>
                      {venue.capacity ? <span className="inline-flex items-center gap-1"><UsersThree className="h-3.5 w-3.5" />{venue.capacity.toLocaleString("en-US")} capacity</span> : null}
                    </div>
                    {venue.description ? <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-ink-soft">{venue.description}</p> : null}
                    {venue.genres.length > 0 ? (
                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {venue.genres.slice(0, 4).map((genre) => <span key={genre} className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-ink-soft">{genre}</span>)}
                      </div>
                    ) : null}
                    <div className="mt-auto pt-4">
                      <div className="flex items-center justify-between border-t border-line pt-4 text-xs">
                        <span className="font-semibold text-ink">{priceLine(venue)}</span>
                        <span className="inline-flex items-center gap-1 font-bold text-brand">See dates<ArrowRight className="h-3.5 w-3.5" /></span>
                      </div>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          )}
        </>
      ) : (
        <div className="mt-10 rounded-ap border border-dashed border-line bg-card p-10 text-center">
          <h2 className="font-display text-2xl font-bold text-ink">No venues listed yet</h2>
          <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">Stagecraft is brand new. If you run a room, list it now and you will be the first venue artists see here.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/dashboard?tab=venue">List my venue</ButtonLink>
            <ButtonLink href="/" variant="secondary">How Stagecraft works</ButtonLink>
          </div>
        </div>
      )}
    </div>
  );
}
