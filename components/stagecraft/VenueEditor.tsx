"use client";

import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Badge, Notice } from "@/components/ui/primitives";
import AvailabilityCalendar from "@/components/stagecraft/AvailabilityCalendar";
import { Field, FormMessage, Select, TextArea, TextInput } from "@/components/stagecraft/fields";
import {
  AMENITIES,
  AMENITY_LABELS,
  PLATFORM_FEE_PERCENT,
  VENUE_LIMITS,
  VENUE_TYPES,
  VENUE_TYPE_LABELS,
  todayDay,
  type Amenity,
  type OwnVenue,
  type PayoutStatus,
  type VenueAvailability,
} from "@/lib/stagecraft-shared";
import { slugify } from "@/lib/text";

function centsToField(cents: number | null): string {
  return cents === null ? "" : String(cents / 100);
}

/**
 * "My venue": the venue's details, payout setup for deposits, and the
 * calendar where the owner blocks nights they can't do.
 */
export default function VenueEditor({
  venue,
  availability,
  payouts,
  accountEmail,
  onSaved,
  onAvailability,
}: {
  venue: OwnVenue | null;
  availability: VenueAvailability;
  payouts: PayoutStatus | null;
  accountEmail: string;
  onSaved: (venue: OwnVenue) => void;
  onAvailability: (availability: VenueAvailability) => void;
}) {
  const [name, setName] = useState(venue?.name ?? "");
  const [slug, setSlug] = useState(venue?.slug ?? "");
  const [venueType, setVenueType] = useState<string>(venue?.venueType ?? "club");
  const [city, setCity] = useState(venue?.city ?? "");
  const [region, setRegion] = useState(venue?.region ?? "");
  const [address, setAddress] = useState(venue?.address ?? "");
  const [capacity, setCapacity] = useState(venue?.capacity ? String(venue.capacity) : "");
  const [description, setDescription] = useState(venue?.description ?? "");
  const [imageUrl, setImageUrl] = useState(venue?.imageUrl ?? "");
  const [websiteUrl, setWebsiteUrl] = useState(venue?.websiteUrl ?? "");
  const [genres, setGenres] = useState(venue?.genres.join(", ") ?? "");
  const [amenities, setAmenities] = useState<Amenity[]>(venue?.amenities ?? []);
  const [rentalFee, setRentalFee] = useState(centsToField(venue?.rentalFeeCents ?? null));
  const [deposit, setDeposit] = useState(venue && venue.depositCents > 0 ? centsToField(venue.depositCents) : "");
  const [contactEmail, setContactEmail] = useState(venue?.contactEmail ?? accountEmail);
  const [isPublished, setIsPublished] = useState(venue?.isPublished ?? true);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const [payoutBusy, setPayoutBusy] = useState(false);
  const [payoutError, setPayoutError] = useState<string | null>(null);

  const [busyDay, setBusyDay] = useState<string | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);

  const pageAddress = slugify(slug || name);

  async function save(event: React.FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const res = await fetch("/api/stagecraft/venue", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name, slug, venueType, city, region, address, capacity, description, imageUrl, websiteUrl,
          genres, amenities, rentalFee, deposit, contactEmail, isPublished,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data.error || "Could not save your venue. Please try again.");
        return;
      }
      setSlug(data.venue.slug);
      setSaved(true);
      onSaved(data.venue as OwnVenue);
    } catch {
      setError("Could not reach the server. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  async function startPayouts() {
    setPayoutBusy(true);
    setPayoutError(null);
    try {
      const res = await fetch("/api/stagecraft/payouts", { method: "POST" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok || !data.url) {
        setPayoutError(data.error || "Could not start payout setup. Please try again.");
        return;
      }
      window.location.assign(data.url);
    } catch {
      setPayoutError("Could not reach the server. Check your connection and try again.");
    } finally {
      setPayoutBusy(false);
    }
  }

  async function toggleDay(day: string) {
    setBusyDay(day);
    setCalendarError(null);
    try {
      const res = await fetch("/api/stagecraft/venue/calendar", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ day, blocked: !availability.blocked.includes(day) }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setCalendarError(data.error || "Could not update your calendar. Please try again.");
        return;
      }
      onAvailability(data.availability as VenueAvailability);
    } catch {
      setCalendarError("Could not reach the server. Check your connection and try again.");
    } finally {
      setBusyDay(null);
    }
  }

  function toggleAmenity(amenity: Amenity) {
    setAmenities((current) => (current.includes(amenity) ? current.filter((a) => a !== amenity) : [...current, amenity]));
  }

  return (
    <div className="space-y-10">
      <form onSubmit={save} className="space-y-6" noValidate>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-display text-2xl font-bold text-ink">{venue ? "Venue details" : "List your venue"}</h2>
          {venue ? (
            <Link href={`/venues/${venue.slug}`} className="text-sm font-semibold text-brand hover:underline">View public page</Link>
          ) : null}
        </div>
        {!venue ? <p className="text-sm text-ink-soft">Fill this in once and your venue gets its own public page that artists can find and request dates from.</p> : null}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Venue name" htmlFor="sc-v-name">
            <TextInput id="sc-v-name" value={name} onChange={(e) => setName(e.target.value)} maxLength={VENUE_LIMITS.name} required />
          </Field>
          <Field label="Page address" hint={pageAddress ? `/venues/${pageAddress}` : "Made from your venue name if you leave it empty."} htmlFor="sc-v-slug">
            <TextInput id="sc-v-slug" value={slug} onChange={(e) => setSlug(e.target.value)} maxLength={60} placeholder="the-blue-room" />
          </Field>
          <Field label="Type of venue" htmlFor="sc-v-type">
            <Select id="sc-v-type" value={venueType} onChange={(e) => setVenueType(e.target.value)}>
              {VENUE_TYPES.map((type) => <option key={type} value={type}>{VENUE_TYPE_LABELS[type]}</option>)}
            </Select>
          </Field>
          <Field label="Capacity" hint="How many people the room holds. Optional." htmlFor="sc-v-capacity">
            <TextInput id="sc-v-capacity" inputMode="numeric" value={capacity} onChange={(e) => setCapacity(e.target.value)} placeholder="250" />
          </Field>
          <Field label="City" htmlFor="sc-v-city">
            <TextInput id="sc-v-city" value={city} onChange={(e) => setCity(e.target.value)} maxLength={VENUE_LIMITS.city} autoComplete="address-level2" required />
          </Field>
          <Field label="State or country" hint="Optional" htmlFor="sc-v-region">
            <TextInput id="sc-v-region" value={region} onChange={(e) => setRegion(e.target.value)} maxLength={VENUE_LIMITS.region} />
          </Field>
          <Field label="Street address" hint="Optional. Shown on your public page." htmlFor="sc-v-address" className="sm:col-span-2">
            <TextInput id="sc-v-address" value={address} onChange={(e) => setAddress(e.target.value)} maxLength={VENUE_LIMITS.address} autoComplete="street-address" />
          </Field>
          <Field label="About the venue" hint="The room, the crowd, how nights usually run." htmlFor="sc-v-description" className="sm:col-span-2">
            <TextArea id="sc-v-description" value={description} onChange={(e) => setDescription(e.target.value)} maxLength={VENUE_LIMITS.description} />
          </Field>
          <Field label="Music you book" hint="Separate with commas. Up to 8." htmlFor="sc-v-genres" className="sm:col-span-2">
            <TextInput id="sc-v-genres" value={genres} onChange={(e) => setGenres(e.target.value)} placeholder="Jazz, Soul, Indie rock" />
          </Field>
        </div>

        <fieldset>
          <legend className="text-sm font-semibold text-ink">What the room has</legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {AMENITIES.map((amenity) => (
              <label key={amenity} className="flex cursor-pointer items-center gap-2.5 rounded-[10px] border border-line bg-card px-3 py-2 text-sm text-ink-soft hover:border-ink">
                <input type="checkbox" checked={amenities.includes(amenity)} onChange={() => toggleAmenity(amenity)} className="h-4 w-4 accent-[var(--ap-brand)]" />
                {AMENITY_LABELS[amenity]}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Rental fee ($)" hint="Your starting price for a night. Use 0 for no fee. Leave empty to show &quot;Ask the venue&quot;." htmlFor="sc-v-rental">
            <TextInput id="sc-v-rental" inputMode="decimal" value={rentalFee} onChange={(e) => setRentalFee(e.target.value)} placeholder="500" />
          </Field>
          <Field label="Usual deposit ($)" hint="What you normally ask for to hold a date. Leave empty for none. You can change it per booking." htmlFor="sc-v-deposit">
            <TextInput id="sc-v-deposit" inputMode="decimal" value={deposit} onChange={(e) => setDeposit(e.target.value)} placeholder="100" />
          </Field>
          <Field label="Photo link" hint="Paste a link to a photo of the room. Optional." htmlFor="sc-v-image">
            <TextInput id="sc-v-image" type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Website" hint="Optional" htmlFor="sc-v-website">
            <TextInput id="sc-v-website" type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Booking email" hint="Where requests are sent. Artists only see it after you accept their request." htmlFor="sc-v-email" className="sm:col-span-2">
            <TextInput id="sc-v-email" type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)} autoComplete="email" required />
          </Field>
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-line bg-muted px-4 py-3">
          <input type="checkbox" checked={isPublished} onChange={(e) => setIsPublished(e.target.checked)} className="mt-0.5 h-4 w-4 accent-[var(--ap-brand)]" />
          <span className="text-sm text-ink">
            <span className="font-semibold">Show my venue in the directory</span>
            <span className="block text-ink-soft">Untick to hide your page while you get it ready. Only you can see a hidden page.</span>
          </span>
        </label>

        <FormMessage error={error} success={saved ? "Saved. Your venue page is up to date." : null} />
        <Button type="submit" disabled={saving}>{saving ? "Saving..." : venue ? "Save venue" : "Create my venue page"}</Button>
      </form>

      {venue ? (
        <>
          <section className="border-t border-line pt-8" aria-labelledby="payouts-heading">
            <div className="flex flex-wrap items-center gap-3">
              <h2 id="payouts-heading" className="font-display text-2xl font-bold text-ink">Deposits and payouts</h2>
              {payouts?.ready ? <Badge tone="green">Ready</Badge> : payouts?.hasAccount ? <Badge tone="gold">Setup not finished</Badge> : null}
            </div>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Deposits are paid by card through Stripe and go straight to your own Stripe account. Stagecraft keeps {PLATFORM_FEE_PERCENT}% of each deposit, and Stripe charges its usual card fee.
              You don&apos;t need this to accept bookings without a deposit.
            </p>
            <div className="mt-4 space-y-3">
              {payouts === null ? (
                <Notice tone="warn">We couldn&apos;t reach Stripe to check your payout setup. Refresh the page to try again.</Notice>
              ) : !payouts.stripeConfigured ? (
                <Notice>Card deposits aren&apos;t switched on for Stagecraft yet. You can still accept bookings without a deposit.</Notice>
              ) : payouts.ready ? (
                <Notice>Your Stripe account can take card payments. You can ask for a deposit when you accept a booking.</Notice>
              ) : (
                <>
                  <Button onClick={startPayouts} disabled={payoutBusy}>
                    {payoutBusy ? "Opening Stripe..." : payouts.hasAccount ? "Finish payout setup" : "Set up payouts with Stripe"}
                  </Button>
                  <p className="text-xs text-ink-faint">You&apos;ll go to Stripe to add your business and bank details, then come back here.</p>
                </>
              )}
              <FormMessage error={payoutError} />
            </div>
          </section>

          <section className="border-t border-line pt-8" aria-labelledby="calendar-heading">
            <h2 id="calendar-heading" className="font-display text-2xl font-bold text-ink">Your calendar</h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-ink-soft">
              Click a night to block it, and click it again to open it back up. Blocked and booked nights can&apos;t be requested on your public page.
            </p>
            <div className="mt-4 max-w-md">
              <AvailabilityCalendar
                mode="manage"
                today={todayDay()}
                blocked={availability.blocked}
                booked={availability.booked}
                busyDay={busyDay}
                onPick={toggleDay}
              />
            </div>
            <div className="mt-3 max-w-md"><FormMessage error={calendarError} /></div>
          </section>
        </>
      ) : null}
    </div>
  );
}
