"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, MagnifyingGlass, MapPin, UsersThree } from "@phosphor-icons/react";
import { ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/stagecraft/fields";
import { VENUE_TYPES, VENUE_TYPE_LABELS, formatMoney, venueMatchesSearch, type Venue } from "@/lib/stagecraft-shared";
import { cn } from "@/lib/utils";

const CAPACITY_BANDS = [
  { id: "any", label: "Any size", min: 0, max: Infinity },
  { id: "small", label: "Up to 100", min: 0, max: 100 },
  { id: "medium", label: "101 to 500", min: 101, max: 500 },
  { id: "large", label: "501 and up", min: 501, max: Infinity },
] as const;

type Sort = "name" | "large" | "small";

function priceLine(venue: Venue): string {
  if (venue.rentalFeeCents === null) return "Ask for pricing";
  if (venue.rentalFeeCents === 0) return "No rental fee";
  return `From ${formatMoney(venue.rentalFeeCents)}`;
}

export default function VenuesDirectoryClient({ venues, initialCity = "" }: { venues: Venue[]; initialCity?: string }) {
  const [search, setSearch] = useState("");
  const [type, setType] = useState("all");
  const [size, setSize] = useState<(typeof CAPACITY_BANDS)[number]["id"]>("any");
  const [city, setCity] = useState(initialCity);
  const [genre, setGenre] = useState("all");
  const [sort, setSort] = useState<Sort>("name");

  const typesInUse = useMemo(() => VENUE_TYPES.filter((t) => venues.some((v) => v.venueType === t)), [venues]);
  const cities = useMemo(() => {
    const counts = new Map<string, number>();
    for (const v of venues) counts.set(v.city, (counts.get(v.city) ?? 0) + 1);
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
  }, [venues]);
  const genres = useMemo(() => {
    const set = new Set<string>();
    for (const v of venues) for (const g of v.genres) set.add(g);
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  }, [venues]);

  const filtered = useMemo(() => {
    const band = CAPACITY_BANDS.find((b) => b.id === size) ?? CAPACITY_BANDS[0];
    const list = venues.filter((venue) => {
      if (!venueMatchesSearch(venue, search)) return false;
      if (type !== "all" && venue.venueType !== type) return false;
      if (city && venue.city.toLowerCase() !== city.toLowerCase()) return false;
      if (genre !== "all" && !venue.genres.some((g) => g.toLowerCase() === genre.toLowerCase())) return false;
      if (band.id !== "any" && (venue.capacity === null || venue.capacity < band.min || venue.capacity > band.max)) return false;
      return true;
    });
    return [...list].sort((a, b) => {
      if (sort === "large") return (b.capacity ?? -1) - (a.capacity ?? -1) || a.name.localeCompare(b.name);
      if (sort === "small") return (a.capacity ?? Infinity) - (b.capacity ?? Infinity) || a.name.localeCompare(b.name);
      return a.name.localeCompare(b.name);
    });
  }, [venues, search, type, size, city, genre, sort]);

  const filtering = Boolean(search || type !== "all" || size !== "any" || city || genre !== "all");

  function clear() {
    setSearch("");
    setType("all");
    setSize("any");
    setCity("");
    setGenre("all");
  }

  if (venues.length === 0) {
    return (
      <div className="mt-10 rounded-ap border border-dashed border-line bg-card p-10 text-center">
        <h2 className="font-display text-2xl font-bold text-ink">No venues listed yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">Stagecraft is brand new. If you run a room, list it now and you will be the first venue artists see here.</p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          <ButtonLink href="/dashboard?tab=venue">List my venue</ButtonLink>
          <ButtonLink href="/#how" variant="secondary">How Stagecraft works</ButtonLink>
        </div>
      </div>
    );
  }

  return (
    <>
      {cities.length > 1 ? (
        <div className="mt-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">Browse by city</p>
          <div className="mt-2 flex flex-wrap gap-1.5">
            <button type="button" onClick={() => setCity("")} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", !city ? "bg-brand text-white shadow-ap" : "border border-line bg-card text-ink-soft hover:border-brand hover:text-brand")}>All cities</button>
            {cities.slice(0, 14).map(([name, count]) => (
              <button
                key={name}
                type="button"
                onClick={() => setCity(name)}
                aria-pressed={city.toLowerCase() === name.toLowerCase()}
                className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", city.toLowerCase() === name.toLowerCase() ? "bg-brand text-white shadow-ap" : "border border-line bg-card text-ink-soft hover:border-brand hover:text-brand")}
              >
                {name} <span className="opacity-70">{count}</span>
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_10rem_10rem_10rem_10rem]">
        <div className="relative sm:col-span-2 lg:col-span-1">
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
        <Select aria-label="Music they book" value={genre} onChange={(e) => setGenre(e.target.value)}>
          <option value="all">Any music</option>
          {genres.map((g) => <option key={g} value={g}>{g}</option>)}
        </Select>
        <Select aria-label="Sort" value={sort} onChange={(e) => setSort(e.target.value as Sort)}>
          <option value="name">Name A to Z</option>
          <option value="large">Largest first</option>
          <option value="small">Smallest first</option>
        </Select>
      </div>

      <div className="mt-4 flex items-center justify-between gap-3">
        <p className="text-sm text-ink-faint" aria-live="polite">
          {filtered.length === venues.length ? `${venues.length} ${venues.length === 1 ? "venue" : "venues"}` : `${filtered.length} of ${venues.length} venues`}
        </p>
        {filtering ? <button type="button" onClick={clear} className="text-sm font-semibold text-brand hover:underline">Clear filters</button> : null}
      </div>

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
                    {venue.genres.slice(0, 4).map((g) => <span key={g} className="rounded-full border border-line px-2 py-0.5 text-[11px] font-medium text-ink-soft">{g}</span>)}
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
  );
}
