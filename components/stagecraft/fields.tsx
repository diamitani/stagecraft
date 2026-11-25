import type { ComponentProps, ReactNode } from "react";
import { cn } from "@/lib/utils";

/** Shared form bits for the Stagecraft screens, so every field looks the same. */

export const inputClass =
  "w-full rounded-[10px] border border-line bg-card px-3.5 py-2.5 text-sm text-ink placeholder:text-ink-faint focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand";

export function Field({
  label,
  hint,
  htmlFor,
  children,
  className,
}: {
  label: string;
  hint?: ReactNode;
  htmlFor: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="block text-sm font-semibold text-ink">{label}</label>
      {hint ? <p className="mt-0.5 text-xs text-ink-faint">{hint}</p> : null}
      <div className="mt-1.5">{children}</div>
    </div>
  );
}

export function TextInput(props: ComponentProps<"input">) {
  return <input {...props} className={cn(inputClass, props.className)} />;
}

export function TextArea(props: ComponentProps<"textarea">) {
  return <textarea {...props} className={cn(inputClass, "min-h-[7rem] resize-y", props.className)} />;
}

export function Select(props: ComponentProps<"select">) {
  return <select {...props} className={cn(inputClass, "pr-8", props.className)} />;
}

/** Inline result of a save or send: red for a problem, green for done. */
export function FormMessage({ error, success }: { error?: string | null; success?: string | null }) {
  if (error) return <p role="alert" className="rounded-[10px] border border-[#f3c9cb] bg-[#fdf0f0] px-3.5 py-2.5 text-sm text-brand-deep">{error}</p>;
  if (success) return <p role="status" className="rounded-[10px] border border-[#bfe3cb] bg-[#effaf2] px-3.5 py-2.5 text-sm text-success">{success}</p>;
  return null;
}
