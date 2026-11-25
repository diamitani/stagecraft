import type { ReactNode } from "react";

export interface HeroStat {
  label: string;
  value: string;
  hint?: string;
}

/** Dark "CRM header": title on the left, KPI tiles under it. Shared by both Directory tabs. */
export function DirectoryHero({
  eyebrow,
  title,
  sub,
  stats,
  action,
}: {
  eyebrow: string;
  title: string;
  sub: string;
  stats: HeroStat[];
  action?: ReactNode;
}) {
  return (
    <header
      className="relative overflow-hidden rounded-2xl bg-ink text-white shadow-ap-lg"
      style={{
        backgroundImage:
          "radial-gradient(60rem 18rem at 100% -20%, rgb(245 193 0 / 0.22), transparent 60%), radial-gradient(40rem 14rem at -10% 120%, rgb(192 39 45 / 0.35), transparent 60%)",
      }}
    >
      <div className="flex flex-col gap-5 px-5 pb-5 pt-6 sm:px-8 sm:pt-8 lg:flex-row lg:items-end lg:justify-between">
        <div className="max-w-2xl">
          <p className="text-[11px] font-semibold uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
          <h1 className="mt-2 font-display text-2xl font-bold leading-tight sm:text-4xl">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-white/75 sm:text-base">{sub}</p>
        </div>
        {action && <div className="shrink-0">{action}</div>}
      </div>
      <dl className="grid grid-cols-2 gap-px border-t border-white/10 bg-white/10 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-ink/60 px-5 py-4 backdrop-blur-sm sm:px-8">
            <dt className="text-[11px] font-semibold uppercase tracking-[0.14em] text-white/55">{s.label}</dt>
            <dd className="mt-1 font-display text-2xl font-bold tabular-nums text-gold sm:text-3xl">{s.value}</dd>
            {s.hint && <p className="mt-0.5 text-xs text-white/55">{s.hint}</p>}
          </div>
        ))}
      </dl>
    </header>
  );
}
