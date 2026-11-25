import type { ReactNode } from "react";
import {
  CheckCircle,
  FileText,
  HandCoins,
  MicrophoneStage,
  PaperPlaneTilt,
  Scales,
  Sparkle,
} from "@phosphor-icons/react/dist/ssr";
import { cn } from "@/lib/utils";

/**
 * Illustrations for the homepage. They show the SHAPE of each deliverable
 * (titles, section names, empty lines) and never invented artist data:
 * no fake names, numbers, venues, or streams.
 */

export function SectionIntro({
  chip,
  title,
  accent,
  body,
  align = "center",
  dark = false,
  className,
}: {
  chip: string;
  title: ReactNode;
  accent?: string;
  body?: ReactNode;
  align?: "center" | "left";
  dark?: boolean;
  className?: string;
}) {
  return (
    <div className={cn(align === "center" ? "mx-auto max-w-2xl text-center" : "max-w-xl", className)}>
      <span className="hv-chip">
        <span className="hv-chip-dot">
          <Sparkle className="h-2.5 w-2.5" weight="fill" />
        </span>
        {chip}
      </span>
      <h2
        className={cn(
          "mt-5 font-display text-4xl leading-[1.08] sm:text-5xl lg:text-[3.5rem]",
          dark ? "text-white" : "text-[color:var(--hv-ink)]",
        )}
      >
        {title}
        {accent ? (
          <>
            {" "}
            <em className="font-display italic text-brand">{accent}</em>
          </>
        ) : null}
      </h2>
      {body ? (
        <p
          className={cn(
            "mt-4 text-base leading-relaxed sm:text-lg",
            align === "center" && "mx-auto max-w-xl",
            dark ? "text-white/70" : "text-[color:var(--hv-ink-soft)]",
          )}
        >
          {body}
        </p>
      ) : null}
    </div>
  );
}

function Lines({ n = 3, light = false }: { n?: number; light?: boolean }) {
  const widths = ["w-full", "w-11/12", "w-4/5", "w-2/3", "w-3/4"];
  return (
    <div className="space-y-1.5" aria-hidden="true">
      {Array.from({ length: n }).map((_, i) => (
        <div
          key={i}
          className={cn("h-1.5 rounded-full", widths[i % widths.length], light ? "bg-white/35" : "bg-[#e9dccb]")}
        />
      ))}
    </div>
  );
}

const FAN: FanCard[] = [
  { title: "Press Kit", sub: "Bio · Music · Press · Contact", icon: MicrophoneStage, bg: "hv-glow", rot: "-14deg", y: "2.5rem" },
  { title: "Split Sheet", sub: "Composition · Master", icon: Scales, bg: "bg-[color:var(--hv-espresso)] text-white", rot: "-7deg", y: "0.75rem" },
  { title: "Release Plan", sub: "Weeks out · Tasks · Owners", icon: FileText, bg: "bg-[color:var(--hv-card)]", rot: "0deg", y: "0rem" },
  { title: "Royalty Check", sub: "PRO · MLC · SoundExchange", icon: HandCoins, bg: "hv-glow-soft", rot: "7deg", y: "0.75rem" },
  { title: "Venue Pitch", sub: "Draft · Waits for approval", icon: PaperPlaneTilt, bg: "bg-brand text-white", rot: "14deg", y: "2.5rem" },
];

export interface FanCard {
  title: string;
  sub: string;
  icon: typeof FileText;
  bg: string;
  rot: string;
  y: string;
}

/** Fanned row of deliverable cards (the hero's "image fan"). */
export function HeroFan({ cards = FAN }: { cards?: FanCard[] } = {}) {
  return (
    <div className="hv-fan relative mx-auto flex h-[230px] max-w-4xl items-end justify-center sm:h-[280px]" aria-hidden="true">
      {cards.map((card, i) => (
        <div
          key={card.title}
          className={cn(
            "hv-fan-card -mx-5 w-[140px] shrink-0 rounded-[22px] border border-white/60 p-4 shadow-[0_24px_50px_-20px_rgb(60_20_10/0.45)] sm:-mx-2 sm:w-[190px] sm:p-5",
            card.bg,
            (i === 0 || i === 4) && "hidden sm:block",
          )}
          style={{ transform: `rotate(${card.rot}) translateY(${card.y})`, zIndex: i === 2 ? 5 : 5 - Math.abs(2 - i) }}
        >
          <card.icon className="h-6 w-6 opacity-80" weight="duotone" />
          <p className="mt-8 font-display text-xl leading-tight sm:mt-14 sm:text-2xl">{card.title}</p>
          <p className="mt-1 text-[11px] opacity-70">{card.sub}</p>
          <div className="mt-4">
            <Lines n={3} light={card.bg.includes("text-white")} />
          </div>
        </div>
      ))}
    </div>
  );
}

/** EPK structure with a missing fact flagged, not invented. */
export function EpkVisual() {
  return (
    <div className="hv-glow relative overflow-hidden rounded-[28px] p-6 sm:p-10">
      <div className="hv-glass mx-auto max-w-sm rounded-2xl p-5">
        <div className="flex items-center justify-between">
          <p className="font-display text-lg text-[color:var(--hv-ink)]">Electronic Press Kit</p>
          <span className="rounded-full bg-gold-soft px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold-ink">Draft</span>
        </div>
        <ul className="mt-4 space-y-2.5 text-xs text-[color:var(--hv-ink-soft)]">
          {["Short bio", "Featured music", "Press quotes", "Booking contact"].map((s) => (
            <li key={s} className="flex items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
              <CheckCircle className="h-4 w-4 text-success" weight="fill" />
              <span className="font-medium text-[color:var(--hv-ink)]">{s}</span>
              <span className="ml-auto text-[10px]">from your facts</span>
            </li>
          ))}
          <li className="flex items-center gap-2 rounded-lg border border-dashed border-brand/50 bg-white/70 px-3 py-2">
            <span className="rounded bg-brand px-1.5 py-0.5 text-[10px] font-bold text-white">[CONFIRM]</span>
            <span className="font-medium text-[color:var(--hv-ink)]">Streaming numbers</span>
            <span className="ml-auto text-[10px]">not supplied</span>
          </li>
        </ul>
      </div>
    </div>
  );
}

/** The two split pools must each total exactly 100%. */
export function SplitVisual() {
  return (
    <div className="hv-glow-soft relative overflow-hidden rounded-[28px] p-6 sm:p-10">
      <div className="hv-glass mx-auto max-w-sm rounded-2xl p-5">
        <p className="font-display text-lg text-[color:var(--hv-ink)]">Split Sheet check</p>
        {["Composition pool", "Master recording pool"].map((pool) => (
          <div key={pool} className="mt-4">
            <div className="flex items-center justify-between text-xs">
              <span className="font-medium text-[color:var(--hv-ink-soft)]">{pool}</span>
              <span className="font-display text-base text-[color:var(--hv-ink)]">must total 100.00%</span>
            </div>
            <div className="mt-2 flex h-2.5 overflow-hidden rounded-full bg-[#efe3d3]">
              <div className="w-1/2 bg-brand" />
              <div className="w-1/3 bg-[#f07a4a]" />
              <div className="flex-1 bg-gold" />
            </div>
          </div>
        ))}
        <p className="mt-4 flex items-center gap-1.5 text-[11px] font-semibold text-success">
          <CheckCircle className="h-4 w-4" weight="fill" /> Won&apos;t save until both pools balance
        </p>
      </div>
    </div>
  );
}

/** Outbound actions pause as approval cards. */
export function ApprovalVisual() {
  return (
    <div className="hv-glow-dark relative overflow-hidden rounded-[28px] p-6 sm:p-10">
      <div className="hv-glass mx-auto max-w-sm rounded-2xl p-5">
        <div className="flex items-center gap-2">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-brand text-white">
            <Sparkle className="h-4 w-4" weight="fill" />
          </span>
          <div>
            <p className="text-sm font-semibold text-[color:var(--hv-ink)]">Artie drafted an email</p>
            <p className="text-[11px] text-[color:var(--hv-ink-soft)]">Waiting for your approval</p>
          </div>
        </div>
        <div className="mt-4 rounded-xl bg-white/80 p-3">
          <Lines n={4} />
        </div>
        <div className="mt-4 flex gap-2">
          <span className="flex-1 rounded-full bg-brand py-2 text-center text-xs font-semibold text-white">Approve &amp; send</span>
          <span className="flex-1 rounded-full border border-[color:var(--hv-line)] bg-white py-2 text-center text-xs font-semibold text-[color:var(--hv-ink)]">Edit draft</span>
        </div>
      </div>
    </div>
  );
}
