-- ============================================================
-- DriftPass Seed Data — Migration 004
-- Plans and founding partners. Run after schema.
-- NOTE: Update stripe_price_id values after creating products in Stripe.
-- ============================================================

-- Plans
insert into public.plans (name, slug, price_aud_cents, credits_per_month, stripe_price_id, audience_type)
values
  ('Wanderer',  'wanderer',  2000, 25,  'price_placeholder_wanderer',  'backpacker'),
  ('Explorer',  'explorer',  3500, 42,  'price_placeholder_explorer',  'backpacker'),
  ('Nomad',     'nomad',     5900, 70,  'price_placeholder_nomad',     'digital_nomad'),
  ('Van Lifer', 'van_lifer', 2200, 25,  'price_placeholder_van_lifer', 'van_lifer')
on conflict (slug) do nothing;

-- Founding Partners — Airlie Beach (home town)
insert into public.partners (name, slug, description, category, address, city, state, lat, lng, google_rating, is_active, is_verified, is_featured)
values
  (
    'Airlie Beach Fit',
    'ailey-beach-fit',
    'Premium gym and fitness classes on the Airlie Beach strip. Yoga, HIIT, and strength training.',
    'gym_fitness',
    '263 Shute Harbour Rd',
    'Airlie Beach',
    'QLD',
    -20.2682,
    148.7180,
    4.8,
    true, true, true
  ),
  (
    'Le Shack',
    'le-shack',
    'Scooter and bike hire, café, and secure luggage storage in the heart of Airlie Beach.',
    'scooter_hire',
    '345 Shute Harbour Rd',
    'Airlie Beach',
    'QLD',
    -20.2695,
    148.7165,
    4.6,
    true, true, true
  ),
  (
    'Frequencies',
    'frequencies',
    'Digital nomad café, community events, and van lifer services. Best WiFi in town.',
    'cafe_cowork',
    '12 The Esplanade',
    'Airlie Beach',
    'QLD',
    -20.2701,
    148.7171,
    4.7,
    true, true, true
  ),
  (
    'Frozen Yogurt Place',
    'frozen-yogurt-place',
    'Fresh frozen yogurt and smoothies. DriftPass members get exclusive deals.',
    'restaurant',
    '5 Main St',
    'Airlie Beach',
    'QLD',
    -20.2688,
    148.7175,
    4.4,
    true, true, false
  )
on conflict (slug) do nothing;

-- Services for founding partners
-- Airlie Beach Fit
with partner as (select id from public.partners where slug = 'ailey-beach-fit')
insert into public.partner_services (partner_id, service_type, name, credit_cost, aud_payout_cents, max_daily_redemptions)
select
  partner.id,
  s.service_type,
  s.name,
  s.credit_cost,
  s.aud_payout_cents,
  s.max_daily
from partner, (values
  ('gym_session',  'Gym Day Pass',    10, 750,  50),
  ('fitness_class','Fitness Class',   12, 900,  20)
) as s(service_type, name, credit_cost, aud_payout_cents, max_daily)
on conflict (partner_id, service_type) do nothing;

-- Le Shack
with partner as (select id from public.partners where slug = 'le-shack')
insert into public.partner_services (partner_id, service_type, name, credit_cost, aud_payout_cents, max_daily_redemptions)
select
  partner.id,
  s.service_type,
  s.name,
  s.credit_cost,
  s.aud_payout_cents,
  s.max_daily
from partner, (values
  ('luggage_storage', 'Luggage Storage (per day)', 4, 350, 30),
  ('cafe_session',    'Café Work Session',         6, 600, 20),
  ('shower',          'Shower Access',               5, 400, 40),
  ('laundry',         'Laundry Load',                8, 600, 20)
) as s(service_type, name, credit_cost, aud_payout_cents, max_daily)
on conflict (partner_id, service_type) do nothing;

-- Frequencies
with partner as (select id from public.partners where slug = 'frequencies')
insert into public.partner_services (partner_id, service_type, name, credit_cost, aud_payout_cents, max_daily_redemptions)
select
  partner.id,
  s.service_type,
  s.name,
  s.credit_cost,
  s.aud_payout_cents,
  s.max_daily
from partner, (values
  ('cafe_session', 'Nomad Work Session (WiFi + coffee)', 6, 600, 40),
  ('water_fill',   'Van Water Tank Refill',              4, 350, 10),
  ('coworking',    'Co-working Half Day',               12, 900, 15)
) as s(service_type, name, credit_cost, aud_payout_cents, max_daily)
on conflict (partner_id, service_type) do nothing;

-- Frozen Yogurt Place
with partner as (select id from public.partners where slug = 'frozen-yogurt-place')
insert into public.partner_services (partner_id, service_type, name, credit_cost, aud_payout_cents, max_daily_redemptions)
select
  partner.id,
  s.service_type,
  s.name,
  s.credit_cost,
  s.aud_payout_cents,
  s.max_daily
from partner, (values
  ('restaurant_discount', '20% Off — Quiet Hours', 4, 0, 50)
) as s(service_type, name, credit_cost, aud_payout_cents, max_daily)
on conflict (partner_id, service_type) do nothing;
