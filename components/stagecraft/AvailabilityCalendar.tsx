"use client";

import { useState } from "react";
import { CaretLeft, CaretRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { MAX_ADVANCE_DAYS, addDays, addMonths, dayLabel, monthGrid, monthLabel, monthOf } from "@/lib/stagecraft-shared";

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type DayState = "open" | "blocked" | "booked" | "past";

/**
 * One-month calendar used in two places:
 *  - "request": on a venue's public page. Open days can be picked; blocked
 *    and booked days both just read as unavailable.
 *  - "manage": in the owner's dashboard. Clicking an open day blocks it and
 *    clicking a blocked day opens it again. Booked days are locked.
 */
export default function AvailabilityCalendar({
  mode,
  today,
  blocked = [],
  booked = [],
  selected = null,
  busyDay = null,
  onPick,
}: {
  mode: "request" | "manage";
  today: string;
  blocked?: string[];
  booked?: string[];
  selected?: string | null;
  /** A day that is being saved right now (manage mode). */
  busyDay?: string | null;
  onPick: (day: string) => void;
}) {
  const firstMonth = monthOf(today);
  const lastDay = addDays(today, MAX_ADVANCE_DAYS);
  const lastMonth = monthOf(lastDay);
  const [month, setMonth] = useState(selected ? monthOf(selected) : firstMonth);

  const blockedSet = new Set(blocked);
  const bookedSet = new Set(booked);

  function stateOf(day: string): DayState {
    if (day < today || day > lastDay) return "past";
    if (bookedSet.has(day)) return "booked";
    if (blockedSet.has(day)) return "blocked";
    return "open";
  }

  function describe(day: string, state: DayState): string {
    const label = dayLabel(day);
    if (state === "past") return `${label}, not available`;
    if (mode === "request") return state === "open" ? `${label}, available` : `${label}, unavailable`;
    if (state === "booked") return `${label}, booked`;
    return state === "blocked" ? `${label}, blocked. Click to open it up.` : `${label}, open. Click to block it.`;
  }

  return (
    <div className="rounded-ap border border-line bg-card p-4">
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, -1))}
          disabled={month <= firstMonth}
          aria-label="Previous month"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-muted hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <CaretLeft className="h-4 w-4" weight="bold" />
        </button>
        <p className="font-display text-base font-bold text-ink" aria-live="polite">{monthLabel(month)}</p>
        <button
          type="button"
          onClick={() => setMonth((m) => addMonths(m, 1))}
          disabled={month >= lastMonth}
          aria-label="Next month"
          className="grid h-9 w-9 place-items-center rounded-full text-ink-soft transition-colors hover:bg-muted hover:text-ink disabled:pointer-events-none disabled:opacity-30"
        >
          <CaretRight className="h-4 w-4" weight="bold" />
        </button>
      </div>

      <div className="mt-3 grid grid-cols-7 gap-1 text-center text-[11px] font-semibold uppercase tracking-wide text-ink-faint">
        {WEEKDAYS.map((d) => <span key={d}>{d}</span>)}
      </div>

      <div className="mt-1 grid grid-cols-7 gap-1">
        {monthGrid(month).flat().map((day, index) => {
          if (!day) return <span key={`gap-${index}`} aria-hidden="true" />;
          const state = stateOf(day);
          const isSelected = selected === day;
          const clickable = mode === "request" ? state === "open" : state === "open" || state === "blocked";
          return (
            <button
              key={day}
              type="button"
              disabled={!clickable || busyDay === day}
              aria-label={describe(day, state)}
              aria-pressed={mode === "request" ? isSelected : state === "blocked"}
              onClick={() => onPick(day)}
              className={cn(
                "grid aspect-square min-h-[2.25rem] place-items-center rounded-[10px] border text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-1",
                state === "past" && "border-transparent text-ink-faint opacity-40",
                state === "open" && !isSelected && "border-line bg-card text-ink hover:border-brand hover:text-brand",
                state === "blocked" && "border-line bg-muted text-ink-faint line-through",
                state === "blocked" && mode === "manage" && "hover:border-ink",
                state === "booked" && mode === "request" && "border-line bg-muted text-ink-faint line-through",
                state === "booked" && mode === "manage" && "border-[#bfe3cb] bg-[#effaf2] text-success",
                isSelected && "border-brand bg-brand text-white",
                busyDay === day && "opacity-50",
              )}
            >
              {Number(day.slice(8))}
            </button>
          );
        })}
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-ink-soft">
        <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-[4px] border border-line bg-card" />Open</span>
        {mode === "request" ? (
          <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-[4px] border border-line bg-muted" />Unavailable</span>
        ) : (
          <>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-[4px] border border-line bg-muted" />Blocked by you</span>
            <span className="inline-flex items-center gap-1.5"><span className="h-3 w-3 rounded-[4px] border border-[#bfe3cb] bg-[#effaf2]" />Booked</span>
          </>
        )}
      </div>
    </div>
  );
}
