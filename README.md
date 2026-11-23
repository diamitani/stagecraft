# Stagecraft

Where artists and venues book shows.

- **Venues** list their room, capacity, pricing and open dates on a public page.
- **Artists** search venues, pick an open date and send a booking request.
- **Venues** accept or decline from one inbox. If they ask for a deposit, the artist pays by card (Stripe) and the date is confirmed.

Not built yet: sponsoring shows, and ticket sales for fans. The landing page has a waitlist for both.

## What's inside

| Part | Where |
| --- | --- |
| Landing page + waitlist | `app/page.tsx` |
| Venue search and venue pages | `app/venues/` |
| Signed-in dashboard (requests, venue inbox, venue editor) | `app/dashboard/`, `components/stagecraft/` |
| API routes | `app/api/stagecraft/` |
| Sign-in (email link, no passwords) | `app/login/`, `app/auth/`, `middleware.ts` |
| Business logic and rules | `lib/stagecraft.ts`, `lib/stagecraft-shared.ts` |
| Stripe deposits | `lib/stagecraft-payments.ts`, `lib/stripe-connect.ts` |
| Emails | `lib/stagecraft-email.ts`, `lib/email.ts` |
| Database tables | `supabase/migrations/001_stagecraft.sql` |

Stack: Next.js 14 (App Router), Supabase (Postgres + sign-in), Stripe Connect, Resend, Tailwind.

## Set it up

1. **Create a Supabase project** at supabase.com. In the SQL Editor, paste and run `supabase/migrations/001_stagecraft.sql`. It is safe to run twice.
2. **Turn on email sign-in links.** Supabase dashboard > Authentication > URL Configuration: set *Site URL* to your site address, and add `https://YOUR-SITE/auth/callback` (and `http://localhost:3000/auth/callback` for local work) under *Redirect URLs*.
3. **Copy the settings file:** `cp .env.example .env.local`, then fill in the Supabase values (Project Settings > API).
4. **Run it:**
   ```bash
   npm install
   npm run dev
   ```
   Open http://localhost:3000.

### Optional: card deposits (Stripe)

1. Create a Stripe account and turn on **Connect**.
2. Put your secret key in `STRIPE_SECRET_KEY`.
3. A venue then sets up payouts under *Dashboard > My venue*. Stagecraft keeps 5% of each deposit (change `PLATFORM_FEE_PERCENT` in `lib/stagecraft-shared.ts`).

Deposits are confirmed by asking Stripe whether the payment went through (when either person opens their dashboard), so you do not need to set up a Stripe webhook.

### Optional: emails (Resend)

Put your key in `RESEND_API_KEY` and a verified sender in `STAGECRAFT_FROM_EMAIL`. Venues are emailed when a request arrives, and artists when the venue answers.

## Deploy on Vercel

Import this repo in Vercel and add the same variables from `.env.example` under *Settings > Environment Variables*. Set `NEXT_PUBLIC_SITE_URL` to your live address.

## Checks

```bash
npm run typecheck
npm test
npm run lint
npm run build
```

## Privacy rules built in

- The database is only reachable through the server (row-level security is on with no public policies).
- A venue's booking email is shown to an artist only after the venue accepts. An artist's email is shown only to the venue.
- Public pages never include emails or account ids.
