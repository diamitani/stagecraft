import type { CSSProperties } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Buildings,
  CalendarCheck,
  CreditCard,
  Handshake,
  MagnifyingGlass,
  MapPin,
  MicrophoneStage,
  Storefront,
  Ticket,
  UsersThree,
} from "@phosphor-icons/react/dist/ssr";
import { HeroFan, SectionIntro } from "@/components/marketing/home/visuals";
import { CalendarVisual, InboxVisual, SponsorVisual, STAGE_FAN } from "@/components/marketing/home/stage-visuals";
import StagecraftWaitlistForm from "@/components/stagecraft/StagecraftWaitlistForm";
import { PLATFORM_FEE_PERCENT, VENUE_TYPE_LABELS, formatMoney, type Venue } from "@/lib/stagecraft-shared";
import { ARTISPRENEUR_URL } from "@/lib/site";
import "@/components/marketing/home/home.css";

const VENUE_MARKS = [
  { name: "Clubs", icon: MicrophoneStage },
  { name: "Theaters", icon: Buildings },
  { name: "Bars & lounges", icon: Storefront },
  { name: "Cafes", icon: Storefront },
  { name: "Galleries", icon: Buildings },
  { name: "House shows", icon: UsersThree },
  { name: "Outdoor stages", icon: MapPin },
  { name: "Studios", icon: MicrophoneStage },
];

const SIDES = [
  {
    name: "For venues",
    pitch: "List your room once. Get requests in one inbox.",
    includes: ["A public page with your capacity, pricing and what the room has", "A calendar to block nights you can't do", "Accept or decline, and ask for a deposit if you take one"],
    href: "/dashboard?tab=venue",
    cta: "List my venue",
    icon: Storefront,
    tag: "Free to list",
  },
  {
    name: "For artists",
    pitch: "Find a room that fits, then ask for a night.",
    includes: ["Search by city, size and the music a venue books", "Pick an open date and tell the venue about the show", "Pay the deposit by card once the venue says yes"],
    href: "/venues",
    cta: "Find a venue",
    icon: MagnifyingGlass,
    tag: "Free to request",
  },
  {
    name: "Sponsors & fans",
    pitch: "Back the shows you care about. Buy tickets direct.",
    includes: ["Sponsor a booked show", "Fans buy tickets straight from the artist and venue", "Not built yet. Join the list to hear first"],
    href: "#join",
    cta: "Join the list",
    icon: Handshake,
    tag: "Coming next",
  },
];

const STEPS = [
  { icon: Storefront, title: "A venue lists its room", body: "Capacity, the music it books, what the room has, and an honest starting price. Open dates come from the venue's own calendar." },
  { icon: MagnifyingGlass, title: "An artist finds it", body: "Search the directory by city, size and style. Every venue page shows which nights are still open." },
  { icon: CalendarCheck, title: "The artist asks for a night", body: "Pick an open date and tell the venue about the show. Sending a request costs nothing." },
  { icon: CreditCard, title: "The venue says yes, the date is held", body: "If the venue asks for a deposit, the artist pays by card and the date is confirmed. No deposit, confirmed on accept." },
];

export default function StagecraftHome({ venues, artistCount }: { venues: Venue[]; artistCount: number }) {
  const cities = new Set(venues.map((v) => v.city.toLowerCase())).size;
  const preview = venues.slice(0, 6);

  const faqs = [
    { q: "Does it cost anything to request a date?", a: "No. Artists send requests for free, and nothing is charged until a venue accepts and asks for a deposit." },
    { q: "How do deposits work?", a: `If a venue asks for one, the artist pays by card on Stripe's checkout page and the money goes straight to the venue's own Stripe account. Stagecraft keeps ${PLATFORM_FEE_PERCENT}% of the deposit. Venues that don't take deposits pay nothing.` },
    { q: "Who sees my email address?", a: "A venue sees the artist's email on the request. An artist sees the venue's booking email only after the venue accepts. Public pages never show anyone's email." },
    { q: "Can a date be booked twice?", a: "No. When a venue accepts a request, that date is held and comes off the public calendar. The database itself blocks two held bookings on the same night." },
    { q: "What about sponsorships and tickets?", a: "They are planned and not built yet. The sign-up form below is how you hear when they open." },
  ];

  return (
    <div className="hv3 -mt-[58px] overflow-x-clip pb-6" style={{ "--font-sans": "var(--font-sans)" } as CSSProperties}>
      {/* 1. Hero */}
      <section className="relative overflow-hidden pb-16 pt-[102px] sm:pt-[118px]">
        <div className="hv-streaks pointer-events-none absolute inset-x-0 top-0 -z-0 h-[720px]" aria-hidden="true" />
        <div className="relative mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <Link href="/venues" className="hv-chip transition-colors hover:text-[color:var(--hv-ink)]">
              <span className="rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white">New</span>
              Venue booking for independent artists
              <ArrowRight className="h-3.5 w-3.5 text-brand" />
            </Link>
            <h1 className="mt-6 font-display text-[2.75rem] font-medium leading-[1.04] tracking-[-0.02em] text-[color:var(--hv-ink)] sm:text-6xl lg:text-[5rem]">
              Find the room.{" "}
              <em className="font-display italic text-brand">Book the night.</em>
            </h1>
            <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[color:var(--hv-ink-soft)] sm:text-lg">
              Stagecraft is the venue side of Artispreneur. Venues list their room and open dates. Artists browse the directory, ask for a night, and lock it in with a deposit.
            </p>
            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <Link href="/venues" className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-7 text-sm font-semibold text-white shadow-ap transition-colors hover:bg-brand-deep">
                Find a venue <ArrowRight className="h-4 w-4" />
              </Link>
              <Link href="/dashboard?tab=venue" className="inline-flex h-12 items-center gap-2 rounded-full border border-[color:var(--hv-line)] bg-[color:var(--hv-card)] px-7 text-sm font-semibold text-[color:var(--hv-ink)] transition-colors hover:border-[color:var(--hv-ink)]">
                List your venue
              </Link>
            </div>
          </div>
          <div className="mt-12"><HeroFan cards={STAGE_FAN} /></div>
        </div>
      </section>

      {/* 2. Marquee */}
      <section className="border-y border-[color:var(--hv-line)] py-8">
        <div className="mx-auto flex max-w-[1120px] flex-col items-center gap-6 px-4 sm:px-6 lg:flex-row lg:px-8">
          <p className="shrink-0 text-center text-sm leading-snug text-[color:var(--hv-ink-soft)] lg:max-w-[220px] lg:border-r lg:border-[color:var(--hv-line)] lg:pr-8 lg:text-left">
            Built for every kind of room where live music happens.
          </p>
          <div className="hv-marquee w-full overflow-hidden">
            <div className="hv-marquee-track gap-12">
              {[...VENUE_MARKS, ...VENUE_MARKS].map((mark, i) => (
                <span key={`${mark.name}-${i}`} className="flex shrink-0 items-center gap-2 text-[color:var(--hv-ink-soft)]" aria-hidden={i >= VENUE_MARKS.length ? "true" : undefined}>
                  <mark.icon className="h-5 w-5" weight="duotone" />
                  <span className="whitespace-nowrap font-display text-lg">{mark.name}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3. Three sides */}
      <section className="scroll-mt-24 py-20 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <SectionIntro chip="Start here" title="One stage," accent="three ways in." body="Whether you run the room, play the room, or back the night, Stagecraft keeps the booking in one place." />
          <div className="mt-14 grid gap-5 md:grid-cols-3">
            {SIDES.map((s) => (
              <Link key={s.name} href={s.href} className="hv-reveal group flex flex-col rounded-[24px] border border-[color:var(--hv-line)] bg-[color:var(--hv-card)] p-7 transition-transform hover:-translate-y-1 hover:shadow-ap-xl">
                <div className="flex items-start justify-between gap-2">
                  <span className="grid h-11 w-11 place-items-center rounded-2xl bg-[color:var(--hv-cream-2)] text-brand"><s.icon className="h-6 w-6" weight="duotone" /></span>
                  <span className="rounded-full bg-muted px-2.5 py-1 text-xs font-bold text-ink">{s.tag}</span>
                </div>
                <h3 className="mt-5 font-display text-2xl text-[color:var(--hv-ink)]">{s.name}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[color:var(--hv-ink-soft)]">{s.pitch}</p>
                <ul className="mt-4 flex-1 list-disc space-y-0.5 pl-5 text-sm text-[color:var(--hv-ink)]">{s.includes.map((d) => <li key={d}>{d}</li>)}</ul>
                <span className="mt-6 inline-flex items-center gap-2 border-t border-[color:var(--hv-line)] pt-4 text-xs font-bold text-brand">{s.cta} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" /></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Directory preview (real listings only) */}
      <section className="scroll-mt-24 border-t border-[color:var(--hv-line)] bg-white py-20 sm:py-24" id="directory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <SectionIntro chip="The directory" title="Browse the rooms." accent="Check the dates." body="Every listing is added by the venue itself, with its own capacity, pricing and open nights." />
          <dl className="mx-auto mt-10 grid max-w-3xl grid-cols-3 gap-px overflow-hidden rounded-2xl border border-[color:var(--hv-line)] bg-[color:var(--hv-line)] text-center">
            {[
              { label: "Venues", value: venues.length },
              { label: "Cities", value: cities },
              { label: "Artists", value: artistCount },
            ].map((s) => (
              <div key={s.label} className="bg-white px-4 py-5">
                <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-[color:var(--hv-ink-soft)]">{s.label}</dt>
                <dd className="mt-1 font-display text-3xl font-bold tabular-nums text-brand">{s.value}</dd>
              </div>
            ))}
          </dl>

          {preview.length > 0 ? (
            <div className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {preview.map((v) => (
                <Link key={v.id} href={`/venues/${v.slug}`} className="group flex flex-col rounded-[20px] border border-[color:var(--hv-line)] bg-[color:var(--hv-card)] p-5 transition-transform hover:-translate-y-1 hover:shadow-ap-lg">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-display text-xl text-[color:var(--hv-ink)] group-hover:text-brand">{v.name}</h3>
                    <span className="shrink-0 rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-ink-soft">{VENUE_TYPE_LABELS[v.venueType]}</span>
                  </div>
                  <p className="mt-2 flex items-center gap-1 text-xs text-[color:var(--hv-ink-soft)]"><MapPin className="h-3.5 w-3.5" />{[v.city, v.region].filter(Boolean).join(", ")}{v.capacity ? ` · ${v.capacity.toLocaleString("en-US")} capacity` : ""}</p>
                  <p className="mt-3 text-sm font-semibold text-ink">{v.rentalFeeCents === null ? "Ask for pricing" : v.rentalFeeCents === 0 ? "No rental fee" : `From ${formatMoney(v.rentalFeeCents)}`}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="mx-auto mt-10 max-w-xl rounded-[20px] border border-dashed border-[color:var(--hv-line)] p-8 text-center">
              <p className="font-display text-xl text-[color:var(--hv-ink)]">No venues are listed yet.</p>
              <p className="mt-1 text-sm text-[color:var(--hv-ink-soft)]">Stagecraft is new. List your room and you&apos;ll be the first one artists find.</p>
            </div>
          )}

          <div className="mt-10 flex flex-wrap justify-center gap-3">
            <Link href="/venues" className="inline-flex h-12 items-center gap-2 rounded-full bg-brand px-7 text-sm font-semibold text-white shadow-ap transition-colors hover:bg-brand-deep">Open the venue directory <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/artists" className="inline-flex h-12 items-center gap-2 rounded-full border border-[color:var(--hv-line)] bg-[color:var(--hv-card)] px-7 text-sm font-semibold text-[color:var(--hv-ink)] transition-colors hover:border-[color:var(--hv-ink)]">Browse artists</Link>
          </div>
        </div>
      </section>

      {/* 5. How it works */}
      <section id="how" className="scroll-mt-24 border-t border-[color:var(--hv-line)] py-20 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div>
              <SectionIntro align="left" chip="How it works" title="From first look" accent="to a booked night." body="No back-and-forth over scattered emails. Every request, answer and deposit lives in one dashboard." />
              <ol className="mt-8 space-y-4">
                {STEPS.map((s, i) => (
                  <li key={s.title} className="flex gap-4">
                    <span className="grid h-10 w-10 shrink-0 place-items-center rounded-2xl bg-[color:var(--hv-cream-2)] text-brand"><s.icon className="h-5 w-5" weight="duotone" /></span>
                    <div>
                      <p className="font-display text-lg text-[color:var(--hv-ink)]"><span className="mr-2 font-mono text-xs tracking-[0.2em] text-[color:var(--hv-ink-soft)]">0{i + 1}</span>{s.title}</p>
                      <p className="mt-1 text-sm leading-relaxed text-[color:var(--hv-ink-soft)]">{s.body}</p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
            <div className="hv-reveal"><InboxVisual /></div>
          </div>
        </div>
      </section>

      <section className="border-t border-[color:var(--hv-line)] py-20 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-2">
            <div className="hv-reveal order-2 lg:order-1"><CalendarVisual /></div>
            <div className="order-1 lg:order-2">
              <SectionIntro align="left" chip="Your calendar" title="Your nights," accent="your call." body="Block the nights you can't do. When you accept a request that date comes off the public calendar, so no one can ask for it twice." />
              <Link href="/dashboard?tab=venue" className="mt-8 inline-flex h-12 items-center gap-2 rounded-full bg-brand px-7 text-sm font-semibold text-white shadow-ap transition-colors hover:bg-brand-deep">List my venue <ArrowRight className="h-4 w-4" /></Link>
            </div>
          </div>
        </div>
      </section>

      {/* 6. Coming next + waitlist */}
      <section id="join" className="scroll-mt-24 border-t border-[color:var(--hv-line)] py-20 sm:py-24">
        <div className="mx-auto max-w-[1120px] px-4 sm:px-6 lg:px-8">
          <div className="grid items-start gap-10 lg:grid-cols-2">
            <div>
              <SectionIntro align="left" chip="Coming next" title="Sponsors and tickets" accent="are on the way." body="Sponsoring a booked show and selling tickets straight to fans are planned and not built yet. Leave your email and we'll write when they open, and when venues start listing in your city." />
              <ul className="mt-6 space-y-3 text-sm text-[color:var(--hv-ink)]">
                <li className="flex items-center gap-3"><Handshake className="h-5 w-5 text-brand" weight="duotone" />Sponsor a booked show</li>
                <li className="flex items-center gap-3"><Ticket className="h-5 w-5 text-brand" weight="duotone" />Tickets that fans buy directly</li>
              </ul>
              <div className="mt-8 hidden lg:block"><SponsorVisual /></div>
            </div>
            <StagecraftWaitlistForm />
          </div>
        </div>
      </section>

      {/* 7. FAQ */}
      <section className="border-t border-[color:var(--hv-line)] py-20 sm:py-24">
        <div className="mx-auto grid max-w-[1120px] gap-10 px-4 sm:px-6 lg:grid-cols-[0.8fr_1.2fr] lg:px-8">
          <div>
            <SectionIntro align="left" chip="FAQ" title="Questions," accent="answered." body="Clear answers on fees, deposits and who sees what." />
            <a href={`${ARTISPRENEUR_URL}/support`} target="_blank" rel="noopener" className="mt-6 inline-flex items-center gap-1.5 text-sm font-bold text-brand hover:underline">Still curious? Contact support <ArrowRight className="h-4 w-4" /></a>
          </div>
          <div className="space-y-3">
            {faqs.map((f) => (
              <details key={f.q} className="group rounded-[18px] border border-[color:var(--hv-line)] bg-[color:var(--hv-card)] px-5 py-4 open:shadow-ap">
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-display text-lg text-[color:var(--hv-ink)]">
                  {f.q}
                  <span className="shrink-0 text-brand transition-transform group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-relaxed text-[color:var(--hv-ink-soft)]">{f.a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* 8. Closing CTA */}
      <section className="px-2 sm:px-4">
        <div className="hv-glow relative mx-auto max-w-[1120px] overflow-hidden rounded-[32px] px-6 py-20 text-center sm:py-24">
          <p className="text-xs font-bold uppercase tracking-[0.18em] text-[rgb(42_26_16/0.7)]">Art Means Business</p>
          <h2 className="mx-auto mt-4 max-w-3xl font-display text-4xl leading-[1.08] text-[color:var(--hv-ink)] sm:text-6xl">
            Every night on the calendar <em className="italic">is a night you own.</em>
          </h2>
          <p className="mx-auto mt-5 max-w-xl text-base leading-relaxed text-[rgb(42_26_16/0.8)] sm:text-lg">Listing a venue and requesting a date are both free. Deposits are optional and go straight to the venue.</p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link href="/venues" className="inline-flex h-12 items-center gap-2 rounded-full bg-[color:var(--hv-espresso)] px-7 text-sm font-semibold text-white transition-colors hover:bg-black">Find a venue <ArrowRight className="h-4 w-4" /></Link>
            <Link href="/dashboard?tab=venue" className="inline-flex h-12 items-center gap-2 rounded-full bg-white/85 px-7 text-sm font-semibold text-[color:var(--hv-ink)] transition-colors hover:bg-white">List your venue</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
