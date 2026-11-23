/**
 * Stagecraft data layer (server-only). Backs /venues, /venues/[slug], the
 * /dashboard dashboard, booking requests and the waitlist.
 *
 * Uses the service-role client like the rest of the app, so every access
 * rule lives here, in code:
 *  - Public readers only ever get `Venue` (no contact email, no owner id).
 *  - A booking is visible to exactly two accounts: the artist who sent it
 *    and the owner of the venue it was sent to.
 *  - The artist's email is shown to the venue owner. The venue's email is
 *    shown to the artist only after the venue has said yes.
 */
import "server-only";
import { createServiceClient, isSupabaseConfigured } from "@/lib/supabase/server";
import { isValidSlug } from "@/lib/text";
import {
  AMENITIES,
  EVENT_TYPES,
  HOLDING_STATUSES,
  VENUE_TYPES,
  addDays,
  isValidDay,
  nextBookingStatus,
  platformFeeCents,
  todayDay,
  type Amenity,
  type Booking,
  type BookingAction,
  type BookingActor,
  type BookingStatus,
  type CleanBookingInput,
  type CleanVenueInput,
  type CleanWaitlistInput,
  type EventType,
  type OwnVenue,
  type Venue,
  type VenueAvailability,
  type VenueType,
} from "@/lib/stagecraft-shared";

export class StagecraftError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const NOT_CONNECTED = "Stagecraft isn't connected to the database yet.";

function db() {
  if (!isSupabaseConfigured()) throw new StagecraftError(NOT_CONNECTED, 503);
  return createServiceClient();
}

// ---------------------------------------------------------------------------
// Venues
// ---------------------------------------------------------------------------

const PUBLIC_COLUMNS =
  "id,slug,name,venue_type,city,region,address,capacity,description,image_url,website_url,genres,amenities,rental_fee_cents,deposit_cents,is_published";

interface VenueRow {
  id: string;
  slug: string;
  name: string;
  venue_type: string;
  city: string;
  region: string | null;
  address: string | null;
  capacity: number | null;
  description: string | null;
  image_url: string | null;
  website_url: string | null;
  genres: string[] | null;
  amenities: string[] | null;
  rental_fee_cents: number | null;
  deposit_cents: number;
  is_published: boolean;
}

function toVenue(row: VenueRow): Venue {
  return {
    id: row.id,
    slug: row.slug,
    name: row.name,
    venueType: VENUE_TYPES.includes(row.venue_type as VenueType) ? (row.venue_type as VenueType) : "other",
    city: row.city,
    region: row.region ?? "",
    address: row.address ?? "",
    capacity: row.capacity,
    description: row.description ?? "",
    imageUrl: row.image_url ?? "",
    websiteUrl: row.website_url ?? "",
    genres: Array.isArray(row.genres) ? row.genres : [],
    amenities: AMENITIES.filter((a) => (row.amenities ?? []).includes(a)) as Amenity[],
    rentalFeeCents: row.rental_fee_cents,
    depositCents: row.deposit_cents ?? 0,
    isPublished: row.is_published,
  };
}

/** Published venues for the /venues directory. Empty list if the database isn't configured. */
export async function listPublicVenues(limit = 500): Promise<Venue[]> {
  if (!isSupabaseConfigured()) return [];
  const { data, error } = await createServiceClient()
    .from("venues")
    .select(PUBLIC_COLUMNS)
    .eq("is_published", true)
    .order("name", { ascending: true })
    .limit(limit);
  if (error) {
    console.error("[stagecraft] venue list failed", error.message);
    return [];
  }
  return (data as VenueRow[]).map(toVenue);
}

/** One venue by slug. Unpublished pages are only returned to their owner. */
export async function getVenueBySlug(slug: string, viewerId?: string | null): Promise<Venue | null> {
  if (!isSupabaseConfigured() || !isValidSlug(slug)) return null;
  const { data, error } = await createServiceClient()
    .from("venues")
    .select(`${PUBLIC_COLUMNS},owner_user_id`)
    .eq("slug", slug)
    .maybeSingle();
  if (error || !data) return null;
  const row = data as VenueRow & { owner_user_id: string };
  if (!row.is_published && (!viewerId || row.owner_user_id !== viewerId)) return null;
  return toVenue(row);
}

export async function userOwnsVenue(userId: string, slug: string): Promise<boolean> {
  if (!isSupabaseConfigured() || !isValidSlug(slug)) return false;
  const { data } = await createServiceClient()
    .from("venues")
    .select("id")
    .eq("slug", slug)
    .eq("owner_user_id", userId)
    .maybeSingle();
  return Boolean(data);
}

export async function getOwnVenue(userId: string): Promise<OwnVenue | null> {
  const { data, error } = await db()
    .from("venues")
    .select(`${PUBLIC_COLUMNS},contact_email`)
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (error) throw new StagecraftError("Could not load your venue.", 502);
  if (!data) return null;
  const row = data as VenueRow & { contact_email: string };
  return { ...toVenue(row), contactEmail: row.contact_email };
}

const SLUG_TAKEN = "That page address is already taken. Try adding your city or neighborhood.";

/** Create or update the signed-in user's venue. Everyone has at most one. */
export async function saveOwnVenue(userId: string, input: CleanVenueInput): Promise<OwnVenue> {
  const sb = db();
  const columns = {
    slug: input.slug,
    name: input.name,
    venue_type: input.venueType,
    city: input.city,
    region: input.region || null,
    address: input.address || null,
    capacity: input.capacity,
    description: input.description || null,
    image_url: input.imageUrl || null,
    website_url: input.websiteUrl || null,
    genres: input.genres,
    amenities: input.amenities,
    rental_fee_cents: input.rentalFeeCents,
    deposit_cents: input.depositCents,
    contact_email: input.contactEmail,
    is_published: input.isPublished,
    updated_at: new Date().toISOString(),
  };

  const { data: existing, error: lookupError } = await sb
    .from("venues")
    .select("id")
    .eq("owner_user_id", userId)
    .maybeSingle();
  if (lookupError) throw new StagecraftError("Could not save your venue.", 502);

  const query = existing
    ? sb.from("venues").update(columns).eq("id", (existing as { id: string }).id).eq("owner_user_id", userId)
    : sb.from("venues").insert({ ...columns, owner_user_id: userId });
  const { data, error } = await query.select(`${PUBLIC_COLUMNS},contact_email`).single();
  if (error) {
    if (error.code === "23505") throw new StagecraftError(SLUG_TAKEN, 409);
    throw new StagecraftError("Could not save your venue.", 502);
  }
  const row = data as VenueRow & { contact_email: string };
  return { ...toVenue(row), contactEmail: row.contact_email };
}

// ---------------------------------------------------------------------------
// Availability
// ---------------------------------------------------------------------------

/** Blocked and booked days for a venue from today through the booking window. */
export async function getAvailability(venueId: string, from: string = todayDay()): Promise<VenueAvailability> {
  if (!isSupabaseConfigured()) return { blocked: [], booked: [] };
  const sb = createServiceClient();
  const to = addDays(from, 400);
  const [blocked, booked] = await Promise.all([
    sb.from("venue_blocked_dates").select("day").eq("venue_id", venueId).gte("day", from).lte("day", to),
    sb.from("venue_bookings").select("event_date").eq("venue_id", venueId)
      .in("status", HOLDING_STATUSES as unknown as string[]).gte("event_date", from).lte("event_date", to),
  ]);
  if (blocked.error || booked.error) {
    console.error("[stagecraft] availability failed", blocked.error?.message ?? booked.error?.message);
    throw new StagecraftError("Could not load this venue's calendar.", 502);
  }
  return {
    blocked: (blocked.data as { day: string }[]).map((r) => r.day).sort(),
    booked: (booked.data as { event_date: string }[]).map((r) => r.event_date).sort(),
  };
}

/** The owner marks one day as unavailable, or opens it back up. */
export async function setBlockedDay(userId: string, day: string, blocked: boolean): Promise<void> {
  if (!isValidDay(day)) throw new StagecraftError("That date isn't valid.", 422);
  const sb = db();
  const { data: venue, error } = await sb.from("venues").select("id").eq("owner_user_id", userId).maybeSingle();
  if (error) throw new StagecraftError("Could not update your calendar.", 502);
  if (!venue) throw new StagecraftError("Create your venue first.", 404);
  const venueId = (venue as { id: string }).id;

  if (blocked) {
    const { error: upsertError } = await sb
      .from("venue_blocked_dates")
      .upsert({ venue_id: venueId, day }, { onConflict: "venue_id,day", ignoreDuplicates: true });
    if (upsertError) throw new StagecraftError("Could not update your calendar.", 502);
    return;
  }
  const { error: deleteError } = await sb.from("venue_blocked_dates").delete().eq("venue_id", venueId).eq("day", day);
  if (deleteError) throw new StagecraftError("Could not update your calendar.", 502);
}

// ---------------------------------------------------------------------------
// Bookings
// ---------------------------------------------------------------------------

const BOOKING_COLUMNS =
  "id,venue_id,artist_user_id,artist_name,artist_email,event_date,event_type,expected_attendance,message,status,deposit_cents,platform_fee_cents,stripe_account_id,stripe_session_id,deposit_paid_at,venue_note,created_at,venues(id,name,slug,city,contact_email,owner_user_id,deposit_cents)";

interface BookingRow {
  id: string;
  venue_id: string;
  artist_user_id: string;
  artist_name: string;
  artist_email: string;
  event_date: string;
  event_type: string;
  expected_attendance: number | null;
  message: string;
  status: BookingStatus;
  deposit_cents: number;
  platform_fee_cents: number;
  stripe_account_id: string | null;
  stripe_session_id: string | null;
  deposit_paid_at: string | null;
  venue_note: string | null;
  created_at: string;
  venues: {
    id: string;
    name: string;
    slug: string;
    city: string;
    contact_email: string;
    owner_user_id: string;
    deposit_cents: number;
  };
}

function toBooking(row: BookingRow, role: BookingActor): Booking {
  const venueSaidYes = row.status === "accepted" || row.status === "confirmed";
  return {
    id: row.id,
    role,
    venueName: row.venues.name,
    venueSlug: row.venues.slug,
    venueCity: row.venues.city,
    artistName: row.artist_name,
    contactEmail: role === "venue" ? row.artist_email : venueSaidYes ? row.venues.contact_email : "",
    eventDate: row.event_date,
    eventType: EVENT_TYPES.includes(row.event_type as EventType) ? (row.event_type as EventType) : "other",
    expectedAttendance: row.expected_attendance,
    message: row.message,
    status: row.status,
    depositCents: row.deposit_cents,
    depositPaid: Boolean(row.deposit_paid_at),
    venueNote: row.venue_note ?? "",
    createdAt: row.created_at,
  };
}

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}

/** Loads a booking and works out which side of it this user is on. 404 for anyone else. */
async function loadBookingFor(userId: string, bookingId: string): Promise<{ row: BookingRow; actor: BookingActor }> {
  if (!isUuid(bookingId)) throw new StagecraftError("Booking not found.", 404);
  const { data, error } = await db().from("venue_bookings").select(BOOKING_COLUMNS).eq("id", bookingId).maybeSingle();
  if (error) throw new StagecraftError("Could not load that booking.", 502);
  const row = data as unknown as BookingRow | null;
  if (!row) throw new StagecraftError("Booking not found.", 404);
  if (row.venues.owner_user_id === userId) return { row, actor: "venue" };
  if (row.artist_user_id === userId) return { row, actor: "artist" };
  throw new StagecraftError("Booking not found.", 404);
}

export interface NewBookingResult {
  booking: Booking;
  /** Private: where to send the "new request" email. */
  venueContactEmail: string;
}

/** An artist asks a venue for a date. */
export async function createBooking(
  user: { id: string },
  venueSlug: string,
  input: CleanBookingInput,
): Promise<NewBookingResult> {
  const sb = db();
  if (!isValidSlug(venueSlug)) throw new StagecraftError("Venue not found.", 404);

  const { data: venue, error: venueError } = await sb
    .from("venues")
    .select("id,owner_user_id,is_published")
    .eq("slug", venueSlug)
    .maybeSingle();
  if (venueError) throw new StagecraftError("Could not look up that venue.", 502);
  const venueRow = venue as { id: string; owner_user_id: string; is_published: boolean } | null;
  if (!venueRow || !venueRow.is_published) throw new StagecraftError("Venue not found.", 404);
  if (venueRow.owner_user_id === user.id) throw new StagecraftError("This is your own venue, so there's nothing to request.", 409);

  const availability = await getAvailability(venueRow.id, input.eventDate);
  if (availability.blocked.includes(input.eventDate) || availability.booked.includes(input.eventDate)) {
    throw new StagecraftError("That date isn't available any more. Pick another one.", 409);
  }

  const { data, error } = await sb
    .from("venue_bookings")
    .insert({
      venue_id: venueRow.id,
      artist_user_id: user.id,
      artist_name: input.artistName,
      artist_email: input.artistEmail,
      event_date: input.eventDate,
      event_type: input.eventType,
      expected_attendance: input.expectedAttendance,
      message: input.message,
      status: "pending",
    })
    .select(BOOKING_COLUMNS)
    .single();
  if (error) {
    if (error.code === "23505") throw new StagecraftError("You've already asked this venue for that date.", 409);
    throw new StagecraftError("Could not send your request.", 502);
  }
  const row = data as unknown as BookingRow;
  return { booking: toBooking(row, "artist"), venueContactEmail: row.venues.contact_email };
}

export interface MyBookings {
  /** Requests this user sent as an artist. */
  sent: Booking[];
  /** Requests sent to this user's venue. */
  received: Booking[];
}

export async function listMyBookings(userId: string): Promise<MyBookings> {
  const sb = db();
  const { data: venue } = await sb.from("venues").select("id").eq("owner_user_id", userId).maybeSingle();
  const venueId = (venue as { id: string } | null)?.id ?? null;

  const [sent, received] = await Promise.all([
    sb.from("venue_bookings").select(BOOKING_COLUMNS).eq("artist_user_id", userId)
      .order("event_date", { ascending: true }).limit(200),
    venueId
      ? sb.from("venue_bookings").select(BOOKING_COLUMNS).eq("venue_id", venueId)
          .order("event_date", { ascending: true }).limit(500)
      : Promise.resolve({ data: [], error: null }),
  ]);
  if (sent.error || received.error) throw new StagecraftError("Could not load your bookings.", 502);
  return {
    sent: (sent.data as unknown as BookingRow[]).map((row) => toBooking(row, "artist")),
    received: (received.data as unknown as BookingRow[]).map((row) => toBooking(row, "venue")),
  };
}

export interface BookingActionContext {
  actor: BookingActor;
  status: BookingStatus;
  /** The deposit the venue usually asks for; used when the owner accepts without typing one. */
  venueDefaultDepositCents: number;
}

/** What the route needs to know before it lets an action through (for example, the payout check). */
export async function getBookingActionContext(userId: string, bookingId: string): Promise<BookingActionContext> {
  const { row, actor } = await loadBookingFor(userId, bookingId);
  return { actor, status: row.status, venueDefaultDepositCents: row.venues.deposit_cents ?? 0 };
}

export interface BookingActionResult {
  booking: Booking;
  actor: BookingActor;
  /** Private: the other side's email, for the notification. */
  notifyEmail: string;
}

/**
 * Accept, decline or cancel a booking. `depositCents` only matters when the
 * venue accepts; `note` is the venue's reply to the artist.
 */
export async function actOnBooking(
  userId: string,
  bookingId: string,
  action: BookingAction,
  opts: { depositCents?: number; note?: string } = {},
): Promise<BookingActionResult> {
  const { row, actor } = await loadBookingFor(userId, bookingId);
  const depositCents = action === "accept" ? Math.max(0, Math.round(opts.depositCents ?? 0)) : row.deposit_cents;

  const next = nextBookingStatus(row.status, action, actor, depositCents);
  if (!next.ok) throw new StagecraftError(next.error, 409);
  if (action === "accept" && row.event_date < todayDay()) {
    throw new StagecraftError("That date has already passed.", 409);
  }

  const now = new Date().toISOString();
  const changes: Record<string, unknown> = { status: next.status, updated_at: now };
  if (action === "accept") {
    changes.deposit_cents = depositCents;
    changes.platform_fee_cents = platformFeeCents(depositCents);
  }
  if (action === "accept" || action === "decline") changes.responded_at = now;
  if (actor === "venue" && opts.note) changes.venue_note = opts.note;

  // Only move the booking if nobody else changed it in the meantime.
  const { data, error } = await db()
    .from("venue_bookings")
    .update(changes)
    .eq("id", row.id)
    .eq("status", row.status)
    .select(BOOKING_COLUMNS);
  if (error) {
    if (error.code === "23505") throw new StagecraftError("You already have a booking on that date. Cancel it first, or decline this one.", 409);
    throw new StagecraftError("Could not update that booking.", 502);
  }
  const updated = (data as unknown as BookingRow[] | null)?.[0];
  if (!updated) throw new StagecraftError("This booking just changed. Refresh and try again.", 409);

  return {
    booking: toBooking(updated, actor),
    actor,
    notifyEmail: actor === "venue" ? updated.artist_email : updated.venues.contact_email,
  };
}

// ---------------------------------------------------------------------------
// Deposits (the Stripe calls themselves live in lib/stagecraft-payments.ts)
// ---------------------------------------------------------------------------

export interface DepositBooking {
  id: string;
  status: BookingStatus;
  eventDate: string;
  artistEmail: string;
  venueName: string;
  venueSlug: string;
  venueOwnerId: string;
  venueContactEmail: string;
  artistName: string;
  depositCents: number;
  platformFeeCents: number;
  stripeAccountId: string | null;
  stripeSessionId: string | null;
  depositPaid: boolean;
}

function toDepositBooking(row: BookingRow): DepositBooking {
  return {
    id: row.id,
    status: row.status,
    eventDate: row.event_date,
    artistEmail: row.artist_email,
    venueName: row.venues.name,
    venueSlug: row.venues.slug,
    venueOwnerId: row.venues.owner_user_id,
    venueContactEmail: row.venues.contact_email,
    artistName: row.artist_name,
    depositCents: row.deposit_cents,
    platformFeeCents: row.platform_fee_cents,
    stripeAccountId: row.stripe_account_id,
    stripeSessionId: row.stripe_session_id,
    depositPaid: Boolean(row.deposit_paid_at),
  };
}

/** The booking an artist is about to pay a deposit on. Only the artist who sent it can pay. */
export async function getDepositBookingForArtist(userId: string, bookingId: string): Promise<DepositBooking> {
  const { row, actor } = await loadBookingFor(userId, bookingId);
  if (actor !== "artist") throw new StagecraftError("Only the artist who sent this request pays the deposit.", 403);
  return toDepositBooking(row);
}

/** Bookings on either side of this user that are waiting on a deposit and have a checkout in flight. */
export async function listAwaitingDeposit(userId: string): Promise<DepositBooking[]> {
  const sb = db();
  const { data: venue } = await sb.from("venues").select("id").eq("owner_user_id", userId).maybeSingle();
  const venueId = (venue as { id: string } | null)?.id ?? null;
  const filter = venueId ? `artist_user_id.eq.${userId},venue_id.eq.${venueId}` : `artist_user_id.eq.${userId}`;
  const { data, error } = await sb
    .from("venue_bookings")
    .select(BOOKING_COLUMNS)
    .eq("status", "accepted")
    .not("stripe_session_id", "is", null)
    .or(filter)
    .limit(25);
  if (error) throw new StagecraftError("Could not check deposit payments.", 502);
  return (data as unknown as BookingRow[]).map(toDepositBooking);
}

export async function saveDepositSession(bookingId: string, sessionId: string, stripeAccountId: string): Promise<void> {
  const { error } = await db()
    .from("venue_bookings")
    .update({ stripe_session_id: sessionId, stripe_account_id: stripeAccountId, updated_at: new Date().toISOString() })
    .eq("id", bookingId)
    .eq("status", "accepted");
  if (error) throw new StagecraftError("Could not start the deposit payment.", 502);
}

/** Marks the deposit paid and confirms the booking. Returns false when it was already handled. */
export async function confirmDepositPaid(bookingId: string, sessionId: string): Promise<boolean> {
  const now = new Date().toISOString();
  const { data, error } = await db()
    .from("venue_bookings")
    .update({ status: "confirmed", deposit_paid_at: now, updated_at: now })
    .eq("id", bookingId)
    .eq("status", "accepted")
    .eq("stripe_session_id", sessionId)
    .select("id");
  if (error) throw new StagecraftError("Could not record the deposit payment.", 502);
  return (data?.length ?? 0) > 0;
}

// ---------------------------------------------------------------------------
// Waitlist
// ---------------------------------------------------------------------------

export async function joinWaitlist(input: CleanWaitlistInput, userId: string | null): Promise<void> {
  const { error } = await db()
    .from("stagecraft_waitlist")
    .upsert(
      {
        email: input.email,
        role: input.role,
        name: input.name || null,
        city: input.city || null,
        note: input.note || null,
        user_id: userId,
      },
      { onConflict: "email,role" },
    );
  if (error) {
    console.error("[stagecraft] waitlist insert failed", error.message);
    throw new StagecraftError("Could not add you to the list. Please try again.", 502);
  }
}
