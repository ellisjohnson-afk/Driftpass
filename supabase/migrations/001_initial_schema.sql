-- ============================================================
-- DriftPass Database Schema — Migration 001
-- Run via: supabase db push
-- ============================================================

-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "pg_trgm";    -- fuzzy text search for partners
create extension if not exists "cube";
create extension if not exists "earthdistance"; -- geo distance calculations

-- ============================================================
-- PLANS
-- Seeded once, never user-created. See migration 004.
-- ============================================================
create table public.plans (
  id                  uuid primary key default uuid_generate_v4(),
  name                text not null,
  slug                text not null unique,
  price_aud_cents     integer not null check (price_aud_cents > 0),
  credits_per_month   integer not null check (credits_per_month > 0),
  stripe_price_id     text not null unique,
  audience_type       text not null check (audience_type in ('backpacker', 'digital_nomad', 'van_lifer')),
  is_active           boolean not null default true,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- PROFILES (extends auth.users)
-- One row per user. Created on first sign-in via trigger.
-- ============================================================
create table public.profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  full_name           text,
  email               text not null,
  avatar_url          text,
  traveller_type      text check (traveller_type in ('backpacker', 'digital_nomad', 'van_lifer')),
  push_token          text,       -- OneSignal player ID (Phase 3)
  location_lat        float8,
  location_lng        float8,
  is_partner_user     boolean not null default false,
  is_admin            boolean not null default false,
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);

-- ============================================================
-- SUBSCRIPTIONS
-- Stripe is source of truth. Webhook handler keeps this in sync.
-- ============================================================
create table public.subscriptions (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id) on delete cascade,
  plan_id                 uuid not null references public.plans(id),
  stripe_subscription_id  text not null unique,
  stripe_customer_id      text not null,
  status                  text not null check (status in (
    'active', 'trialing', 'past_due', 'canceled', 'unpaid', 'incomplete', 'incomplete_expired'
  )),
  current_period_start    timestamptz not null,
  current_period_end      timestamptz not null,
  cancel_at_period_end    boolean not null default false,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

create index subscriptions_user_id_idx on public.subscriptions(user_id);
create index subscriptions_stripe_id_idx on public.subscriptions(stripe_subscription_id);
create index subscriptions_customer_id_idx on public.subscriptions(stripe_customer_id);

-- ============================================================
-- CREDIT LEDGER (immutable — append only, NEVER update)
-- Balance = sum of all transactions for user in current period.
-- Using a view for balance makes it race-condition safe.
-- ============================================================
create table public.credit_transactions (
  id                uuid primary key default uuid_generate_v4(),
  user_id           uuid not null references public.profiles(id) on delete cascade,
  subscription_id   uuid references public.subscriptions(id),
  type              text not null check (type in ('credit', 'debit', 'topup', 'refund')),
  amount            integer not null,   -- positive = adding credits, negative = removing
  balance_after     integer not null,   -- snapshot for fast lookups
  description       text not null,
  redemption_id     uuid,               -- set when type = debit (FK added after redemptions table)
  created_at        timestamptz not null default now()
);

create index credit_transactions_user_id_idx on public.credit_transactions(user_id);
create index credit_transactions_created_at_idx on public.credit_transactions(created_at desc);

-- ============================================================
-- PARTNERS
-- ============================================================
create table public.partners (
  id                          uuid primary key default uuid_generate_v4(),
  name                        text not null,
  slug                        text not null unique,
  description                 text,
  category                    text not null check (category in (
    'gym_fitness', 'cafe_cowork', 'laundry', 'luggage_storage', 'shower',
    'scooter_hire', 'water_fill', 'accommodation', 'restaurant', 'mechanic',
    'kitchen', 'ev_charging', 'events', 'tours', 'other'
  )),
  address                     text not null,
  city                        text not null,
  state                       text not null default 'QLD',
  country                     text not null default 'AU',
  lat                         float8,
  lng                         float8,
  phone                       text,
  email                       text,
  website                     text,
  google_rating               float4 check (google_rating >= 0 and google_rating <= 5),
  google_place_id             text,
  stripe_connect_account_id   text,       -- Stripe Connect (Phase 4)
  logo_url                    text,
  is_active                   boolean not null default true,
  is_verified                 boolean not null default false,
  is_featured                 boolean not null default false,
  deleted_at                  timestamptz,
  created_at                  timestamptz not null default now(),
  updated_at                  timestamptz not null default now()
);

create index partners_city_idx on public.partners(city) where deleted_at is null;
create index partners_category_idx on public.partners(category) where deleted_at is null;
create index partners_active_idx on public.partners(is_active) where deleted_at is null;
-- Geo index — used for "nearby partners" queries
create index partners_geo_idx on public.partners using gist (ll_to_earth(lat, lng))
  where lat is not null and lng is not null;

-- ============================================================
-- PARTNER SERVICES
-- What a specific partner offers, with their credit cost.
-- ============================================================
create table public.partner_services (
  id                      uuid primary key default uuid_generate_v4(),
  partner_id              uuid not null references public.partners(id) on delete cascade,
  service_type            text not null,   -- matches SERVICE_BY_TYPE key
  name                    text not null,
  credit_cost             integer not null check (credit_cost > 0),
  aud_payout_cents        integer not null check (aud_payout_cents >= 0),
  max_daily_redemptions   integer,         -- null = unlimited
  is_active               boolean not null default true,
  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now(),
  unique (partner_id, service_type)
);

create index partner_services_partner_id_idx on public.partner_services(partner_id);

-- ============================================================
-- PARTNER USERS (staff who can scan QR codes)
-- ============================================================
create table public.partner_users (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid not null references public.profiles(id) on delete cascade,
  partner_id  uuid not null references public.partners(id) on delete cascade,
  role        text not null default 'staff' check (role in ('owner', 'staff')),
  created_at  timestamptz not null default now(),
  unique (user_id, partner_id)
);

-- ============================================================
-- REDEMPTIONS
-- Created when a partner scans a subscriber's QR code.
-- ============================================================
create table public.redemptions (
  id                        uuid primary key default uuid_generate_v4(),
  user_id                   uuid not null references public.profiles(id),
  partner_id                uuid not null references public.partners(id),
  service_id                uuid not null references public.partner_services(id),
  subscription_id           uuid not null references public.subscriptions(id),
  credits_used              integer not null check (credits_used > 0),
  aud_paid_to_partner       integer not null,  -- in cents
  scanned_by_partner_user_id uuid references public.partner_users(id),
  qr_token_used             text not null,
  status                    text not null default 'confirmed' check (status in ('pending', 'confirmed', 'refunded')),
  created_at                timestamptz not null default now()
);

create index redemptions_user_id_idx on public.redemptions(user_id);
create index redemptions_partner_id_idx on public.redemptions(partner_id);
create index redemptions_created_at_idx on public.redemptions(created_at desc);

-- Add FK from credit_transactions to redemptions (circular dependency workaround)
alter table public.credit_transactions
  add constraint credit_transactions_redemption_id_fkey
  foreign key (redemption_id) references public.redemptions(id);

-- ============================================================
-- FLASH DEALS (Phase 3)
-- ============================================================
create table public.flash_deals (
  id                          uuid primary key default uuid_generate_v4(),
  partner_id                  uuid not null references public.partners(id),
  title                       text not null,
  description                 text not null,
  original_price_aud_cents    integer not null,
  subscriber_price_aud_cents  integer not null,
  commission_rate             float4 not null default 0.20,
  total_seats                 integer not null,
  seats_remaining             integer not null,
  available_from              timestamptz not null,
  expires_at                  timestamptz not null,
  is_active                   boolean not null default true,
  created_at                  timestamptz not null default now(),
  constraint flash_deals_seats_check check (seats_remaining >= 0 and seats_remaining <= total_seats),
  constraint flash_deals_price_check check (subscriber_price_aud_cents < original_price_aud_cents)
);

create index flash_deals_active_idx on public.flash_deals(is_active, expires_at);

-- ============================================================
-- FLASH BOOKINGS (Phase 3)
-- ============================================================
create table public.flash_bookings (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id),
  flash_deal_id           uuid not null references public.flash_deals(id),
  stripe_payment_intent_id text,
  status                  text not null default 'pending' check (status in ('pending', 'confirmed', 'canceled', 'refunded')),
  booked_at               timestamptz not null default now(),
  unique (user_id, flash_deal_id)  -- one booking per deal per user
);

-- ============================================================
-- EVENTS (Phase 2)
-- ============================================================
create table public.events (
  id              uuid primary key default uuid_generate_v4(),
  partner_id      uuid not null references public.partners(id),
  title           text not null,
  description     text,
  starts_at       timestamptz not null,
  ends_at         timestamptz not null,
  is_free         boolean not null default true,
  credit_cost     integer not null default 0,
  max_attendees   integer,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create index events_starts_at_idx on public.events(starts_at);

-- ============================================================
-- CREDIT TOPUPS (Phase 2)
-- Extra credits purchased mid-month
-- ============================================================
create table public.credit_topups (
  id                      uuid primary key default uuid_generate_v4(),
  user_id                 uuid not null references public.profiles(id),
  credits_purchased       integer not null check (credits_purchased > 0),
  aud_charged_cents       integer not null check (aud_charged_cents > 0),
  stripe_payment_intent_id text,
  created_at              timestamptz not null default now()
);

-- ============================================================
-- NOTIFICATION LOGS
-- ============================================================
create table public.notification_logs (
  id          uuid primary key default uuid_generate_v4(),
  user_id     uuid references public.profiles(id),    -- null = broadcast
  title       text not null,
  body        text not null,
  data        jsonb,
  sent_at     timestamptz not null default now(),
  opened_at   timestamptz
);

-- ============================================================
-- UPDATED_AT triggers
-- ============================================================
create or replace function public.handle_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger plans_updated_at before update on public.plans
  for each row execute function public.handle_updated_at();
create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.handle_updated_at();
create trigger subscriptions_updated_at before update on public.subscriptions
  for each row execute function public.handle_updated_at();
create trigger partners_updated_at before update on public.partners
  for each row execute function public.handle_updated_at();
create trigger partner_services_updated_at before update on public.partner_services
  for each row execute function public.handle_updated_at();
create trigger events_updated_at before update on public.events
  for each row execute function public.handle_updated_at();


-- ============================================================
-- GRANTS — service_role needs explicit access for admin client
-- ============================================================
grant all on all tables in schema public to service_role;
grant all on all sequences in schema public to service_role;
grant all on all routines in schema public to service_role;
