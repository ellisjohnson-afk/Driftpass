-- ============================================================
-- Free membership — no Stripe subscription required for V2 plan
-- ============================================================

alter table public.subscriptions
  alter column stripe_subscription_id drop not null,
  alter column stripe_customer_id drop not null;

drop index if exists subscriptions_stripe_id_idx;
create unique index subscriptions_stripe_id_idx
  on public.subscriptions (stripe_subscription_id)
  where stripe_subscription_id is not null;

-- Allow free membership plan (was price_aud_cents > 0 only)
alter table public.plans drop constraint if exists plans_price_aud_cents_check;
alter table public.plans add constraint plans_price_aud_cents_check
  check (price_aud_cents >= 0);

update public.plans
set
  price_aud_cents = 0,
  updated_at = now()
where slug = 'membership';

-- Coffee is not a free member perk — monetise via Trip Help upsells instead
update public.partner_services
set
  is_active = false,
  updated_at = now()
where service_type in ('cafe_session', 'coffee');
