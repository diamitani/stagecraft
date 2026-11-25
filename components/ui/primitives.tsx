import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ Brand */

/** The approved mark (red "A" in the gold laurel) + Playfair wordmark. */
export function BrandLockup({
  href = "/",
  tone = "light",
  showWordmark = true,
  size = 36,
  className,
}: {
  href?: string;
  tone?: "light" | "dark";
  showWordmark?: boolean;
  size?: number;
  className?: string;
}) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Artispreneur home">
      <Image
        src={tone === "dark" ? "/artispreneur-logo-knockout.png" : "/artispreneur-logo.png"}
        alt=""
        width={size}
        height={size}
        className="shrink-0"
        style={{ width: size, height: size }}
        priority
      />
      {showWordmark && (
        <span
          className={cn(
            "font-display text-[1.35rem] font-bold leading-none tracking-tight",
            tone === "dark" ? "text-white" : "text-ink",
          )}
        >
          Artispreneur
        </span>
      )}
    </Link>
  );
}

/* ------------------------------------------------------------- Typography */

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

export function SectionTitle({
  title,
  action,
  className,
}: {
  title: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between gap-3", className)}>
      <h2 className="font-display text-xl font-bold text-ink">{title}</h2>
      {action}
    </div>
  );
}

/* ------------------------------------------------------------------ Cards */

export function Card({
  children,
  className,
  interactive = false,
  as: Tag = "div",
}: {
  children: ReactNode;
  className?: string;
  interactive?: boolean;
  as?: "div" | "section" | "article" | "li";
}) {
  return <Tag className={cn("ap-card", interactive && "ap-card-interactive", className)}>{children}</Tag>;
}

export type BadgeTone = "neutral" | "red" | "gold" | "green" | "dark";

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: "border-line bg-muted text-ink-soft",
  red: "border-[#f3c9cb] bg-[#fdf0f0] text-brand-deep",
  gold: "border-[#f1dc8a] bg-gold-soft text-gold-ink",
  green: "border-[#bfe3cb] bg-[#effaf2] text-success",
  dark: "border-ink bg-ink text-white",
};

export function Badge({
  children,
  tone = "neutral",
  className,
}: {
  children: ReactNode;
  tone?: BadgeTone;
  className?: string;
}) {
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

/* ---------------------------------------------------------------- Metrics */

export function StatTile({
  label,
  value,
  hint,
  href,
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  href?: string;
}) {
  const body = (
    <>
      <p className="text-xs font-semibold uppercase tracking-[0.12em] text-ink-faint">{label}</p>
      <p className="mt-2 font-display text-3xl font-bold text-ink">{value}</p>
      {hint && <p className="mt-1 text-xs text-ink-soft">{hint}</p>}
    </>
  );
  return href ? (
    <Link href={href} className="ap-card ap-card-interactive block p-5">
      {body}
    </Link>
  ) : (
    <div className="ap-card p-5">{body}</div>
  );
}

/** Conic progress ring. `value` is 0–100. */
export function ProgressRing({ value, size = 88, label }: { value: number; size?: number; label?: string }) {
  const pct = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div
      className="ap-ring relative grid shrink-0 place-items-center"
      style={{ width: size, height: size, ["--pct" as string]: pct }}
      role="img"
      aria-label={label ?? `${pct}% complete`}
    >
      <div className="grid place-items-center rounded-full bg-card" style={{ width: size - 12, height: size - 12 }}>
        <span className="font-display text-xl font-bold text-ink">{pct}%</span>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------- States */

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
      {icon && (
        <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-full border border-line bg-card text-brand">
          {icon}
        </div>
      )}
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

/* ------------------------------------------------------------ Sub-nav tabs */

export function SubNav({
  items,
  active,
  label,
}: {
  items: { href: string; label: string; count?: number }[];
  active: string;
  label: string;
}) {
  return (
    <nav aria-label={label} className="ap-no-scrollbar -mx-1 flex gap-1 overflow-x-auto border-b border-line">
      {items.map((item) => {
        const isActive = item.href === active;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(
              "relative whitespace-nowrap px-3 pb-3 pt-1 text-sm font-semibold transition-colors",
              isActive ? "text-ink" : "text-ink-faint hover:text-ink",
            )}
          >
            {item.label}
            {typeof item.count === "number" && (
              <span className="ml-1.5 rounded-full bg-muted px-1.5 py-0.5 text-[11px] text-ink-soft">{item.count}</span>
            )}
            {isActive && <span className="absolute inset-x-3 -bottom-px h-0.5 rounded-full bg-brand" />}
          </Link>
        );
      })}
    </nav>
  );
}
