import { CalendarCheck, CreditCard, Handshake, MagnifyingGlass, Storefront, Ticket } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/primitives";
import StagecraftWaitlistForm from "@/components/stagecraft/StagecraftWaitlistForm";
import { pageMetadata } from "@/lib/site";

export const metadata = pageMetadata({
  title: "Stagecraft | Venue Booking for Independent Artists",
  description:
    "Stagecraft connects independent artists with venues. Venues list their room and open dates, artists request a night, and the venue confirms it.",
  path: "/",
});

const VENUE_STEPS = [
  { title: "List your room", body: "Add your capacity, the music you book, what the room has, and your usual pricing." },
  { title: "Keep your calendar honest", body: "Block the nights you can't do. Booked nights come off the calendar on their own." },
  { title: "Answer requests", body: "Every request lands in one inbox. Accept or decline, and ask for a deposit if you take one." },
];

const ARTIST_STEPS = [
  { title: "Find a room that fits", body: "Search by city, size and style of music. Every venue page shows its open dates." },
  { title: "Ask for a night", body: "Pick an open date and tell the venue about the show. Sending a request is free." },
  { title: "Lock it in", body: "When the venue says yes, pay the deposit by card if they ask for one. The date is yours." },
];

const LIVE_NOW = [
  { icon: Storefront, title: "Venue pages", body: "A public page for every venue with photos, capacity, pricing and what the room has." },
  { icon: MagnifyingGlass, title: "Venue search", body: "Find rooms by name, city, type, size and the music they book." },
  { icon: CalendarCheck, title: "Calendar and booking requests", body: "Open dates on every venue page, and one inbox for the venue to answer requests." },
  { icon: CreditCard, title: "Deposits by card", body: "Venues that take a deposit get paid through Stripe, straight to their own account." },
];

const COMING_NEXT = [
  { icon: Handshake, title: "Sponsor a show", body: "Brands and local businesses will be able to back a booked show and get their name on the night." },
  { icon: Ticket, title: "Tickets", body: "Artists and venues will promote booked shows, and fans will buy tickets directly." },
];

function Steps({ heading, steps, cta }: { heading: string; steps: { title: string; body: string }[]; cta: { href: string; label: string } }) {
  return (
    <div className="rounded-ap border border-line bg-card p-6 shadow-ap">
      <h3 className="font-display text-2xl font-bold text-ink">{heading}</h3>
      <ol className="mt-5 space-y-5">
        {steps.map((step, index) => (
          <li key={step.title} className="flex gap-4">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-ink text-sm font-bold text-white" aria-hidden="true">{index + 1}</span>
            <div>
              <p className="font-semibold text-ink">{step.title}</p>
              <p className="mt-0.5 text-sm leading-relaxed text-ink-soft">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
      <div className="mt-6"><ButtonLink href={cta.href} variant="secondary">{cta.label}</ButtonLink></div>
    </div>
  );
}

export default function StagecraftPage() {
  return (
    <div>
      <section className="border-b border-line bg-muted">
        <div className="mx-auto max-w-5xl px-4 py-16 text-center sm:px-6 sm:py-24">
          <p className="ap-eyebrow">Stagecraft</p>
          <h1 className="mx-auto mt-3 max-w-3xl text-balance font-display text-4xl font-bold leading-tight text-ink sm:text-6xl">
            Where artists and venues book shows
          </h1>
          <p className="mx-auto mt-5 max-w-2xl text-lg leading-relaxed text-ink-soft">
            Venues list their room and their open dates. Artists ask for a night. The venue says yes, and the date is booked.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <ButtonLink href="/venues" size="lg">Find a venue</ButtonLink>
            <ButtonLink href="/dashboard?tab=venue" variant="secondary" size="lg">List my venue</ButtonLink>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-labelledby="how-heading">
        <h2 id="how-heading" className="font-display text-3xl font-bold text-ink">How it works</h2>
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          <Steps heading="If you run a venue" steps={VENUE_STEPS} cta={{ href: "/dashboard?tab=venue", label: "List my venue" }} />
          <Steps heading="If you're an artist" steps={ARTIST_STEPS} cta={{ href: "/venues", label: "Find a venue" }} />
        </div>
      </section>

      <section className="border-y border-line bg-muted" aria-labelledby="whats-heading">
        <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
          <h2 id="whats-heading" className="font-display text-3xl font-bold text-ink">What you can do today, and what&apos;s next</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {LIVE_NOW.map((item) => (
              <div key={item.title} className="rounded-ap border border-line bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <item.icon className="h-6 w-6 text-brand" />
                  <Badge tone="green">Live now</Badge>
                </div>
                <p className="mt-3 font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            ))}
            {COMING_NEXT.map((item) => (
              <div key={item.title} className="rounded-ap border border-dashed border-line bg-card p-5">
                <div className="flex items-center justify-between gap-3">
                  <item.icon className="h-6 w-6 text-ink-faint" />
                  <Badge tone="gold">Not built yet</Badge>
                </div>
                <p className="mt-3 font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-sm leading-relaxed text-ink-soft">{item.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="join" className="mx-auto max-w-3xl px-4 py-16 sm:px-6" aria-labelledby="join-heading">
        <h2 id="join-heading" className="font-display text-3xl font-bold text-ink">Get told when new parts open</h2>
        <p className="mt-2 text-ink-soft">
          Sponsorships and tickets are next. Leave your email and we&apos;ll write to you when they open, and when venues start listing in your city.
        </p>
        <div className="mt-6"><StagecraftWaitlistForm /></div>
      </section>
    </div>
  );
}
