-- 001_stagecraft.sql
-- Stagecraft: venues list their space,
-- artists request dates, the venue accepts or declines, and an optional
-- deposit is paid through the venue's Stripe Connect account.
--
-- venues               : one row per public venue page (/venues/<slug>).
--                        One venue per account in this first version.
-- venue_blocked_dates  : days the venue owner has marked as unavailable.
-- venue_bookings       : an artist's request for one date at one venue.
--   pending   -> the venue has not answered yet
--   accepted  -> the venue said yes and asked for a deposit (date is held)
--   confirmed -> booked (deposit paid, or no deposit was asked for)
--   declined  -> the venue said no
--   cancelled -> either side called it off
-- artist_listings      : public artist pages, shared with Artispreneur (see below).
-- stagecraft_waitlist  : interest from venues, artists, sponsors and fans
--                        for the parts of Stagecraft that ship next.
--
-- The browser never touches these tables directly. Only server routes using service_role read and write them, so
-- RLS stays on with no policies. venues.contact_email and
-- venue_bookings.artist_email are private and are only ever shown to the
-- other party of a booking.
--
-- Additive and idempotent.

-- artist_listings : public artist pages (/artists/<slug>). This is the same table the Artispreneur
--                   artist directory uses. If you point Stagecraft at the Artispreneur Supabase
--                   project it already exists and this statement does nothing. Stagecraft only
--                   reads it; artists create and edit their page on artispreneur.com.
create table if not exists public.artist_listings (
  id             uuid primary key default gen_random_uuid(),
  slug           text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name           text not null,
  genre          text,
  city           text,
  bio            text,
  image_url      text,
  website_url    text,
  booking_email  text,
  contact_email  text,
  links          jsonb not null default '{}'::jsonb,
  status         text not null default 'unclaimed' check (status in ('unclaimed', 'claimed')),
  owner_user_id  text,
  is_published   boolean not null default true,
  source         text not null default 'user' check (source in ('user', 'import')),
  claimed_at     timestamptz,
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now(),
  constraint artist_listings_owner_matches_status
    check ((status = 'claimed') = (owner_user_id is not null))
);
create unique index if not exists artist_listings_owner_idx
  on public.artist_listings (owner_user_id) where owner_user_id is not null;
create index if not exists artist_listings_published_idx
  on public.artist_listings (is_published, name);
alter table public.artist_listings enable row level security;

create table if not exists public.venues (
  id               uuid primary key default gen_random_uuid(),
  slug             text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  name             text not null,
  venue_type       text not null default 'other'
                   check (venue_type in ('club', 'bar', 'theater', 'concert_hall', 'cafe',
                                         'gallery', 'outdoor', 'house_venue', 'studio', 'other')),
  city             text not null,
  region           text,                       -- state, province or country
  address          text,
  capacity         int check (capacity is null or (capacity > 0 and capacity <= 200000)),
  description      text,
  image_url        text,
  website_url      text,
  genres           text[] not null default '{}',
  amenities        text[] not null default '{}',
  rental_fee_cents int check (rental_fee_cents is null or rental_fee_cents >= 0),  -- null = "ask"
  deposit_cents    int not null default 0 check (deposit_cents >= 0),              -- usual deposit to hold a date
  contact_email    text not null,              -- PRIVATE: where booking requests are sent
  owner_user_id    text not null,              -- auth.users.id (text, matching profiles.user_id)
  is_published     boolean not null default true,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);

-- One venue per account: "My venue" always opens the same page.
create unique index if not exists venues_owner_idx on public.venues (owner_user_id);
create index if not exists venues_published_idx on public.venues (is_published, name);
create index if not exists venues_city_idx on public.venues (lower(city));

alter table public.venues enable row level security;

create table if not exists public.venue_blocked_dates (
  venue_id    uuid not null references public.venues(id) on delete cascade,
  day         date not null,
  created_at  timestamptz not null default now(),
  primary key (venue_id, day)
);

alter table public.venue_blocked_dates enable row level security;

create table if not exists public.venue_bookings (
  id                   uuid primary key default gen_random_uuid(),
  venue_id             uuid not null references public.venues(id) on delete cascade,
  artist_user_id       text not null,
  artist_name          text not null,
  artist_email         text not null,          -- PRIVATE: shown only to the venue owner
  event_date           date not null,
  event_type           text not null default 'show'
                       check (event_type in ('show', 'residency', 'private_event', 'rehearsal', 'other')),
  expected_attendance  int check (expected_attendance is null or expected_attendance > 0),
  message              text not null,
  status               text not null default 'pending'
                       check (status in ('pending', 'accepted', 'confirmed', 'declined', 'cancelled')),
  deposit_cents        int not null default 0 check (deposit_cents >= 0),
  platform_fee_cents   int not null default 0 check (platform_fee_cents >= 0),
  currency             text not null default 'usd',
  stripe_account_id    text,                   -- the venue's connected account the deposit is charged on
  stripe_session_id    text,                   -- latest Checkout Session for the deposit
  deposit_paid_at      timestamptz,
  venue_note           text,                   -- the venue's reply to the artist
  responded_at         timestamptz,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);

-- A venue can hold a date for only one booking at a time.
create unique index if not exists venue_bookings_one_hold_idx
  on public.venue_bookings (venue_id, event_date) where status in ('accepted', 'confirmed');
-- An artist can have only one open request per venue per date.
create unique index if not exists venue_bookings_one_pending_idx
  on public.venue_bookings (venue_id, artist_user_id, event_date) where status = 'pending';
create index if not exists venue_bookings_venue_idx on public.venue_bookings (venue_id, event_date);
create index if not exists venue_bookings_artist_idx on public.venue_bookings (artist_user_id, created_at desc);
create unique index if not exists venue_bookings_session_idx
  on public.venue_bookings (stripe_session_id) where stripe_session_id is not null;

alter table public.venue_bookings enable row level security;

create table if not exists public.stagecraft_waitlist (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  role        text not null check (role in ('venue', 'artist', 'sponsor', 'fan')),
  name        text,
  city        text,
  note        text,
  user_id     text,
  created_at  timestamptz not null default now()
);

-- Signing up twice for the same role updates the first row instead of adding another.
create unique index if not exists stagecraft_waitlist_email_role_idx
  on public.stagecraft_waitlist (email, role);

alter table public.stagecraft_waitlist enable row level security;

comment on table public.venues is 'Stagecraft venue pages (/venues/<slug>). Written by service role only.';
comment on table public.venue_bookings is 'Stagecraft booking requests from artists to venues. Written by service role only.';
comment on table public.stagecraft_waitlist is 'Stagecraft interest list (venue, artist, sponsor, fan). Written by service role only.';
