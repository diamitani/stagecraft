import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function Eyebrow({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("ap-eyebrow", className)}>{children}</p>;
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <header className={cn("flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div className="min-w-0">
        {eyebrow && <Eyebrow>{eyebrow}</Eyebrow>}
        <h1 className="mt-2 font-display text-3xl font-bold leading-tight text-ink sm:text-[2.5rem]">{title}</h1>
        {description && <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-soft">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap items-center gap-2">{actions}</div>}
    </header>
  );
}

export type BadgeTone = "neutral" | "red" | "gold" | "green" | "dark";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "border-line bg-muted text-ink-soft",
  red: "border-[#f3c9bd] bg-[#fdf1ec] text-brand-deep",
  gold: "border-[#f1dc8a] bg-gold-soft text-gold-ink",
  green: "border-[#bfe3cb] bg-[#effaf2] text-success",
  dark: "border-ink bg-ink text-white",
};

export function Badge({ children, tone = "neutral", className }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-[0.06em]",
        BADGE_TONES[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("ap-paper rounded-ap border border-dashed border-line px-6 py-12 text-center", className)}>
      {icon && <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-line bg-card text-brand">{icon}</div>}
      <p className="font-display text-lg font-bold text-ink">{title}</p>
      {description && <p className="mx-auto mt-1.5 max-w-md text-sm text-ink-soft">{description}</p>}
      {action && <div className="mt-5 flex justify-center">{action}</div>}
    </div>
  );
}

export function Notice({ children, tone = "neutral" }: { children: ReactNode; tone?: "neutral" | "warn" }) {
  return (
    <div
      role="status"
      className={cn(
        "rounded-ap border px-4 py-3 text-sm",
        tone === "warn" ? "border-[#f1dc8a] bg-gold-soft text-ink" : "border-line bg-muted text-ink-soft",
      )}
    >
      {children}
    </div>
  );
}
