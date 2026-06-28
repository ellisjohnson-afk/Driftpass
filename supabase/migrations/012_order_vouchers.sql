-- ============================================================
-- DriftPass — paid order vouchers (Trip Help / marketplace)
-- Collection PIN for partner pickup (Phase 2)
-- ============================================================

create table if not exists public.order_vouchers (
  id                    uuid primary key default gen_random_uuid(),
  user_id               uuid not null references public.profiles(id) on delete cascade,
  partner_id            uuid references public.partners(id),
  partner_service_id    uuid references public.partner_services(id),
  product_type          text not null check (product_type in ('trip_help', 'marketplace')),
  product_slug          text not null,
  product_name          text not null,
  amount_aud_cents      integer not null check (amount_aud_cents > 0),
  collection_pin        varchar(6) not null,
  status                text not null default 'pending'
    check (status in ('pending', 'paid', 'collected', 'expired', 'refunded', 'canceled')),
  stripe_checkout_session_id text unique,
  stripe_payment_intent_id   text,
  expires_at            timestamptz not null,
  collected_at          timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  constraint order_vouchers_collection_pin_unique unique (collection_pin)
);

create index if not exists order_vouchers_user_id_idx
  on public.order_vouchers (user_id, created_at desc);

create index if not exists order_vouchers_collection_pin_idx
  on public.order_vouchers (collection_pin);

create index if not exists order_vouchers_status_idx
  on public.order_vouchers (status);

create trigger order_vouchers_updated_at
  before update on public.order_vouchers
  for each row execute function public.handle_updated_at();

alter table public.order_vouchers enable row level security;

create policy "Users can view own order vouchers"
  on public.order_vouchers for select
  using (auth.uid() = user_id);
