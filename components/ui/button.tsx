import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Design System v2 ("Laurel") buttons.
 * One primary (red) action per screen, worded as the outcome
 * ("Build my EPK", not "Submit"). Gold is reserved for premium moments.
 */
export type ButtonVariant = "primary" | "secondary" | "ghost" | "gold" | "dark";
export type ButtonSize = "sm" | "md" | "lg";

const BASE =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap font-semibold transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white shadow-ap hover:bg-brand-deep",
  secondary: "border border-line bg-card text-ink hover:border-ink",
  ghost: "text-ink-soft hover:bg-muted hover:text-ink",
  gold: "bg-gold text-ink shadow-ap hover:brightness-95",
  dark: "bg-ink text-white hover:bg-black",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "h-9 rounded-[10px] px-3.5 text-sm",
  md: "h-11 rounded-[10px] px-5 text-sm",
  lg: "h-12 rounded-xl px-6 text-base",
};

export function buttonStyles(variant: ButtonVariant = "primary", size: ButtonSize = "md", className?: string) {
  return cn(BASE, VARIANTS[variant], SIZES[size], className);
}

type ButtonLinkProps = Omit<ComponentProps<typeof Link>, "className"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
};

export function ButtonLink({ variant = "primary", size = "md", className, children, ...props }: ButtonLinkProps) {
  return (
    <Link {...props} className={buttonStyles(variant, size, className)}>
      {children}
    </Link>
  );
}

type ButtonProps = ComponentProps<"button"> & { variant?: ButtonVariant; size?: ButtonSize };

export function Button({ variant = "primary", size = "md", className, type = "button", ...props }: ButtonProps) {
  return <button type={type} {...props} className={buttonStyles(variant, size, className)} />;
}
