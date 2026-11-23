"use client";

import { useState } from "react";
import Link from "next/link";
import { CalendarBlank, EnvelopeSimple, MapPin, UsersThree } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Badge, type BadgeTone } from "@/components/ui/primitives";
import { Field, FormMessage, TextArea, TextInput } from "@/components/stagecraft/fields";
import {
  BOOKING_LIMITS,
  EVENT_TYPE_LABELS,
  dayLabel,
  formatMoney,
  type Booking,
  type BookingStatus,
  type PayoutStatus,
} from "@/lib/stagecraft-shared";

const STATUS_TONE: Record<BookingStatus, BadgeTone> = {
  pending: "gold",
  accepted: "gold",
  confirmed: "green",
  declined: "neutral",
  cancelled: "neutral",
};

function statusText(booking: Booking): string {
  if (booking.status === "pending") return booking.role === "venue" ? "Needs your answer" : "Waiting for the venue";
  if (booking.status === "accepted") return booking.role === "venue" ? "Waiting for deposit" : "Accepted, deposit due";
  if (booking.status === "confirmed") return "Confirmed";
  return booking.status === "declined" ? "Declined" : "Cancelled";
}

type PatchResult = { ok: true } | { ok: false; error: string };

async function patchBooking(id: string, body: Record<string, unknown>): Promise<PatchResult> {
  try {
    const res = await fetch(`/api/stagecraft/bookings/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) return { ok: false, error: data.error || "Could not update that booking. Please try again." };
    return { ok: true };
  } catch {
    return { ok: false, error: "Could not reach the server. Check your connection and try again." };
  }
}

/** Two-step cancel so one stray click can't call off a show. */
function CancelControl({ booking, onChanged, onError }: { booking: Booking; onChanged: () => void; onError: (message: string | null) => void }) {
  const [asking, setAsking] = useState(false);
  const [busy, setBusy] = useState(false);

  async function cancel() {
    setBusy(true);
    onError(null);
    const result = await patchBooking(booking.id, { action: "cancel" });
    setBusy(false);
    if (!result.ok) {
      onError(result.error);
      return;
    }
    setAsking(false);
    onChanged();
  }

  if (!asking) {
    return <Button variant="ghost" size="sm" onClick={() => setAsking(true)}>{booking.status === "pending" && booking.role === "artist" ? "Withdraw request" : "Cancel booking"}</Button>;
  }
  return (
    <div className="flex flex-wrap items-center gap-2 rounded-[10px] border border-line bg-muted px-3 py-2">
      <p className="text-sm text-ink">
        Cancel {dayLabel(booking.eventDate)}?
        {booking.depositPaid ? " The deposit is not refunded automatically. The venue refunds it from their Stripe account." : ""}
      </p>
      <Button variant="dark" size="sm" disabled={busy} onClick={cancel}>{busy ? "Cancelling..." : "Yes, cancel it"}</Button>
      <Button variant="ghost" size="sm" disabled={busy} onClick={() => setAsking(false)}>Keep it</Button>
    </div>
  );
}

function BookingFacts({ booking }: { booking: Booking }) {
  return (
    <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-soft">
      <span className="inline-flex items-center gap-1.5"><CalendarBlank className="h-4 w-4" />{dayLabel(booking.eventDate)}</span>
      <span>{EVENT_TYPE_LABELS[booking.eventType]}</span>
      {booking.expectedAttendance ? <span className="inline-flex items-center gap-1.5"><UsersThree className="h-4 w-4" />About {booking.expectedAttendance.toLocaleString("en-US")} people</span> : null}
    </div>
  );
}

/** A request the signed-in user sent as an artist. */
export function SentBookingCard({ booking, onChanged }: { booking: Booking; onChanged: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const open = booking.status === "pending" || booking.status === "accepted" || booking.status === "confirmed";

  async function payDeposit() {
    setPaying(true);
    setError(null);
    try {
      const res = await fetch(`/api/stagecraft/bookings/${booking.id}/deposit`, { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not start the payment. Please try again.");
        return;
      }
      if (data.url) {
        window.location.assign(data.url);
        return;
      }
      onChanged();
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPaying(false);
    }
  }

  return (
    <article className="rounded-ap border border-line bg-card p-5 shadow-ap">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-ink">
            <Link href={`/venues/${booking.venueSlug}`} className="hover:text-brand hover:underline">{booking.venueName}</Link>
          </h3>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-ink-soft"><MapPin className="h-4 w-4" />{booking.venueCity}</p>
        </div>
        <Badge tone={STATUS_TONE[booking.status]}>{statusText(booking)}</Badge>
      </div>

      <BookingFacts booking={booking} />

      {booking.venueNote ? (
        <p className="mt-3 rounded-[10px] bg-muted px-3.5 py-2.5 text-sm text-ink-soft"><span className="font-semibold text-ink">{booking.venueName} wrote:</span> {booking.venueNote}</p>
      ) : null}

      {booking.status === "accepted" ? (
        <div className="mt-4 rounded-[10px] border border-[#f1dc8a] bg-gold-soft p-4">
          <p className="text-sm text-ink">
            The venue said yes and is holding the date. Pay the <strong>{formatMoney(booking.depositCents)}</strong> deposit to confirm it.
          </p>
          <div className="mt-3"><Button onClick={payDeposit} disabled={paying}>{paying ? "Opening checkout..." : `Pay ${formatMoney(booking.depositCents)} deposit`}</Button></div>
          <p className="mt-2 text-xs text-ink-faint">You pay on Stripe&apos;s secure checkout page. The money goes to the venue.</p>
        </div>
      ) : null}

      {booking.status === "confirmed" ? (
        <p className="mt-3 text-sm text-ink-soft">
          {booking.depositPaid ? `Deposit of ${formatMoney(booking.depositCents)} paid. ` : ""}
          This date is booked.
        </p>
      ) : null}

      {booking.contactEmail ? (
        <p className="mt-3 inline-flex items-center gap-1.5 text-sm text-ink-soft">
          <EnvelopeSimple className="h-4 w-4" />Venue contact:{" "}
          <a href={`mailto:${booking.contactEmail}`} className="font-semibold text-brand hover:underline">{booking.contactEmail}</a>
        </p>
      ) : null}

      <div className="mt-3"><FormMessage error={error} /></div>
      {open ? <div className="mt-3"><CancelControl booking={booking} onChanged={onChanged} onError={setError} /></div> : null}
    </article>
  );
}

/** A request the signed-in user's venue received. */
export function ReceivedBookingCard({
  booking,
  defaultDepositCents,
  payouts,
  onChanged,
}: {
  booking: Booking;
  defaultDepositCents: number;
  payouts: PayoutStatus | null;
  onChanged: () => void;
}) {
  const canTakeDeposits = Boolean(payouts?.ready);
  const [deposit, setDeposit] = useState(canTakeDeposits && defaultDepositCents > 0 ? String(defaultDepositCents / 100) : "0");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<"accept" | "decline" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const open = booking.status === "accepted" || booking.status === "confirmed";

  async function answer(action: "accept" | "decline") {
    setBusy(action);
    setError(null);
    const result = await patchBooking(booking.id, action === "accept" ? { action, deposit, note } : { action, note });
    setBusy(null);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    onChanged();
  }

  const depositId = `sc-deposit-${booking.id}`;
  const noteId = `sc-note-${booking.id}`;

  return (
    <article className="rounded-ap border border-line bg-card p-5 shadow-ap">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="font-display text-lg font-bold text-ink">
            {booking.artistName}
          </h3>
          <p className="mt-0.5 inline-flex items-center gap-1.5 text-sm text-ink-soft">
            <EnvelopeSimple className="h-4 w-4" />
            <a href={`mailto:${booking.contactEmail}`} className="font-semibold text-brand hover:underline">{booking.contactEmail}</a>
          </p>
        </div>
        <Badge tone={STATUS_TONE[booking.status]}>{statusText(booking)}</Badge>
      </div>

      <BookingFacts booking={booking} />
      <p className="mt-3 whitespace-pre-line rounded-[10px] bg-muted px-3.5 py-2.5 text-sm text-ink-soft">{booking.message}</p>

      {booking.status === "pending" ? (
        <div className="mt-4 space-y-4 border-t border-line pt-4">
          <div className="grid gap-4 sm:grid-cols-[10rem_minmax(0,1fr)]">
            <Field
              label="Deposit ($)"
              hint="0 means no deposit."
              htmlFor={depositId}
            >
              <TextInput id={depositId} inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} disabled={!canTakeDeposits} />
            </Field>
            <Field label="Note to the artist" hint="Optional. Load-in time, set length, anything they should know." htmlFor={noteId}>
              <TextArea id={noteId} value={note} onChange={(e) => setNote(e.target.value)} maxLength={BOOKING_LIMITS.note} className="min-h-[4.5rem]" />
            </Field>
          </div>
          {!canTakeDeposits ? (
            <p className="text-xs text-ink-faint">
              {payouts && !payouts.stripeConfigured
                ? "Card deposits aren't switched on for Stagecraft yet, so this booking is confirmed as soon as you accept."
                : "To ask for a deposit, finish payout setup under My venue. Without it, the booking is confirmed as soon as you accept."}
            </p>
          ) : null}
          <FormMessage error={error} />
          <div className="flex flex-wrap gap-2">
            <Button onClick={() => answer("accept")} disabled={busy !== null}>{busy === "accept" ? "Accepting..." : "Accept this date"}</Button>
            <Button variant="secondary" onClick={() => answer("decline")} disabled={busy !== null}>{busy === "decline" ? "Declining..." : "Decline"}</Button>
          </div>
        </div>
      ) : null}

      {booking.status === "accepted" ? (
        <p className="mt-3 text-sm text-ink-soft">
          You accepted and asked for a <strong className="text-ink">{formatMoney(booking.depositCents)}</strong> deposit. The date is held and is confirmed when the artist pays.
        </p>
      ) : null}
      {booking.status === "confirmed" ? (
        <p className="mt-3 text-sm text-ink-soft">
          {booking.depositPaid ? `Deposit of ${formatMoney(booking.depositCents)} paid to your Stripe account. ` : ""}
          This date is booked.
        </p>
      ) : null}
      {booking.venueNote && booking.status !== "pending" ? (
        <p className="mt-2 text-sm text-ink-soft"><span className="font-semibold text-ink">Your note:</span> {booking.venueNote}</p>
      ) : null}

      {open ? (
        <>
          <div className="mt-3"><FormMessage error={error} /></div>
          <div className="mt-3"><CancelControl booking={booking} onChanged={onChanged} onError={setError} /></div>
        </>
      ) : null}
    </article>
  );
}
