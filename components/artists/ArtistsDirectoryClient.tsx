"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle, MagnifyingGlass, MapPin } from "@phosphor-icons/react";
import { ButtonLink } from "@/components/ui/button";
import { artispreneurUrl } from "@/lib/site";
import { primaryGenre, type ArtistListing } from "@/lib/artists-shared";
import { cn } from "@/lib/utils";

export default function ArtistsDirectoryClient({ artists }: { artists: ArtistListing[] }) {
  const [search, setSearch] = useState("");
  const [selectedGenre, setSelectedGenre] = useState("all");

  const genres = useMemo(() => {
    const list = Array.from(new Set(artists.map((a) => primaryGenre(a.genre)).filter(Boolean))).sort((a, b) => a.localeCompare(b));
    return ["all", ...list.slice(0, 12)];
  }, [artists]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return artists.filter((artist) => {
      const matchSearch = !q || [artist.name, artist.city, artist.genre, artist.bio].some((value) => value.toLowerCase().includes(q));
      const matchGenre = selectedGenre === "all" || primaryGenre(artist.genre).toLowerCase() === selectedGenre.toLowerCase();
      return matchSearch && matchGenre;
    });
  }, [artists, search, selectedGenre]);

  if (artists.length === 0) {
    return (
      <div className="mt-10 rounded-ap border border-dashed border-line bg-card p-10 text-center">
        <h2 className="font-display text-2xl font-bold text-ink">No artists listed yet</h2>
        <p className="mx-auto mt-2 max-w-md text-sm text-ink-soft">Artist pages are created on Artispreneur and show up here automatically. Create yours for free.</p>
        <div className="mt-6 flex justify-center"><ButtonLink href={artispreneurUrl("/app/workspace?tab=record#public-page")}>Create my artist page</ButtonLink></div>
      </div>
    );
  }

  return (
    <>
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 sm:max-w-md">
          <MagnifyingGlass className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-faint" />
          <input
            type="search"
            placeholder="Search by name, city, or style..."
            aria-label="Search artists"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-[10px] border border-line bg-card py-2.5 pl-10 pr-4 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </div>
        {genres.length > 1 ? (
          <div className="flex flex-wrap gap-1.5">
            {genres.map((g) => (
              <button
                key={g}
                type="button"
                onClick={() => setSelectedGenre(g)}
                aria-pressed={selectedGenre === g}
                className={cn("rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", selectedGenre === g ? "bg-brand text-white shadow-ap" : "border border-line bg-card text-ink-soft hover:border-brand hover:text-brand")}
              >
                {g === "all" ? "All genres" : g}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <p className="mt-4 text-sm text-ink-faint" aria-live="polite">{filtered.length === artists.length ? `${artists.length} artists` : `${filtered.length} of ${artists.length} artists`}</p>

      {filtered.length === 0 ? (
        <p className="mt-6 rounded-ap border border-line bg-card p-8 text-center text-sm text-ink-soft">No artists match that search.</p>
      ) : (
        <div className="mt-4 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((artist) => (
            <article key={artist.id} className="group relative flex flex-col rounded-ap border border-line bg-card p-6 shadow-ap transition-all duration-200 hover:-translate-y-1 hover:border-brand/60 hover:shadow-lg">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-display text-xl font-bold text-ink group-hover:text-brand">
                    <Link href={`/artists/${artist.slug}`} className="after:absolute after:inset-0">{artist.name}</Link>
                  </h2>
                  {artist.city ? (
                    <div className="mt-1 flex items-center gap-1 text-xs text-ink-soft"><MapPin className="h-3.5 w-3.5" /><span>{artist.city}</span></div>
                  ) : null}
                </div>
                {artist.genre ? <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-brand">{artist.genre}</span> : null}
              </div>
              {artist.bio ? <p className="mt-3 line-clamp-3 text-xs leading-relaxed text-ink-soft">{artist.bio}</p> : null}
              <div className="mt-5 flex items-center justify-between border-t border-line/60 pt-4 text-xs">
                {artist.status === "claimed" ? (
                  <span className="inline-flex items-center gap-1 font-semibold text-emerald-700"><CheckCircle className="h-4 w-4" weight="fill" />Claimed</span>
                ) : (
                  <span className="font-semibold text-gold-ink">Unclaimed</span>
                )}
                <span className="inline-flex items-center gap-1 font-bold text-brand">View page<ArrowRight className="h-3.5 w-3.5" /></span>
              </div>
            </article>
          ))}
        </div>
      )}
    </>
  );
}
