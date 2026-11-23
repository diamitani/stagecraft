/**
 * Stagecraft helpers shared by the browser, API routes and tests.
 * Pure functions only: no database, no server-only imports.
 *
 * Stagecraft connects artists and venues. A venue lists its space at
 * /venues/<slug>, an artist asks for a date, the venue accepts or declines,
 * and an optional deposit is paid through Stripe.
 */
import { cleanText, normalizeEmail, normalizeUrl, slugify } from "@/lib/text";

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

export const VENUE_TYPES = [
  "club", "bar", "theater", "concert_hall", "cafe", "gallery", "outdoor", "house_venue", "studio", "other",
] as const;
export type VenueType = (typeof VENUE_TYPES)[number];

export const VENUE_TYPE_LABELS: Record<VenueType, string> = {
  club: "Club",
  bar: "Bar",
  theater: "Theater",
  concert_hall: "Concert hall",
  cafe: "Cafe",
  gallery: "Gallery",
  outdoor: "Outdoor space",
  house_venue: "House venue",
  studio: "Studio",
  other: "Other",
};

export const AMENITIES = [
  "stage", "pa_system", "sound_engineer", "backline", "lighting", "green_room",
  "bar", "merch_table", "parking", "load_in", "wheelchair_access",
] as const;
export type Amenity = (typeof AMENITIES)[number];

export const AMENITY_LABELS: Record<Amenity, string> = {
  stage: "Stage",
  pa_system: "PA system",
  sound_engineer: "Sound engineer",
  backline: "Backline",
  lighting: "Stage lighting",
  green_room: "Green room",
  bar: "Bar",
  merch_table: "Merch table",
  parking: "Parking",
  load_in: "Easy load-in",
  wheelchair_access: "Wheelchair access",
};

/** What the public site is allowed to see. Never includes the contact email or owner id. */
export interface Venue {
  id: string;
  slug: string;
  name: string;
  venueType: VenueType;
  city: string;
  region: string;
  address: string;
  /** null when the venue did not say. */
  capacity: number | null;
  description: string;
  imageUrl: string;
  websiteUrl: string;
  genres: string[];
  amenities: Amenity[];
  /** null means "ask the venue". 0 means there is no rental fee. */
  rentalFeeCents: number | null;
  /** The deposit this venue usually asks for to hold a date. 0 means none. */
  depositCents: number;
  isPublished: boolean;
}

/** A venue as its owner sees it in the editor: public fields plus the private contact email. */
export interface OwnVenue extends Venue {
  contactEmail: string;
}

export interface CleanVenueInput {
  name: string;
  slug: string;
  venueType: VenueType;
  city: string;
  region: string;
  address: string;
  capacity: number | null;
  description: string;
  imageUrl: string;
  websiteUrl: string;
  genres: string[];
  amenities: Amenity[];
  rentalFeeCents: number | null;
  depositCents: number;
  contactEmail: string;
  isPublished: boolean;
}

export const VENUE_LIMITS = {
  name: 120, city: 80, region: 80, address: 200, description: 2000, genre: 40, genres: 8, capacity: 200000,
} as const;

/** Smallest and largest deposit a venue can ask for, in cents ($1 to $50,000). */
export const MIN_DEPOSIT_CENTS = 100;
export const MAX_MONEY_CENTS = 5_000_000;

/**
 * Stagecraft's cut of a deposit, as a percentage. Change this one number
 * to change the fee everywhere.
 */
export const PLATFORM_FEE_PERCENT = 5;

export function platformFeeCents(depositCents: number): number {
  if (!Number.isFinite(depositCents) || depositCents <= 0) return 0;
  return Math.round((depositCents * PLATFORM_FEE_PERCENT) / 100);
}

/** "$1,250" or "$12.50". Whole dollars drop the cents. */
export function formatMoney(cents: number): string {
  const dollars = cents / 100;
  return dollars.toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(dollars) ? 0 : 2,
    maximumFractionDigits: 2,
  });
}

type MoneyResult = { ok: true; cents: number | null } | { ok: false };

/**
 * Turns a dollar amount from a form ("1,250", "$40.50", 300) into cents.
 * Empty input gives null. Anything that is not a plain amount fails.
 */
export function dollarsToCents(value: unknown): MoneyResult {
  if (value === null || value === undefined || value === "") return { ok: true, cents: null };
  const raw = typeof value === "number" ? String(value) : typeof value === "string" ? value.trim().replace(/[$,\s]/g, "") : "";
  if (raw === "" && typeof value === "string") return { ok: true, cents: null };
  if (!/^\d+(\.\d{1,2})?$/.test(raw)) return { ok: false };
  const cents = Math.round(Number(raw) * 100);
  if (!Number.isFinite(cents) || cents > MAX_MONEY_CENTS) return { ok: false };
  return { ok: true, cents };
}

function cleanParagraphs(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.replace(/\r\n/g, "\n").replace(/[ \t]+/g, " ").replace(/\n{3,}/g, "\n\n").trim().slice(0, max);
}

/** Genres arrive as a list or as "Jazz, Soul, R&B". Trimmed, de-duplicated, capped. */
export function cleanGenres(value: unknown): string[] {
  const parts = Array.isArray(value) ? value : typeof value === "string" ? value.split(/[,\n]/) : [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const part of parts) {
    const genre = cleanText(part, VENUE_LIMITS.genre);
    const key = genre.toLowerCase();
    if (!genre || seen.has(key)) continue;
    seen.add(key);
    out.push(genre);
    if (out.length >= VENUE_LIMITS.genres) break;
  }
  return out;
}

export function cleanAmenities(value: unknown): Amenity[] {
  if (!Array.isArray(value)) return [];
  return AMENITIES.filter((amenity) => value.includes(amenity));
}

/**
 * Cleans the venue editor form. Returns the first problem as a plain-English
 * error. `fallbackEmail` is the owner's account email, used when they leave
 * the booking email empty.
 */
export function cleanVenueInput(
  raw: Record<string, unknown>,
  fallbackEmail = "",
): { ok: true; value: CleanVenueInput } | { ok: false; error: string } {
  const name = cleanText(raw.name, VENUE_LIMITS.name);
  if (!name) return { ok: false, error: "Add your venue's name." };

  const slug = slugify(cleanText(raw.slug, 80) || name);
  if (!slug) return { ok: false, error: "Your page address needs at least one letter or number." };

  const city = cleanText(raw.city, VENUE_LIMITS.city);
  if (!city) return { ok: false, error: "Add the city your venue is in." };

  const venueType = VENUE_TYPES.includes(raw.venueType as VenueType) ? (raw.venueType as VenueType) : "other";

  let capacity: number | null = null;
  if (raw.capacity !== null && raw.capacity !== undefined && raw.capacity !== "") {
    const n = typeof raw.capacity === "number" ? raw.capacity : Number(String(raw.capacity).replace(/[,\s]/g, ""));
    if (!Number.isInteger(n) || n < 1 || n > VENUE_LIMITS.capacity) {
      return { ok: false, error: "Capacity should be a whole number of people, like 250." };
    }
    capacity = n;
  }

  for (const [field, label] of [["websiteUrl", "Website"], ["imageUrl", "Photo"]] as const) {
    if (cleanText(raw[field], 500) && !normalizeUrl(raw[field])) {
      return { ok: false, error: `${label} link doesn't look right. Use a full link like https://example.com.` };
    }
  }

  const rental = dollarsToCents(raw.rentalFee);
  if (!rental.ok) return { ok: false, error: "Rental fee should be a dollar amount, like 500." };

  const deposit = dollarsToCents(raw.deposit);
  if (!deposit.ok) return { ok: false, error: "Deposit should be a dollar amount, like 100." };
  const depositCents = deposit.cents ?? 0;
  if (depositCents > 0 && depositCents < MIN_DEPOSIT_CENTS) {
    return { ok: false, error: "A deposit has to be at least $1. Leave it empty for no deposit." };
  }

  const typedEmail = cleanText(raw.contactEmail, 200);
  if (typedEmail && !normalizeEmail(typedEmail)) return { ok: false, error: "Booking email doesn't look right." };
  const contactEmail = normalizeEmail(typedEmail) || normalizeEmail(fallbackEmail);
  if (!contactEmail) return { ok: false, error: "Add an email where booking requests should be sent." };

  return {
    ok: true,
    value: {
      name,
      slug,
      venueType,
      city,
      region: cleanText(raw.region, VENUE_LIMITS.region),
      address: cleanText(raw.address, VENUE_LIMITS.address),
      capacity,
      description: cleanParagraphs(raw.description, VENUE_LIMITS.description),
      imageUrl: normalizeUrl(raw.imageUrl),
      websiteUrl: normalizeUrl(raw.websiteUrl),
      genres: cleanGenres(raw.genres),
      amenities: cleanAmenities(raw.amenities),
      rentalFeeCents: rental.cents,
      depositCents,
      contactEmail,
      isPublished: raw.isPublished === false ? false : true,
    },
  };
}

/** Free-text search over the fields a visitor would type: name, city, region, genre, type. */
export function venueMatchesSearch(venue: Venue, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    venue.name, venue.city, venue.region, venue.description, VENUE_TYPE_LABELS[venue.venueType], ...venue.genres,
  ].join(" ").toLowerCase();
  return q.split(/\s+/).every((word) => haystack.includes(word));
}

// ---------------------------------------------------------------------------
// Days and the availability calendar. A "day" is always "YYYY-MM-DD".
// ---------------------------------------------------------------------------

/** How far ahead a date can be requested. */
export const MAX_ADVANCE_DAYS = 365;

export function isValidDay(value: unknown): value is string {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

export function toDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

export function todayDay(now: Date = new Date()): string {
  return toDay(now);
}

export function addDays(day: string, count: number): string {
  const date = new Date(`${day}T00:00:00Z`);
  date.setUTCDate(date.getUTCDate() + count);
  return toDay(date);
}

/** "2027-03" for a day or a month string. */
export function monthOf(day: string): string {
  return day.slice(0, 7);
}

export function addMonths(month: string, count: number): string {
  const [year, m] = month.split("-").map(Number);
  const date = new Date(Date.UTC(year, m - 1 + count, 1));
  return toDay(date).slice(0, 7);
}

/** "March 2027" */
export function monthLabel(month: string): string {
  const [year, m] = month.split("-").map(Number);
  return new Date(Date.UTC(year, m - 1, 1)).toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
}

/** "Sat, Mar 6, 2027" */
export function dayLabel(day: string): string {
  if (!isValidDay(day)) return day;
  return new Date(`${day}T00:00:00Z`).toLocaleDateString("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  });
}

/**
 * The weeks of a month for a Sunday-first calendar. Cells outside the month
 * are null, so every week has exactly 7 entries.
 */
export function monthGrid(month: string): (string | null)[][] {
  const [year, m] = month.split("-").map(Number);
  const first = new Date(Date.UTC(year, m - 1, 1));
  const daysInMonth = new Date(Date.UTC(year, m, 0)).getUTCDate();
  const cells: (string | null)[] = Array.from({ length: first.getUTCDay() }, () => null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(toDay(new Date(Date.UTC(year, m - 1, d))));
  while (cells.length % 7 !== 0) cells.push(null);
  const weeks: (string | null)[][] = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** A day can be requested when it is today or later, within the booking window, and not taken. */
export function isRequestableDay(day: string, today: string, unavailable: ReadonlySet<string>): boolean {
  if (!isValidDay(day)) return false;
  if (day < today || day > addDays(today, MAX_ADVANCE_DAYS)) return false;
  return !unavailable.has(day);
}

// ---------------------------------------------------------------------------
// Booking requests
// ---------------------------------------------------------------------------

export const EVENT_TYPES = ["show", "residency", "private_event", "rehearsal", "other"] as const;
export type EventType = (typeof EVENT_TYPES)[number];

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  show: "Live show",
  residency: "Residency night",
  private_event: "Private event",
  rehearsal: "Rehearsal",
  other: "Something else",
};

export type BookingStatus = "pending" | "accepted" | "confirmed" | "declined" | "cancelled";

export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  pending: "Waiting for the venue",
  accepted: "Accepted, deposit due",
  confirmed: "Confirmed",
  declined: "Declined",
  cancelled: "Cancelled",
};

/** Statuses that take the date off the venue's public calendar. */
export const HOLDING_STATUSES: readonly BookingStatus[] = ["accepted", "confirmed"];

export const BOOKING_LIMITS = { artistName: 120, message: 1500, messageMin: 20, note: 600, attendance: 200000 } as const;

export interface CleanBookingInput {
  eventDate: string;
  eventType: EventType;
  expectedAttendance: number | null;
  artistName: string;
  artistEmail: string;
  message: string;
}

/** Cleans an artist's booking request. `today` is passed in so tests are not tied to the clock. */
export function cleanBookingInput(
  raw: Record<string, unknown>,
  opts: { today: string; fallbackEmail?: string },
): { ok: true; value: CleanBookingInput } | { ok: false; error: string } {
  if (!isValidDay(raw.eventDate)) return { ok: false, error: "Pick a date from the calendar." };
  if (raw.eventDate < opts.today) return { ok: false, error: "That date has already passed. Pick a later one." };
  if (raw.eventDate > addDays(opts.today, MAX_ADVANCE_DAYS)) {
    return { ok: false, error: "Dates can be requested up to a year ahead." };
  }

  const artistName = cleanText(raw.artistName, BOOKING_LIMITS.artistName);
  if (!artistName) return { ok: false, error: "Add your artist or band name." };

  const typedEmail = cleanText(raw.artistEmail, 200);
  if (typedEmail && !normalizeEmail(typedEmail)) return { ok: false, error: "Your contact email doesn't look right." };
  const artistEmail = normalizeEmail(typedEmail) || normalizeEmail(opts.fallbackEmail);
  if (!artistEmail) return { ok: false, error: "Add an email the venue can reply to." };

  let expectedAttendance: number | null = null;
  if (raw.expectedAttendance !== null && raw.expectedAttendance !== undefined && raw.expectedAttendance !== "") {
    const n = typeof raw.expectedAttendance === "number"
      ? raw.expectedAttendance
      : Number(String(raw.expectedAttendance).replace(/[,\s]/g, ""));
    if (!Number.isInteger(n) || n < 1 || n > BOOKING_LIMITS.attendance) {
      return { ok: false, error: "Expected crowd should be a whole number, like 80." };
    }
    expectedAttendance = n;
  }

  const message = cleanParagraphs(raw.message, BOOKING_LIMITS.message);
  if (message.length < BOOKING_LIMITS.messageMin) {
    return { ok: false, error: "Tell the venue a little about the night: who is playing, the style, and how many people you expect." };
  }

  return {
    ok: true,
    value: {
      eventDate: raw.eventDate,
      eventType: EVENT_TYPES.includes(raw.eventType as EventType) ? (raw.eventType as EventType) : "show",
      expectedAttendance,
      artistName,
      artistEmail,
      message,
    },
  };
}

export type BookingAction = "accept" | "decline" | "cancel";
export type BookingActor = "venue" | "artist";

export function isBookingAction(value: unknown): value is BookingAction {
  return value === "accept" || value === "decline" || value === "cancel";
}

/**
 * The one place that decides what each side may do to a booking.
 *  - The venue answers a pending request: accept or decline.
 *    Accepting with a deposit holds the date as "accepted" until it is paid;
 *    accepting with no deposit confirms it straight away.
 *  - Either side can cancel anything that is still open.
 */
export function nextBookingStatus(
  current: BookingStatus,
  action: BookingAction,
  actor: BookingActor,
  depositCents = 0,
): { ok: true; status: BookingStatus } | { ok: false; error: string } {
  if (action === "accept" || action === "decline") {
    if (actor !== "venue") return { ok: false, error: "Only the venue can answer a booking request." };
    if (current !== "pending") return { ok: false, error: "This request has already been answered." };
    if (action === "decline") return { ok: true, status: "declined" };
    return { ok: true, status: depositCents > 0 ? "accepted" : "confirmed" };
  }
  if (current === "pending" || current === "accepted" || current === "confirmed") {
    return { ok: true, status: "cancelled" };
  }
  return { ok: false, error: "This booking is already closed." };
}

/** One booking as either side sees it. `role` says which side the viewer is on. */
export interface Booking {
  id: string;
  role: BookingActor;
  venueName: string;
  venueSlug: string;
  venueCity: string;
  artistName: string;
  /** The other side's email. Artists only see the venue's once the venue has said yes. */
  contactEmail: string;
  eventDate: string;
  eventType: EventType;
  expectedAttendance: number | null;
  message: string;
  status: BookingStatus;
  depositCents: number;
  depositPaid: boolean;
  venueNote: string;
  createdAt: string;
}

// ---------------------------------------------------------------------------
// Payouts (what the venue dashboard is told about the owner's Stripe account)
// ---------------------------------------------------------------------------

export interface PayoutStatus {
  /** False when Stripe keys are missing on the server. */
  stripeConfigured: boolean;
  /** True once the venue owner has started a Stripe account. */
  hasAccount: boolean;
  /** True when that account can take card payments, so deposits can be asked for. */
  ready: boolean;
}

export interface VenueAvailability {
  /** Days the owner blocked by hand. */
  blocked: string[];
  /** Days held by an accepted or confirmed booking. */
  booked: string[];
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

export const WAITLIST_ROLES = ["venue", "artist", "sponsor", "fan"] as const;
export type WaitlistRole = (typeof WAITLIST_ROLES)[number];

export const WAITLIST_ROLE_LABELS: Record<WaitlistRole, string> = {
  venue: "I run a venue",
  artist: "I'm an artist",
  sponsor: "I want to sponsor shows",
  fan: "I'm a fan",
};

export interface CleanWaitlistInput {
  email: string;
  role: WaitlistRole;
  name: string;
  city: string;
  note: string;
}

export function cleanWaitlistInput(
  raw: Record<string, unknown>,
): { ok: true; value: CleanWaitlistInput } | { ok: false; error: string } {
  const email = normalizeEmail(raw.email);
  if (!email) return { ok: false, error: "Add a valid email address." };
  if (!WAITLIST_ROLES.includes(raw.role as WaitlistRole)) return { ok: false, error: "Tell us which one you are." };
  return {
    ok: true,
    value: {
      email,
      role: raw.role as WaitlistRole,
      name: cleanText(raw.name, 120),
      city: cleanText(raw.city, 80),
      note: cleanText(raw.note, 600),
    },
  };
}
