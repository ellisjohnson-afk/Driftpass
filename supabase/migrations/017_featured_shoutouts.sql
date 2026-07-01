-- ============================================================
-- Featured shoutouts — paid local business placements
-- ============================================================

create table if not exists public.featured_shoutouts (
  id uuid primary key default uuid_generate_v4(),
  partner_id uuid references public.partners(id) on delete set null,
  business_name text not null,
  headline text not null,
  body text,
  cta_label text not null default 'Learn more',
  cta_href text not null,
  image_url text,
  placement text not null
    check (placement in ('home', 'trip_help', 'explore', 'town')),
  town_slug text not null default 'airlie-beach',
  sort_order integer not null default 0 check (sort_order >= 0),
  starts_at timestamptz,
  ends_at timestamptz,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists featured_shoutouts_placement_idx
  on public.featured_shoutouts (placement, town_slug, is_active, sort_order);

alter table public.featured_shoutouts enable row level security;

create policy "Authenticated users can view active shoutouts"
  on public.featured_shoutouts for select
  using (
    auth.uid() is not null
    and is_active = true
    and (starts_at is null or starts_at <= now())
    and (ends_at is null or ends_at > now())
  );

create policy "Admins can manage shoutouts"
  on public.featured_shoutouts for all
  using (public.is_admin());

grant select on public.featured_shoutouts to authenticated;
grant all on public.featured_shoutouts to service_role;

create trigger featured_shoutouts_updated_at
  before update on public.featured_shoutouts
  for each row execute function public.handle_updated_at();
