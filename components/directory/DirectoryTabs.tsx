import Link from "next/link";
import { cn } from "@/lib/utils";
import { ARTISPRENEUR_URL } from "@/lib/site";

export type DirectoryTab = "venues" | "artists";

/** Directory sub-navigation: Venues and Artists live here; Industry contacts live on Artispreneur. */
export function DirectoryTabs({ active, venueCount, artistCount }: { active: DirectoryTab; venueCount: number; artistCount: number }) {
  const tabs: { id: DirectoryTab; label: string; href: string; count: number }[] = [
    { id: "venues", label: "Venues", href: "/venues", count: venueCount },
    { id: "artists", label: "Artists", href: "/artists", count: artistCount },
  ];
  return (
    <nav aria-label="Directory sections" className="flex flex-wrap items-center gap-1 border-b border-line">
      {tabs.map((t) => {
        const on = t.id === active;
        return (
          <Link
            key={t.id}
            href={t.href}
            aria-current={on ? "page" : undefined}
            className={cn(
              "-mb-px inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors",
              on ? "border-brand text-ink" : "border-transparent text-ink-soft hover:text-ink",
            )}
          >
            {t.label}
            <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-bold tabular-nums text-ink-soft">{t.count}</span>
          </Link>
        );
      })}
      <a
        href={`${ARTISPRENEUR_URL}/directory`}
        target="_blank"
        rel="noopener"
        className="-mb-px ml-auto border-b-2 border-transparent px-4 py-3 text-sm font-semibold text-ink-soft transition-colors hover:text-ink"
      >
        Industry contacts on Artispreneur
      </a>
    </nav>
  );
}
