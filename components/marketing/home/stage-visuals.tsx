import { CalendarCheck, CreditCard, Handshake, MicrophoneStage, PaperPlaneTilt, Storefront } from "@phosphor-icons/react/dist/ssr";
import { CheckCircle, Sparkle } from "@phosphor-icons/react/dist/ssr";
import type { FanCard } from "@/components/marketing/home/visuals";

/**
 * Illustrations for the Stagecraft landing page. They show the SHAPE of each step
 * (titles, section names, empty lines) and never invented venues, artists or numbers.
 */

export const STAGE_FAN: FanCard[] = [
  { title: "Venue Page", sub: "Room · Capacity · Pricing", icon: Storefront, bg: "hv-glow", rot: "-14deg", y: "2.5rem" },
  { title: "Open Dates", sub: "Blocked · Booked · Open", icon: CalendarCheck, bg: "bg-[color:var(--hv-espresso)] text-white", rot: "-7deg", y: "0.75rem" },
  { title: "Booking Request", sub: "Date · Night · Your note", icon: PaperPlaneTilt, bg: "bg-[color:var(--hv-card)]", rot: "0deg", y: "0rem" },
  { title: "Deposit", sub: "Card · Paid to the venue", icon: CreditCard, bg: "hv-glow-soft", rot: "7deg", y: "0.75rem" },
  { title: "Show Night", sub: "Confirmed · On the calendar", icon: MicrophoneStage, bg: "bg-brand text-white", rot: "14deg", y: "2.5rem" },
];

function Lines({ n = 3 }: { n?: number }) {
  const widths = ["w-full", "w-11/12", "w-4/5", "w-2/3", "w-3/4"];
  return (
    <div className="space-y-1.5" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div key={i} className={`h-1.5 rounded-full bg-[#e9dccb] ${widths[i % widths.length]}`} />
      ))}
    </div>
  );
}

/** A venue answering a request: accept with a deposit, or decline. */
export function InboxVisual() {
  return (
    <div className="hv-glow relative overflow-hidden rounded-[28px] p-6 sm:p-10">
      <div className="hv-glass mx-auto max-w-sm rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg text-[color:var(--hv-ink)]">Booking request</p>
          <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-ink">Needs your answer</span>
        </div>
        <div className="mt-4 rounded-xl bg-white/80 p-3"><Lines n={4} /></div>
        <div className="mt-3 flex items-center gap-2 rounded-lg border border-dashed border-brand/50 bg-white/70 px-3 py-2 text-xs">
          <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">DEPOSIT</span>
          <span className="font-medium text-[color:var(--hv-ink)]">You choose the amount</span>
        </div>
        <div className="mt-4 flex gap-2">
          <span className="flex-1 rounded-full bg-brand py-2 text-center text-xs font-semibold text-white">Accept this date</span>
          <span className="flex-1 rounded-full border border-[color:var(--hv-line)] bg-white py-2 text-center text-xs font-semibold text-[color:var(--hv-ink)]">Decline</span>
        </div>
      </div>
    </div>
  );
}

/** The calendar: open, blocked and booked nights. */
export function CalendarVisual() {
  const cells = ["", "", "o", "o", "b", "o", "x", "o", "o", "o", "c", "o", "x", "x", "o", "o", "b", "o", "o", "o", "o"];
  return (
    <div className="hv-glow-soft relative overflow-hidden rounded-[28px] p-6 sm:p-10">
      <div className="hv-glass mx-auto max-w-sm rounded-2xl p-5">
        <p className="font-display text-lg text-[color:var(--hv-ink)]">Your calendar</p>
        <div className="mt-4 grid grid-cols-7 gap-1.5" aria-hidden="true">
          {cells.map((c, i) => (
            <span
              key={i}
              className={
                c === "" ? "aspect-square" :
                c === "x" ? "aspect-square rounded-lg bg-[#efe3d3]" :
                c === "c" ? "aspect-square rounded-lg bg-success/80" :
                c === "b" ? "aspect-square rounded-lg bg-brand/85" :
                "aspect-square rounded-lg border border-[#eadfce] bg-white/80"
              }
            />
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-[color:var(--hv-ink-soft)]">
          <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-white ring-1 ring-[#eadfce]" />Open</li>
          <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-[#efe3d3]" />Blocked by you</li>
          <li className="inline-flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-success/80" />Booked</li>
        </ul>
        <p className="mt-3 flex items-center gap-1.5 text-[11px] font-semibold text-success"><CheckCircle className="h-4 w-4" weight="fill" />A held date can&apos;t be requested twice</p>
      </div>
    </div>
  );
}

/** Sponsorships, shown honestly as planned. */
export function SponsorVisual() {
  return (
    <div className="hv-glow-dark relative overflow-hidden rounded-[28px] p-6 sm:p-10">
      <div className="hv-glass mx-auto max-w-sm rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white"><Handshake className="h-4 w-4" weight="fill" /></span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--hv-ink)]">Sponsor a show</p>
            <p className="text-[11px] text-[color:var(--hv-ink-soft)]">Planned, not built yet</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-white/80 p-3"><Lines n={3} /></div>
        <p className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-[color:var(--hv-ink-soft)]"><Sparkle className="h-4 w-4 text-brand" weight="fill" />Join the list and we&apos;ll tell you when it opens</p>
      </div>
    </div>
  );
}
