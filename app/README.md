# ReviewFlow

A **free** Google Business Profile review QR platform for local businesses — managed by a **single Super Admin**. No subscriptions, no pricing, no payments, no billing.

Built by GURUBAR Digital Services. Developed phase-by-phase (Phases 0–7) with a strict test gate at every phase.

## What it does

- The Super Admin creates a client (business) with its details, logo and Google review URL.
- Every client gets a public review page at `/review/<slug>` and a unique QR code that points to it.
- Customers scan the QR → tap **Write a Google Review** → write their own review on Google.
- Visits (scans) and button clicks are tracked with duplicate protection and shown in an analytics dashboard.

**Google policy, by design:** no fake reviews, no auto-posting, no incentives, and **no review gating** — there is no rating question anywhere; every visitor always sees the Google button. A tracked *click* is never called a submitted review, because Google does not share submission data.

## Tech stack

- **Next.js 16.4.6** (App Router, Cache Components, Turbopack) + **React 19** + **TypeScript**
- **Tailwind CSS v4**, **lucide-react** icons, **Recharts** analytics charts
- **Supabase** — Postgres + Auth + Storage, Row Level Security everywhere
- **qrcode** for QR generation, **zod** for validation
- Deploys to **Vercel**

Requires Node.js 20+ (built/tested on Node 24).

## Quick start (local)

1. Create a free project at supabase.com.
2. In Supabase → SQL Editor, run `supabase/RUN_ALL_MIGRATIONS.sql` (all 5 migrations, one paste).
3. Supabase → Authentication → Users → create your admin user, then run:
   ```sql
   update public.profiles set role = 'super_admin' where email = 'YOUR-EMAIL';
   ```
   Then **disable public sign-ups** in Authentication settings.
4. Copy `.env.example` → `.env.local` and fill in your Supabase URL + anon key. Never commit `.env.local`; never paste keys into chat/screenshots.
5. ```bash
   npm install
   npm run dev
   ```
6. Open http://localhost:3000 → log in → add your first client.

**Deployment:** see the Phase 7 deployment guide delivered with this project (Vercel import, environment variables, custom domain, post-deploy checklist).

## Project map

```
src/
  app/
    page.tsx                 Home
    login/                   Super Admin login
    admin/                   Protected dashboard (Dashboard, Clients, QR Codes, Analytics, Settings)
    review/[slug]/           Public review page (reads ONLY the public_clients view)
    api/track/               POST scan / click tracking endpoints
  actions/                   Server Actions (auth, clients, qr, feedback) — all admin actions re-verify the role
  components/admin|review/   UI components
  lib/                       supabase clients, qr/auth/analytics/format helpers
supabase/migrations/         001 profiles+clients · 002 events+view · 003 storage · 004 RLS · 005 tracking functions
```

## Security notes

- The Supabase **service-role key is never used in code** — grep it and you will find only comments saying exactly that. Everything runs on the anon key + RLS + server-side role checks.
- Public pages read a database **view** exposing only safe fields (no email/phone/address).
- Session reads follow the official Next.js 16 *Authentication with Cache Components* pattern (`use cache: private` + `<Suspense>` + `connection()`), after a real `Date.now()` prerendering bug was diagnosed and fixed in Phase 3.
- Tracking stores only a SHA-256 hash of the visitor IP (abuse cap), never the address itself.

## Analytics limitations

A click means "opened Google's review page" — never "submitted a review". Dedupe is per-browser (30-minute scan window), so counts are honest best-effort, like all analytics.

## Version

1.0.0 — all 7 phases complete (10–11 Nov 2026).
