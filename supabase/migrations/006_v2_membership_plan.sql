-- ============================================================
-- DriftPass V2 — single weekly membership plan
-- A$7.99/week. Legacy fortnightly plans remain for existing subs.
-- Update stripe_price_id after creating price in Stripe dashboard.
-- ============================================================

-- V2 membership has no credit allowance
alter table public.plans drop constraint if exists plans_credits_per_month_check;
alter table public.plans add constraint plans_credits_per_month_check
  check (credits_per_month >= 0);

insert into public.plans (name, slug, price_aud_cents, credits_per_month, stripe_price_id, audience_type, is_active)
values (
  'Drift Pass Membership',
  'membership',
  799,
  0,
  'price_placeholder_membership',
  'backpacker',
  true
)
on conflict (slug) do update set
  name = excluded.name,
  price_aud_cents = excluded.price_aud_cents,
  credits_per_month = excluded.credits_per_month,
  is_active = true,
  updated_at = now();
