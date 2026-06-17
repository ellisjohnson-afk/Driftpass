# DriftPass — Developer Build Guide

> Production-ready MVP. Paste into VSCode. Build in layers.

## Quick start (15 minutes)

```bash
# 1. Install dependencies
npm install

# 2. Copy env file
cp .env.example .env.local
# Fill in NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY,
# SUPABASE_SERVICE_ROLE_KEY, STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET

# 3. Set up Supabase (local or cloud)
npx supabase start                         # local
npx supabase db push                       # runs all migrations
npx supabase db reset                      # fresh start with seed data

# 4. Run dev server
npm run dev
# → http://localhost:3000
```

## Build layers — paste in this exact order

### Layer 1 — Foundation
Files to paste first (no dependencies):
- `package.json`
- `next.config.ts`
- `tsconfig.json`
- `tailwind.config.ts`
- `.env.example` → copy to `.env.local`
- `src/types/index.ts`
- `src/constants/plans.ts`
- `src/constants/services.ts`
- `src/lib/utils/cn.ts`
- `src/lib/utils/format.ts`

### Layer 2 — Database
Run these SQL migrations in Supabase (in order):
1. `supabase/migrations/001_initial_schema.sql`
2. `supabase/migrations/002_rls_policies.sql`
3. `supabase/migrations/003_functions.sql`
4. `supabase/migrations/004_seed_data.sql`

Then add the type files:
- `src/types/database.types.ts`
- `src/lib/supabase/client.ts`
- `src/lib/supabase/server.ts`
- `src/lib/supabase/admin.ts`

### Layer 3 — Payments + Credits
- `src/lib/stripe/config.ts`
- `src/lib/stripe/webhooks.ts`
- `src/lib/credits/engine.ts`
- `src/lib/qr/generator.ts`
- `src/lib/email/resend.ts`
- `src/lib/notifications/push.ts`

### Layer 4 — API Routes
- `src/app/api/stripe/webhook/route.ts`
- `src/app/api/stripe/portal/route.ts`
- `src/app/api/subscriptions/route.ts`
- `src/app/api/redemptions/route.ts`
- `src/app/api/partners/route.ts`
- `src/app/api/partners/[id]/route.ts`
- `src/app/api/credits/topup/route.ts`
- `src/app/api/flash/route.ts`
- `src/app/api/pass/token/route.ts`

### Layer 5 — UI + Pages
- `src/middleware.ts`
- `src/app/layout.tsx`
- `src/app/globals.css`
- `src/app/page.tsx`
- `src/app/(auth)/login/page.tsx`
- `src/app/(auth)/signup/page.tsx`
- `src/app/(auth)/callback/route.ts`
- `src/app/(dashboard)/layout.tsx`
- `src/app/(dashboard)/dashboard/page.tsx`
- `src/app/(dashboard)/pass/page.tsx`
- `src/app/(dashboard)/flash/page.tsx`
- `src/app/(dashboard)/map/page.tsx`
- `src/app/(dashboard)/account/page.tsx`
- `src/app/(partner)/scan/page.tsx`
- `src/app/(admin)/admin/page.tsx`

### Layer 6 — Deployment
- `vercel.json`
- `supabase/config.toml`

## Stripe setup

1. Create a Stripe account at stripe.com
2. Create 4 products (Wanderer, Explorer, Nomad, Van Lifer)
3. Set monthly recurring prices (A$25, A$49, A$89, A$29)
4. Copy price IDs to `.env.local`
5. Add webhook endpoint: `https://yourdomain.com/api/stripe/webhook`
6. Select events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
7. Copy webhook secret to `STRIPE_WEBHOOK_SECRET`

Test with Stripe CLI:
```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

## Supabase setup

1. Create project at supabase.com
2. Copy URL and keys to `.env.local`
3. Run migrations: `supabase db push`
4. Configure auth:
   - Site URL: `https://driftpass.com.au`
   - Redirect URL: `https://driftpass.com.au/callback`
   - Enable email confirmations for production

## Deploy to Vercel

```bash
npx vercel --prod
```

Set all env vars in Vercel dashboard (Settings → Environment Variables).
Vercel region is set to `syd1` (Sydney) in `vercel.json`.

## Phase progression

Change `NEXT_PUBLIC_PHASE` env var to unlock features:

| Phase | Value | Features unlocked |
|-------|-------|-------------------|
| 1 | `1` | Landing page, manual ops stubs |
| 2 | `2` | Full app, QR pass, partner scan |
| 3 | `3` | Flash deals, push notifications |
| 4 | `4` | Route map, partner dashboard |
| 5 | `5` | Community features |
| 6 | `6` | SE Asia, native app ready |

## Making someone an admin

```sql
update public.profiles
set is_admin = true
where email = 'hello@driftpass.com.au';
```

## Making someone a partner user

```sql
insert into public.partner_users (user_id, partner_id, role)
select
  (select id from public.profiles where email = 'partner@example.com'),
  (select id from public.partners where slug = 'airlie-beach-fit'),
  'owner';
```

## Architecture decisions

See `ARCHITECTURE.md` for the full design rationale.

Key things:
- Credit system is an **immutable ledger** — never update balances, only append transactions
- **Stripe webhooks** are the single source of truth for subscription state
- **RLS on every table** — users can only touch their own data even if API has bugs
- **Service-role admin client** only used in webhook handlers + admin routes
- **Phase flags** control feature visibility — no dead code shipped to users
