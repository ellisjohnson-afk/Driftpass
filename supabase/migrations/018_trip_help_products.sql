-- ============================================================
-- Trip Help products — admin-managed pricing & listings
-- ============================================================

create table if not exists public.trip_help_products (
  id uuid primary key default uuid_generate_v4(),
  product_type text not null check (product_type in ('trip_help', 'marketplace')),
  section text not null check (section in ('utilities', 'marketplace')) default 'utilities',
  slug text not null unique,
  name text not null,
  short_label text,
  tagline text,
  description text not null default '',
  features text[] not null default '{}',
  partner_id uuid references public.partners(id) on delete set null,
  service_type text,
  price_aud_cents integer check (price_aud_cents is null or price_aud_cents > 0),
  expiry_hours integer not null default 24 check (expiry_hours >= 0),
  price_label text not null default '',
  price_subtext text,
  hours_label text,
  meeting_note text,
  emoji text,
  hub_slug text,
  sort_order integer not null default 0 check (sort_order >= 0),
  is_active boolean not null default true,
  is_purchasable boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists trip_help_products_section_idx
  on public.trip_help_products (section, is_active, sort_order);

create index if not exists trip_help_products_partner_idx
  on public.trip_help_products (partner_id)
  where partner_id is not null;

create index if not exists trip_help_products_hub_idx
  on public.trip_help_products (hub_slug)
  where hub_slug is not null;

alter table public.trip_help_products enable row level security;

create policy "Authenticated users can view active trip help products"
  on public.trip_help_products for select
  using (auth.uid() is not null and is_active = true);

create policy "Admins can manage trip help products"
  on public.trip_help_products for all
  using (public.is_admin())
  with check (public.is_admin());

create trigger trip_help_products_updated_at
  before update on public.trip_help_products
  for each row execute function public.set_updated_at();

-- Seed from current Trip Help catalog (idempotent on slug)
insert into public.trip_help_products (
  product_type, section, slug, name, short_label, tagline, description, features,
  partner_id, service_type, price_aud_cents, expiry_hours, price_label, price_subtext,
  hours_label, meeting_note, emoji, hub_slug, sort_order, is_active, is_purchasable
)
select
  v.product_type,
  v.section,
  v.slug,
  v.name,
  v.short_label,
  v.tagline,
  v.description,
  v.features,
  p.id,
  v.service_type,
  v.price_aud_cents,
  v.expiry_hours,
  v.price_label,
  v.price_subtext,
  v.hours_label,
  v.meeting_note,
  v.emoji,
  v.hub_slug,
  v.sort_order,
  true,
  v.is_purchasable
from (
  values
    ('trip_help', 'utilities', 'luggage-storage', 'Luggage Storage', 'Luggage', 'Ditch your bags, explore the lagoon',
     'Lockers on Shute Harbour Rd so you can swim, sail, or wander the esplanade bag-free. CCTV monitored, all sizes welcome — pay in Trip Help and collect with your PIN.',
     array['24/7 CCTV monitoring', 'All bag sizes accepted', 'Insurance included', 'Easy PIN pickup'],
     'le-shack', 'luggage_storage', 400, 24, '$4', 'per bag, per day', 'Daily 8:00 am – 6:00 pm', null::text, null::text, null::text, 1, true),
    ('trip_help', 'utilities', 'showers', 'Showers', 'Showers', 'Refresh between adventures',
     'Hot showers when you need them — between hostel check-out, a bus connection, or a day on the water. Towels available at Le Shack.',
     array['Hot water', 'Private cubicles', 'Towels available', 'Member PIN access'],
     'le-shack', 'shower', 500, 12, '$5', 'per shower', 'Daily 8:00 am – 6:00 pm', null::text, null::text, null::text, 2, true),
    ('trip_help', 'utilities', 'laundry', 'Laundry', 'Laundry', 'Wash, dry, and keep moving',
     'Drop a load at Le Shack and explore while it dries. Same-day turnaround — handy for backpackers and van lifers passing through.',
     array['Wash & dry', 'Same-day turnaround', 'Eco detergent', 'Member PIN access'],
     'le-shack', 'laundry', 800, 24, '$8', 'per load', 'Daily 8:00 am – 6:00 pm', null::text, null::text, null::text, 3, true),
    ('trip_help', 'utilities', 'coworking', 'Coworking', 'Coworking', 'WiFi, coffee & a quiet desk',
     'Half-day desk access at Frequent-Seas on The Esplanade — fast WiFi, power, and coffee included. Built for nomads between island trips.',
     array['Fast WiFi', 'Power at every seat', 'Coffee included', 'Quiet work zone'],
     'frequent-seas', 'coworking', 1200, 8, '$12', 'half day', 'Daily 7:00 am – 5:00 pm', null::text, null::text, null::text, 4, true),
    ('trip_help', 'utilities', 'water-refill', 'Water Refill', 'Water', 'Top up your van tank',
     'Drinking water for bottles and van tanks at Frequent-Seas. Skip the petrol-station hunt — buy a refill pass and collect on the spot.',
     array['Drinking water', 'Van tank friendly', 'Quick fill', 'Member PIN access'],
     'frequent-seas', 'water_fill', 400, 24, '$4', 'per refill', 'Daily 7:00 am – 5:00 pm', null::text, null::text, null::text, 5, true),
    ('trip_help', 'utilities', 'transfers', 'Transfers', 'Transfers', 'Scooters, bikes, and local rides',
     'Scooters and bikes from Le Shack — the easy way to reach the marina, lagoon, or your accommodation without a taxi.',
     array['Scooter hire', 'Bike hire', 'Helmets included', 'Town-wide coverage'],
     'le-shack', 'scooter_hire', null::integer, 0, 'Member rate', 'from Le Shack', 'Daily 8:00 am – 6:00 pm', null::text, null::text, null::text, 6, false),
    ('marketplace', 'marketplace', 'gym-day-pass', 'Gym Day Pass', 'Gym', 'Single visit at Airlie Beach Fit',
     'Single visit at Airlie Beach Fit',
     array['Full gym access', 'Member checkout price', 'Collect with PIN'],
     'airlie-beach-fit', 'gym_day_pass', 599, 24, '$5.99', 'per visit', null::text, null::text, '🏋️', null::text, 1, true),
    ('marketplace', 'marketplace', 'tours-experiences', 'Tours & Experiences', 'Tours', 'Reef days, sails & island trips',
     'Browse reef days, sails, and island trips with local operators.',
     array[]::text[], null::text, null::text, null::integer, 0, 'From $65', null::text, null::text, null::text, '🚢', null::text, 2, false),
    ('marketplace', 'marketplace', 'reef-snorkel-day', 'Reef Snorkel Day', 'Reef', 'Full-day Outer Reef trip with snorkelling',
     'Join Whitsunday Reef Adventures at Port of Airlie marina for a full-day trip to the Outer Great Barrier Reef. Includes snorkelling gear, reef briefing, lunch, and return transfers from the marina.',
     array['Outer Reef snorkelling', 'Gear & wetsuit included', 'Lunch on board', 'Marina check-in 7:30 am'],
     'whitsunday-reef-adventures', 'tour_reef_day', 8900, 72, '$89', 'per person', 'Trips depart daily · 7:30 am check-in', 'Check in at the operator desk before departure.', '🐠', 'tours-experiences', 1, true),
    ('marketplace', 'marketplace', 'island-day-sail', 'Island Day Sail', 'Sail', 'Whitehaven Beach & Hill Inlet day sail',
     'Sail with Coral Sea Sailing from Coral Sea Marina through the Whitsundays to Whitehaven Beach and Hill Inlet lookout. A full day on the water with snorkel stops and a beach picnic.',
     array['Whitehaven Beach stop', 'Hill Inlet lookout walk', 'Snorkel gear included', 'Lunch & refreshments'],
     'coral-sea-sailing', 'tour_island_sail', 12000, 72, '$120', 'per person', 'Trips depart daily · 8:00 am', 'Meet at the Coral Sea Sailing office on the marina.', '⛵', 'tours-experiences', 2, true),
    ('marketplace', 'marketplace', 'sunset-sail', 'Sunset Sail', 'Sunset', 'Golden-hour cruise through the islands',
     'An evening sail with Coral Sea Sailing — golden light, island views, and a relaxed drink on deck. Perfect after a day in town or before dinner on the esplanade.',
     array['2.5 hour sunset cruise', 'Complimentary drink', 'Small group vessel', 'Departs Coral Sea Marina'],
     'coral-sea-sailing', 'tour_sunset_sail', 6500, 48, '$65', 'per person', 'Daily departure · 4:30 pm', 'Arrive 15 minutes before departure for boarding.', '🌅', 'tours-experiences', 3, true)
) as v(
  product_type, section, slug, name, short_label, tagline, description, features,
  partner_slug, service_type, price_aud_cents, expiry_hours, price_label, price_subtext,
  hours_label, meeting_note, emoji, hub_slug, sort_order, is_purchasable
)
left join public.partners p on p.slug = v.partner_slug and p.deleted_at is null
on conflict (slug) do update set
  product_type = excluded.product_type,
  section = excluded.section,
  name = excluded.name,
  short_label = excluded.short_label,
  tagline = excluded.tagline,
  description = excluded.description,
  features = excluded.features,
  partner_id = excluded.partner_id,
  service_type = excluded.service_type,
  price_aud_cents = excluded.price_aud_cents,
  expiry_hours = excluded.expiry_hours,
  price_label = excluded.price_label,
  price_subtext = excluded.price_subtext,
  hours_label = excluded.hours_label,
  meeting_note = excluded.meeting_note,
  emoji = excluded.emoji,
  hub_slug = excluded.hub_slug,
  sort_order = excluded.sort_order,
  is_purchasable = excluded.is_purchasable,
  updated_at = now();
