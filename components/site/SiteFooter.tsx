import Link from "next/link";
import { BrandLockup } from "@/components/ui/primitives";
import { ARTISPRENEUR_URL, TAGLINE } from "@/lib/site";

const COLUMNS: Array<{ heading: string; links: Array<{ label: string; href: string; external?: boolean }> }> = [
  {
    heading: "Stagecraft",
    links: [
      { label: "Find a venue", href: "/venues" },
      { label: "Artist directory", href: "/artists" },
      { label: "List your venue", href: "/dashboard?tab=venue" },
      { label: "My bookings", href: "/dashboard" },
    ],
  },
  {
    heading: "Artispreneur",
    links: [
      { label: "Industry directory", href: `${ARTISPRENEUR_URL}/directory`, external: true },
      { label: "Playbooks", href: `${ARTISPRENEUR_URL}/services`, external: true },
      { label: "Build your EPK", href: `${ARTISPRENEUR_URL}/services/create-an-epk`, external: true },
      { label: "Pricing", href: `${ARTISPRENEUR_URL}/pricing`, external: true },
    ],
  },
  {
    heading: "Learn",
    links: [
      { label: "Academy", href: `${ARTISPRENEUR_URL}/academy`, external: true },
      { label: "Get official", href: `${ARTISPRENEUR_URL}/official`, external: true },
      { label: "Contract templates", href: `${ARTISPRENEUR_URL}/contracts`, external: true },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Terms", href: `${ARTISPRENEUR_URL}/legal/terms`, external: true },
      { label: "Privacy", href: `${ARTISPRENEUR_URL}/legal/privacy`, external: true },
      { label: "Refunds", href: `${ARTISPRENEUR_URL}/legal/refunds`, external: true },
    ],
  },
];

export default function SiteFooter() {
  return (
    <footer className="border-t border-line bg-white text-ink">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.5fr_repeat(4,1fr)] lg:px-8">
        <div>
          <BrandLockup tone="light" size={38} />
          <p className="mt-4 pb-1 font-display text-xl font-semibold italic leading-[1.1] text-brand">{TAGLINE}</p>
          <p className="mt-3 max-w-xs text-sm leading-relaxed text-ink-soft">
            Stagecraft is the venue side of Artispreneur: where independent artists and venues book shows.
          </p>
        </div>
        {COLUMNS.map((col) => (
          <div key={col.heading}>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-ink-faint">{col.heading}</p>
            <ul className="mt-4 space-y-2.5">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link href={l.href} {...(l.external ? { target: "_blank", rel: "noopener" } : {})} className="text-sm text-ink-soft transition-colors hover:text-brand">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-line bg-muted/40">
        <div className="mx-auto flex max-w-7xl flex-col gap-2 px-4 py-6 text-xs text-ink-faint sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-8">
          <p>&copy; {new Date().getFullYear()} Artispreneur, Inc. {TAGLINE}</p>
          <a href="mailto:hello@artispreneur.com" className="font-medium text-ink-soft hover:text-brand">hello@artispreneur.com</a>
        </div>
      </div>
    </footer>
  );
}
