# DriftPass — Complete System Architecture

> Production-ready. Built to scale to millions. Layered so it never becomes spaghetti.

---

## System Overview

DriftPass is a **credit-based travel pass platform** (ClassPass for travellers). The system has three distinct user types with separate portals, a credit ledger engine, Stripe billing, and hooks for every planned Phase 3–6 feature (flash sales, map, push notifications, community).

```
┌─────────────────────────────────────────────────────────────────┐
│                         CLIENTS                                  │
│  Marketing Site │ Subscriber App │ Partner Portal │ Admin Panel  │
└────────┬────────┴───────┬────────┴───────┬─────────┴──────┬──────┘
         │                │                │                 │
         └────────────────▼────────────────▼─────────────────┘
                     Next.js 14 App Router (Vercel Edge)
                     ┌────────────────────────────────┐
                     │   /app  (routes + API routes)   │
                     │   /lib  (pure business logic)   │
                     │   /components (React UI)        │
                     └─────────────┬──────────────────┘
                                   │
         ┌─────────────────────────▼─────────────────────────┐
         │                   SERVICES                         │
         │  Supabase (Postgres + Auth + Realtime + Storage)   │
         │  Stripe (Subscriptions + Connect + Webhooks)        │
         │  Resend (Transactional email)                       │
         │  Upstash Redis (rate limiting + flash timers)       │
         │  OneSignal (push notifications — Phase 3)           │
         │  Mapbox (partner map — Phase 4)                     │
         └────────────────────────────────────────────────────┘
```

---

## File Structure

```
driftpass/
├── ARCHITECTURE.md              ← you are here
├── package.json
├── next.config.ts
├── tsconfig.json
├── tailwind.config.ts
├── .env.example
├── vercel.json
│
├── supabase/
│   ├── migrations/
│   │   ├── 001_initial_schema.sql       ← all tables
│   │   ├── 002_rls_policies.sql         ← row-level security
│   │   ├── 003_functions.sql            ← DB functions + triggers
│   │   └── 004_seed_data.sql            ← plans + service types
│   └── config.toml
│
├── src/
│   ├── middleware.ts                    ← auth + rate limit guard
│   │
│   ├── types/
│   │   ├── database.types.ts            ← generated Supabase types
│   │   └── index.ts                     ← app-level types
│   │
│   ├── constants/
│   │   ├── plans.ts                     ← plan definitions (credits, price, features)
│   │   └── services.ts                  ← service credit costs
│   │
│   ├── lib/
│   │   ├── supabase/
│   │   │   ├── client.ts                ← browser client
│   │   │   ├── server.ts                ← server client (cookies)
│   │   │   └── admin.ts                 ← service-role client (webhooks only)
│   │   ├── stripe/
│   │   │   ├── config.ts                ← Stripe instance + plan price IDs
│   │   │   └── webhooks.ts              ← webhook event handlers
│   │   ├── credits/
│   │   │   └── engine.ts                ← credit ledger: deduct, top-up, balance
│   │   ├── qr/
│   │   │   └── generator.ts             ← QR code generation for passes
│   │   ├── notifications/
│   │   │   └── push.ts                  ← OneSignal wrapper (Phase 3 ready)
│   │   ├── email/
│   │   │   └── resend.ts                ← email templates + sender
│   │   └── utils/
│   │       ├── cn.ts                    ← classname helper
│   │       └── format.ts                ← currency, date formatters
│   │
│   ├── app/
│   │   ├── layout.tsx                   ← root layout
│   │   ├── page.tsx                     ← marketing landing page
│   │   ├── globals.css
│   │   │
│   │   ├── (marketing)/
│   │   │   ├── pricing/page.tsx         ← plan pricing page
│   │   │   └── partners/page.tsx        ← become a partner CTA
│   │   │
│   │   ├── (auth)/
│   │   │   ├── login/page.tsx
│   │   │   ├── signup/page.tsx
│   │   │   └── callback/route.ts        ← Supabase OAuth callback
│   │   │
│   │   ├── (dashboard)/                 ← subscriber-only (middleware guarded)
│   │   │   ├── layout.tsx
│   │   │   ├── dashboard/page.tsx       ← credit balance, nearby partners
│   │   │   ├── pass/page.tsx            ← QR code pass
│   │   │   ├── explore/page.tsx         ← partner discovery (Phase 2+)
│   │   │   ├── events/page.tsx          ← events calendar (Phase 2+)
│   │   │   ├── flash/page.tsx           ← flash deals (Phase 3+)
│   │   │   ├── map/page.tsx             ← route map (Phase 4+)
│   │   │   └── account/page.tsx         ← subscription management
│   │   │
│   │   ├── (partner)/                   ← partner-only (middleware guarded)
│   │   │   ├── layout.tsx
│   │   │   ├── scan/page.tsx            ← QR scanner + redemption
│   │   │   └── portal/page.tsx          ← partner dashboard (Phase 4)
│   │   │
│   │   ├── (admin)/                     ← admin-only
│   │   │   ├── layout.tsx
│   │   │   └── admin/page.tsx           ← admin dashboard
│   │   │
│   │   └── api/
│   │       ├── stripe/
│   │       │   ├── webhook/route.ts     ← Stripe webhook endpoint
│   │       │   └── portal/route.ts      ← customer portal session
│   │       ├── subscriptions/
│   │       │   └── route.ts             ← create/cancel subscription
│   │       ├── redemptions/
│   │       │   └── route.ts             ← log credit redemption
│   │       ├── partners/
│   │       │   ├── route.ts             ← list/create partners
│   │       │   └── [id]/route.ts        ← get/update partner
│   │       ├── flash/
│   │       │   └── route.ts             ← flash deal CRUD (Phase 3)
│   │       ├── credits/
│   │       │   └── topup/route.ts       ← buy extra credits
│   │       └── notifications/
│   │           └── route.ts             ← send push notification (Phase 3)
│   │
│   └── components/
│       ├── ui/
│       │   ├── Button.tsx
│       │   ├── Card.tsx
│       │   ├── Badge.tsx
│       │   ├── Input.tsx
│       │   └── Modal.tsx
│       ├── marketing/
│       │   ├── Hero.tsx
│       │   ├── PlanCards.tsx
│       │   └── PartnerLogos.tsx
│       ├── dashboard/
│       │   ├── CreditBalance.tsx
│       │   ├── NearbyPartners.tsx
│       │   └── RecentActivity.tsx
│       ├── pass/
│       │   └── QRPass.tsx
│       └── partner/
│           └── QRScanner.tsx
```

---

## Database Schema

### Core Principle
Every table has `created_at`, `updated_at`. UUIDs everywhere. Soft deletes (`deleted_at`) on mutable records. The credit system uses an **immutable ledger** — never UPDATE credits, only INSERT transactions.

```sql
-- PLANS (seeded, never user-created)
plans: id, name, slug, price_aud_cents, credits_per_month, stripe_price_id, audience_type, is_active

-- USERS (extends auth.users)
profiles: id (FK auth.users), full_name, email, avatar_url, traveller_type, push_token, location_lat, location_lng, created_at

-- SUBSCRIPTIONS
subscriptions: id, user_id (FK profiles), plan_id (FK plans), stripe_subscription_id, stripe_customer_id, status, current_period_start, current_period_end, cancel_at_period_end, created_at

-- CREDIT LEDGER (immutable — append only)
credit_transactions: id, user_id, subscription_id, type (credit|debit|topup|refund), amount, balance_after, description, redemption_id, created_at

-- PARTNERS
partners: id, name, slug, description, category, address, city, state, lat, lng, phone, email, website, google_rating, stripe_connect_account_id, is_active, is_verified, created_at

-- PARTNER SERVICES (what a partner offers)
partner_services: id, partner_id, service_type, name, credit_cost, aud_payout_to_partner, max_daily_redemptions, is_active

-- REDEMPTIONS
redemptions: id, user_id, partner_id, service_id, credits_used, aud_paid_to_partner, scanned_by_partner_user_id, qr_token_used, status (pending|confirmed|refunded), created_at

-- PARTNER USERS (staff who can scan)
partner_users: id, user_id (FK auth.users), partner_id, role (owner|staff), created_at

-- FLASH DEALS (Phase 3)
flash_deals: id, partner_id, title, description, original_price_aud_cents, subscriber_price_aud_cents, commission_rate, total_seats, seats_remaining, available_from, expires_at, is_active

-- FLASH BOOKINGS (Phase 3)
flash_bookings: id, user_id, flash_deal_id, stripe_payment_intent_id, status, booked_at

-- EVENTS (Phase 2)
events: id, partner_id, title, description, starts_at, ends_at, is_free, credit_cost, max_attendees, created_at

-- NOTIFICATIONS LOG
notification_logs: id, user_id, title, body, data, sent_at, opened_at

-- CREDIT TOPUPS
credit_topups: id, user_id, credits_purchased, aud_charged_cents, stripe_payment_intent_id, created_at
```

---

## API Endpoints

| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | `/api/stripe/webhook` | Stripe sig | Handle all Stripe events |
| POST | `/api/stripe/portal` | User | Create Stripe customer portal session |
| POST | `/api/subscriptions` | User | Create subscription checkout session |
| DELETE | `/api/subscriptions` | User | Cancel subscription |
| POST | `/api/redemptions` | Partner | Log QR scan + deduct credits |
| GET | `/api/partners` | Public | List partners (with geo filter) |
| GET | `/api/partners/[id]` | Public | Get partner detail |
| POST | `/api/partners` | Admin | Create partner |
| PATCH | `/api/partners/[id]` | Admin/Partner | Update partner |
| POST | `/api/credits/topup` | User | Buy extra credits |
| GET | `/api/flash` | User | List active flash deals |
| POST | `/api/flash` | Admin | Create flash deal |
| POST | `/api/flash/[id]/book` | User | Book flash deal |
| POST | `/api/notifications` | Admin | Send push notification |

---

## Build Layers (paste into VSCode in this order)

```
LAYER 1 — Foundation
  package.json, next.config.ts, tsconfig.json, tailwind.config.ts,
  .env.example, src/types/index.ts, src/constants/plans.ts, src/constants/services.ts,
  src/lib/utils/cn.ts, src/lib/utils/format.ts

LAYER 2 — Database
  supabase/migrations/001_initial_schema.sql
  supabase/migrations/002_rls_policies.sql
  supabase/migrations/003_functions.sql
  supabase/migrations/004_seed_data.sql
  src/types/database.types.ts
  src/lib/supabase/client.ts
  src/lib/supabase/server.ts
  src/lib/supabase/admin.ts

LAYER 3 — Payments + Credits
  src/lib/stripe/config.ts
  src/lib/stripe/webhooks.ts
  src/lib/credits/engine.ts
  src/lib/qr/generator.ts
  src/lib/email/resend.ts
  src/lib/notifications/push.ts

LAYER 4 — API Routes
  src/app/api/stripe/webhook/route.ts
  src/app/api/stripe/portal/route.ts
  src/app/api/subscriptions/route.ts
  src/app/api/redemptions/route.ts
  src/app/api/partners/route.ts
  src/app/api/partners/[id]/route.ts
  src/app/api/credits/topup/route.ts
  src/app/api/flash/route.ts
  src/app/api/notifications/route.ts

LAYER 5 — UI + Pages
  src/middleware.ts
  src/app/layout.tsx
  src/app/globals.css
  src/app/page.tsx (marketing landing)
  src/app/(auth)/login/page.tsx
  src/app/(auth)/signup/page.tsx
  src/app/(auth)/callback/route.ts
  src/app/(dashboard)/layout.tsx
  src/app/(dashboard)/dashboard/page.tsx
  src/app/(dashboard)/pass/page.tsx
  src/app/(dashboard)/account/page.tsx
  src/app/(partner)/scan/page.tsx
  src/components/ui/Button.tsx + Card.tsx + Badge.tsx + Input.tsx
  src/components/marketing/Hero.tsx + PlanCards.tsx
  src/components/dashboard/CreditBalance.tsx
  src/components/pass/QRPass.tsx
  src/components/partner/QRScanner.tsx

LAYER 6 — Ops
  src/app/(admin)/admin/page.tsx
  vercel.json
  supabase/config.toml
```

---

## Scaling Design Decisions

**Credit system is an immutable ledger.** Never UPDATE a balance field — always INSERT a `credit_transaction` and read balance via a view. This gives you an audit trail, is race-condition-safe with DB transactions, and lets you replay history.

**RLS on every table.** Users can only read their own data. Partners can only read their own redemptions. No data leakage possible even if API code has bugs.

**Webhook-first billing.** All subscription state comes from Stripe webhooks, never from client-side redirects. The webhook handler is the single source of truth.

**API routes are thin controllers.** Business logic lives in `/lib`. Routes validate input, call lib functions, return responses. Easy to test, easy to swap (e.g., move to a separate API service later).

**Feature flags via plan + phase.** Flash, map, social features check `NEXT_PUBLIC_PHASE` env var + user plan. Unused routes return 404. No dead code reaching users.

**Geolocation is nullable everywhere.** The system works without it. When added, it enhances (nearby partners, location notifications) but isn't a dependency.

**Multi-currency ready.** All monetary amounts stored as integer cents. Currency code stored alongside. Stripe multi-currency via `currency` field on Payment Intents. AUD default, THB/IDR/VND ready for Phase 6.

---

## Environment Variables

```
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# Stripe
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
STRIPE_WANDERER_PRICE_ID=
STRIPE_EXPLORER_PRICE_ID=
STRIPE_NOMAD_PRICE_ID=
STRIPE_VAN_LIFER_PRICE_ID=

# Resend
RESEND_API_KEY=
RESEND_FROM_EMAIL=hello@driftpass.com.au

# OneSignal (Phase 3)
ONESIGNAL_APP_ID=
ONESIGNAL_REST_API_KEY=

# Mapbox (Phase 4)
NEXT_PUBLIC_MAPBOX_TOKEN=

# App
NEXT_PUBLIC_APP_URL=https://driftpass.com.au
NEXT_PUBLIC_PHASE=2
ADMIN_SECRET=
```
