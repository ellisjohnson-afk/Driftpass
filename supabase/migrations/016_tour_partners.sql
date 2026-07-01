-- ============================================================
-- Tour operators — Trip Help experiences with partner payouts
-- ============================================================

insert into public.partners (
  name,
  slug,
  description,
  category,
  address,
  city,
  state,
  lat,
  lng,
  google_rating,
  is_active,
  is_verified,
  is_featured
)
values
  (
    'Whitsunday Reef Adventures',
    'whitsunday-reef-adventures',
    'Full-day reef snorkel and dive trips from Airlie Beach marina to the Outer Great Barrier Reef.',
    'tours',
    'Port of Airlie Marina, Shute Harbour Rd',
    'Airlie Beach',
    'QLD',
    -20.2648,
    148.7145,
    4.9,
    true,
    true,
    true
  ),
  (
    'Coral Sea Sailing',
    'coral-sea-sailing',
    'Day sails and sunset cruises through the Whitsunday Islands — Whitehaven, Hill Inlet, and more.',
    'tours',
    'Coral Sea Marina, 1 Shute Harbour Rd',
    'Airlie Beach',
    'QLD',
    -20.2635,
    148.7158,
    4.8,
    true,
    true,
    true
  )
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  category = excluded.category,
  address = excluded.address,
  lat = excluded.lat,
  lng = excluded.lng,
  is_active = true,
  updated_at = now();

with partner as (select id from public.partners where slug = 'whitsunday-reef-adventures')
insert into public.partner_services (partner_id, service_type, name, credit_cost, aud_payout_cents, max_daily_redemptions)
select partner.id, s.service_type, s.name, s.credit_cost, s.aud_payout_cents, s.max_daily
from partner, (values
  ('tour_reef_day', 'Reef Snorkel Day Trip', 0, 7500, 40)
) as s(service_type, name, credit_cost, aud_payout_cents, max_daily)
on conflict (partner_id, service_type) do update set
  name = excluded.name,
  aud_payout_cents = excluded.aud_payout_cents,
  is_active = true;

with partner as (select id from public.partners where slug = 'coral-sea-sailing')
insert into public.partner_services (partner_id, service_type, name, credit_cost, aud_payout_cents, max_daily_redemptions)
select partner.id, s.service_type, s.name, s.credit_cost, s.aud_payout_cents, s.max_daily
from partner, (values
  ('tour_island_sail', 'Island Day Sail', 0, 10000, 25),
  ('tour_sunset_sail', 'Sunset Sail', 0, 5500, 30)
) as s(service_type, name, credit_cost, aud_payout_cents, max_daily)
on conflict (partner_id, service_type) do update set
  name = excluded.name,
  aud_payout_cents = excluded.aud_payout_cents,
  is_active = true;
