"use client";

import { useCallback, useEffect, useState } from "react";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, Notice, PageHeader } from "@/components/ui/primitives";
import { ReceivedBookingCard, SentBookingCard } from "@/components/stagecraft/BookingCards";
import VenueEditor from "@/components/stagecraft/VenueEditor";
import { cn } from "@/lib/utils";
import { todayDay, type Booking, type OwnVenue, type PayoutStatus, type VenueAvailability } from "@/lib/stagecraft-shared";

type Tab = "requests" | "inbox" | "venue";

interface VenueState {
  venue: OwnVenue | null;
  availability: VenueAvailability;
  payouts: PayoutStatus | null;
  accountEmail: string;
}

/** Open bookings first (soonest date first), then past and closed ones. */
function splitBookings(bookings: Booking[]): { upcoming: Booking[]; past: Booking[] } {
  const today = todayDay();
  const isOpen = (b: Booking) => (b.status === "pending" || b.status === "accepted" || b.status === "confirmed") && b.eventDate >= today;
  return {
    upcoming: bookings.filter(isOpen),
    past: bookings.filter((b) => !isOpen(b)).sort((a, b) => b.eventDate.localeCompare(a.eventDate)),
  };
}

function PastList({ bookings, children }: { bookings: Booking[]; children: (b: Booking) => React.ReactNode }) {
  if (bookings.length === 0) return null;
  return (
    <details className="mt-8">
      <summary className="cursor-pointer text-sm font-semibold text-ink-soft hover:text-ink">Past and closed ({bookings.length})</summary>
      <div className="mt-4 space-y-4">{bookings.map(children)}</div>
    </details>
  );
}

export default function StagecraftDashboard({
  initialTab,
  depositResult,
  payoutsResult,
}: {
  initialTab: Tab;
  depositResult: string | null;
  payoutsResult: string | null;
}) {
  const [tab, setTab] = useState<Tab>(initialTab);
  const [sent, setSent] = useState<Booking[]>([]);
  const [received, setReceived] = useState<Booking[]>([]);
  const [venueState, setVenueState] = useState<VenueState | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoadError(null);
    try {
      const [bookingsRes, venueRes] = await Promise.all([fetch("/api/stagecraft/bookings"), fetch("/api/stagecraft/venue")]);
      const bookings = await bookingsRes.json().catch(() => ({}));
      const venue = await venueRes.json().catch(() => ({}));
      if (!bookingsRes.ok) throw new Error(bookings.error || "Could not load your bookings.");
      if (!venueRes.ok) throw new Error(venue.error || "Could not load your venue.");
      setSent(bookings.sent ?? []);
      setReceived(bookings.received ?? []);
      setVenueState({
        venue: venue.venue ?? null,
        availability: venue.availability ?? { blocked: [], booked: [] },
        payouts: venue.payouts ?? null,
        accountEmail: venue.accountEmail ?? "",
      });
    } catch (error) {
      setLoadError(error instanceof Error ? error.message : "Could not load Stagecraft. Please refresh.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  function selectTab(next: Tab) {
    setTab(next);
    const url = new URL(window.location.href);
    url.searchParams.set("tab", next);
    url.searchParams.delete("deposit");
    url.searchParams.delete("payouts");
    window.history.replaceState(null, "", url.toString());
  }

  const pendingForVenue = received.filter((b) => b.status === "pending").length;
  const tabs: { id: Tab; label: string; count?: number }[] = [
    { id: "requests", label: "My requests" },
    { id: "inbox", label: "Venue inbox", count: venueState?.venue ? pendingForVenue : undefined },
    { id: "venue", label: "My venue" },
  ];

  const sentSplit = splitBookings(sent);
  const receivedSplit = splitBookings(received);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
      <PageHeader
        eyebrow="Stagecraft"
        title="Book shows"
        description="Ask venues for dates as an artist, or list your venue and answer requests. Everything about a booking lives here."
        actions={<ButtonLink href="/venues" variant="secondary">Find a venue</ButtonLink>}
      />

      <div role="tablist" aria-label="Stagecraft sections" className="ap-no-scrollbar mt-8 flex gap-1 overflow-x-auto border-b border-line">
        {tabs.map((item) => (
          <button
            key={item.id}
            role="tab"
            type="button"
            aria-selected={tab === item.id}
            onClick={() => selectTab(item.id)}
            className={cn(
              "relative whitespace-nowrap px-3 pb-3 pt-1 text-sm font-semibold transition-colors",
              tab === item.id ? "text-ink after:absolute after:inset-x-3 after:-bottom-px after:h-0.5 after:bg-brand" : "text-ink-faint hover:text-ink",
            )}
          >
            {item.label}
            {item.count ? <span className="ml-1.5 rounded-full bg-brand px-1.5 py-0.5 text-[11px] text-white">{item.count}</span> : null}
          </button>
        ))}
      </div>

      <div className="mt-6 space-y-4">
        {depositResult === "paid" && tab === "requests" ? (
          <Notice>Thanks. Stripe is confirming your payment. Your booking shows as confirmed as soon as it does, usually within a minute.</Notice>
        ) : null}
        {depositResult === "cancelled" && tab === "requests" ? <Notice tone="warn">The payment was cancelled. Nothing was charged. The date stays held until you pay or the venue cancels.</Notice> : null}
        {payoutsResult === "retry" && tab === "venue" ? <Notice tone="warn">The Stripe setup link expired. Click the button below to pick up where you left off.</Notice> : null}

        {loading ? (
          <p className="py-10 text-center text-sm text-ink-soft" role="status">Loading Stagecraft...</p>
        ) : loadError ? (
          <div className="space-y-3">
            <Notice tone="warn">{loadError}</Notice>
            <button type="button" onClick={() => { setLoading(true); void load(); }} className="text-sm font-semibold text-brand hover:underline">Try again</button>
          </div>
        ) : tab === "requests" ? (
          sent.length === 0 ? (
            <EmptyState
              title="You haven't asked a venue for a date yet"
              description="Find a venue that fits your show, pick an open date, and send a request. It's free to ask."
              action={<ButtonLink href="/venues">Find a venue</ButtonLink>}
            />
          ) : (
            <>
              {sentSplit.upcoming.length === 0 ? <p className="text-sm text-ink-soft">No open requests right now.</p> : null}
              {sentSplit.upcoming.map((b) => <SentBookingCard key={b.id} booking={b} onChanged={load} />)}
              <PastList bookings={sentSplit.past}>{(b) => <SentBookingCard key={b.id} booking={b} onChanged={load} />}</PastList>
            </>
          )
        ) : tab === "inbox" ? (
          !venueState?.venue ? (
            <EmptyState
              title="List your venue to get booking requests"
              description="Once your venue has a page, artists can request dates and their requests show up here."
              action={<button type="button" onClick={() => selectTab("venue")} className="inline-flex h-11 items-center rounded-[10px] bg-brand px-5 text-sm font-semibold text-white shadow-ap hover:bg-brand-deep">List my venue</button>}
            />
          ) : received.length === 0 ? (
            <EmptyState
              title="No requests yet"
              description="Share your venue page with artists you'd like to book. Requests show up here and in your email."
              action={<ButtonLink href={`/venues/${venueState.venue.slug}`} variant="secondary">View my venue page</ButtonLink>}
            />
          ) : (
            <>
              {receivedSplit.upcoming.length === 0 ? <p className="text-sm text-ink-soft">No open requests right now.</p> : null}
              {receivedSplit.upcoming.map((b) => (
                <ReceivedBookingCard key={b.id} booking={b} defaultDepositCents={venueState.venue?.depositCents ?? 0} payouts={venueState.payouts} onChanged={load} />
              ))}
              <PastList bookings={receivedSplit.past}>
                {(b) => <ReceivedBookingCard key={b.id} booking={b} defaultDepositCents={venueState.venue?.depositCents ?? 0} payouts={venueState.payouts} onChanged={load} />}
              </PastList>
            </>
          )
        ) : venueState ? (
          <VenueEditor
            venue={venueState.venue}
            availability={venueState.availability}
            payouts={venueState.payouts}
            accountEmail={venueState.accountEmail}
            onSaved={(venue) => setVenueState((s) => (s ? { ...s, venue } : s))}
            onAvailability={(availability) => setVenueState((s) => (s ? { ...s, availability } : s))}
          />
        ) : null}
      </div>
    </div>
  );
}
