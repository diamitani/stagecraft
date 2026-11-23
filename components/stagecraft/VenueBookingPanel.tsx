"use client";

import { useState } from "react";
import Link from "next/link";
import { Button, ButtonLink } from "@/components/ui/button";
import AvailabilityCalendar from "@/components/stagecraft/AvailabilityCalendar";
import { Field, FormMessage, Select, TextArea, TextInput } from "@/components/stagecraft/fields";
import { BOOKING_LIMITS, EVENT_TYPES, EVENT_TYPE_LABELS, dayLabel, formatMoney } from "@/lib/stagecraft-shared";

/**
 * The right-hand side of a venue page: pick an open date, then send the
 * venue a request. Signed-out visitors can browse the calendar and are
 * sent to sign in when they want to ask for a date.
 */
export default function VenueBookingPanel({
  venueSlug,
  venueName,
  today,
  unavailable,
  depositCents,
  signedIn,
  isOwner,
  defaultArtistName,
  defaultEmail,
}: {
  venueSlug: string;
  venueName: string;
  today: string;
  unavailable: string[];
  depositCents: number;
  signedIn: boolean;
  isOwner: boolean;
  defaultArtistName: string;
  defaultEmail: string;
}) {
  const [day, setDay] = useState<string | null>(null);
  const [artistName, setArtistName] = useState(defaultArtistName);
  const [artistEmail, setArtistEmail] = useState(defaultEmail);
  const [eventType, setEventType] = useState<string>("show");
  const [attendance, setAttendance] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sentFor, setSentFor] = useState<string | null>(null);

  async function send(event: React.FormEvent) {
    event.preventDefault();
    if (!day) {
      setError("Pick a date from the calendar first.");
      return;
    }
    setSending(true);
    setError(null);
    try {
      const res = await fetch("/api/stagecraft/bookings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueSlug, eventDate: day, eventType, expectedAttendance: attendance, artistName, artistEmail, message }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not send your request. Please try again.");
        return;
      }
      setSentFor(day);
      setDay(null);
      setMessage("");
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSending(false);
    }
  }

  return (
    <section aria-labelledby="book-heading" className="space-y-4">
      <div>
        <h2 id="book-heading" className="font-display text-xl font-bold text-ink">Check dates and ask to book</h2>
        <p className="mt-1 text-sm text-ink-soft">
          Pick an open date. {venueName} gets your request and answers it.
          {depositCents > 0 ? ` They usually ask for a ${formatMoney(depositCents)} deposit to hold a date.` : ""}
        </p>
      </div>

      <AvailabilityCalendar
        mode="request"
        today={today}
        blocked={unavailable}
        selected={day}
        onPick={(picked) => {
          setDay(picked);
          setSentFor(null);
          setError(null);
        }}
      />

      {sentFor ? (
        <div className="rounded-ap border border-[#bfe3cb] bg-[#effaf2] p-4 text-sm text-ink">
          <p className="font-semibold text-success">Request sent for {dayLabel(sentFor)}.</p>
          <p className="mt-1 text-ink-soft">You will get an email when {venueName} answers. You can also follow it under My requests.</p>
          <div className="mt-3"><ButtonLink href="/dashboard?tab=requests" variant="secondary" size="sm">View my requests</ButtonLink></div>
        </div>
      ) : null}

      {isOwner ? (
        <div className="rounded-ap border border-line bg-muted p-4 text-sm text-ink-soft">
          This is your venue. Manage your calendar and answer requests from your dashboard.
          <div className="mt-3"><ButtonLink href="/dashboard?tab=venue" variant="secondary" size="sm">Open my venue dashboard</ButtonLink></div>
        </div>
      ) : !signedIn ? (
        <div className="rounded-ap border border-line bg-muted p-4 text-sm text-ink-soft">
          Sign in to ask for a date. It is free and takes a minute.
          <div className="mt-3 flex flex-wrap gap-2">
            <ButtonLink href={`/login?next=${encodeURIComponent(`/venues/${venueSlug}`)}`} size="sm">Sign in to request a date</ButtonLink>
            <ButtonLink href="/login" variant="secondary" size="sm">Create a free account</ButtonLink>
          </div>
        </div>
      ) : (
        <form onSubmit={send} className="space-y-4 rounded-ap border border-line bg-card p-4" noValidate>
          <p className="text-sm font-semibold text-ink">
            {day ? <>Requesting <span className="text-brand">{dayLabel(day)}</span></> : "Pick a date above to start your request"}
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Artist or band name" htmlFor="sc-artist-name">
              <TextInput id="sc-artist-name" value={artistName} onChange={(e) => setArtistName(e.target.value)} maxLength={BOOKING_LIMITS.artistName} autoComplete="organization" required />
            </Field>
            <Field label="Contact email" htmlFor="sc-artist-email">
              <TextInput id="sc-artist-email" type="email" value={artistEmail} onChange={(e) => setArtistEmail(e.target.value)} autoComplete="email" required />
            </Field>
            <Field label="Type of night" htmlFor="sc-event-type">
              <Select id="sc-event-type" value={eventType} onChange={(e) => setEventType(e.target.value)}>
                {EVENT_TYPES.map((type) => <option key={type} value={type}>{EVENT_TYPE_LABELS[type]}</option>)}
              </Select>
            </Field>
            <Field label="Expected crowd" hint="Optional" htmlFor="sc-attendance">
              <TextInput id="sc-attendance" inputMode="numeric" value={attendance} onChange={(e) => setAttendance(e.target.value)} placeholder="80" />
            </Field>
          </div>
          <Field label="Tell the venue about the night" hint="Who is playing, the style of music, set times, and anything you need from them." htmlFor="sc-message">
            <TextArea id="sc-message" value={message} onChange={(e) => setMessage(e.target.value)} maxLength={BOOKING_LIMITS.message} required />
          </Field>
          <FormMessage error={error} />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={sending || !day}>{sending ? "Sending..." : "Send booking request"}</Button>
            <p className="text-xs text-ink-faint">Nothing is charged when you send a request.</p>
          </div>
          <p className="text-xs text-ink-faint">The venue sees your name, contact email and message.</p>
        </form>
      )}
    </section>
  );
}
