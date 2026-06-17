-- ============================================================
-- DriftPass Migration 005 — Align plans, partners, and service costs with spec
-- Fortnightly billing: Wanderer A$20/25cr, Explorer A$35/42cr, Nomad A$59/70cr, Van Lifer A$22/25cr
-- ============================================================

-- Ensure pin_shard column exists (idempotent — may already exist from add_pin_shard.sql)
ALTER TABLE public.subscriptions ADD COLUMN IF NOT EXISTS pin_shard VARCHAR(2);

CREATE INDEX IF NOT EXISTS subscriptions_pin_shard_status_idx
  ON public.subscriptions (pin_shard, status)
  WHERE status = 'active';

-- Align plan pricing and credit allowances
UPDATE public.plans SET price_aud_cents = 2000, credits_per_month = 25 WHERE slug = 'wanderer';
UPDATE public.plans SET price_aud_cents = 3500, credits_per_month = 42 WHERE slug = 'explorer';
UPDATE public.plans SET price_aud_cents = 5900, credits_per_month = 70 WHERE slug = 'nomad';
UPDATE public.plans SET price_aud_cents = 2200, credits_per_month = 25 WHERE slug = 'van_lifer';

-- Fix founding partner name typo
UPDATE public.partners SET name = 'Airlie Beach Fit' WHERE slug = 'airlie-beach-fit';

-- Align existing service credit costs to spec
UPDATE public.partner_services SET credit_cost = 4
WHERE partner_id = (SELECT id FROM public.partners WHERE slug = 'le-shack')
  AND service_type = 'luggage_storage';

UPDATE public.partner_services SET credit_cost = 6
WHERE partner_id = (SELECT id FROM public.partners WHERE slug = 'le-shack')
  AND service_type = 'cafe_session';

UPDATE public.partner_services SET credit_cost = 6
WHERE partner_id = (SELECT id FROM public.partners WHERE slug = 'frequent-seas')
  AND service_type = 'cafe_session';

-- Add spec sample services (shower 5, laundry 8, co-working 12)
INSERT INTO public.partner_services (partner_id, service_type, name, credit_cost, aud_payout_cents, max_daily_redemptions)
SELECT p.id, s.service_type, s.name, s.credit_cost, s.aud_payout_cents, s.max_daily
FROM public.partners p,
(VALUES
  ('le-shack',       'shower',        'Shower Access',           5,  400, 40),
  ('le-shack',       'laundry',       'Laundry Load',            8,  600, 20),
  ('frequent-seas',  'coworking',     'Co-working Half Day',    12,  900, 15)
) AS s(partner_slug, service_type, name, credit_cost, aud_payout_cents, max_daily)
WHERE p.slug = s.partner_slug
ON CONFLICT (partner_id, service_type) DO UPDATE SET
  name = EXCLUDED.name,
  credit_cost = EXCLUDED.credit_cost,
  aud_payout_cents = EXCLUDED.aud_payout_cents,
  max_daily_redemptions = EXCLUDED.max_daily_redemptions;
