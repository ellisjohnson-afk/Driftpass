-- ============================================================
-- DriftPass Row Level Security Policies — Migration 002
-- CRITICAL: Enable RLS on every table. Default deny.
-- ============================================================

-- Enable RLS
alter table public.plans enable row level security;
alter table public.profiles enable row level security;
alter table public.subscriptions enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.partners enable row level security;
alter table public.partner_services enable row level security;
alter table public.partner_users enable row level security;
alter table public.redemptions enable row level security;
alter table public.flash_deals enable row level security;
alter table public.flash_bookings enable row level security;
alter table public.events enable row level security;
alter table public.credit_topups enable row level security;
alter table public.notification_logs enable row level security;

-- ============================================================
-- HELPER FUNCTIONS
-- ============================================================

-- Is the current user an admin?
create or replace function public.is_admin()
returns boolean language sql security definer stable as $$
  select coalesce(
    (select is_admin from public.profiles where id = auth.uid()),
    false
  )
$$;

-- Is the current user a partner user for a given partner?
create or replace function public.is_partner_for(p_partner_id uuid)
returns boolean language sql security definer stable as $$
  select exists(
    select 1 from public.partner_users
    where user_id = auth.uid() and partner_id = p_partner_id
  )
$$;

-- Get the active subscription ID for current user
create or replace function public.active_subscription_id()
returns uuid language sql security definer stable as $$
  select id from public.subscriptions
  where user_id = auth.uid() and status = 'active'
  order by created_at desc limit 1
$$;

-- ============================================================
-- PLANS — public read, admin write
-- ============================================================
create policy "Anyone can view active plans"
  on public.plans for select
  using (is_active = true);

create policy "Admins can manage plans"
  on public.plans for all
  using (public.is_admin());

-- ============================================================
-- PROFILES — own row only, admin all
-- ============================================================
create policy "Users can view own profile"
  on public.profiles for select
  using (id = auth.uid());

create policy "Users can update own profile"
  on public.profiles for update
  using (id = auth.uid());

create policy "Admins can view all profiles"
  on public.profiles for select
  using (public.is_admin());

-- ============================================================
-- SUBSCRIPTIONS — own row only, admin all
-- ============================================================
create policy "Users can view own subscriptions"
  on public.subscriptions for select
  using (user_id = auth.uid());

create policy "Service role can manage subscriptions"
  on public.subscriptions for all
  using (auth.role() = 'service_role');

create policy "Admins can view all subscriptions"
  on public.subscriptions for select
  using (public.is_admin());

-- ============================================================
-- CREDIT TRANSACTIONS — own only, service role write
-- ============================================================
create policy "Users can view own credit transactions"
  on public.credit_transactions for select
  using (user_id = auth.uid());

create policy "Service role can insert credit transactions"
  on public.credit_transactions for insert
  with check (auth.role() = 'service_role');

create policy "Admins can view all credit transactions"
  on public.credit_transactions for select
  using (public.is_admin());

-- ============================================================
-- PARTNERS — public read (active only), admin write
-- ============================================================
create policy "Anyone can view active partners"
  on public.partners for select
  using (is_active = true and deleted_at is null);

create policy "Admins can manage all partners"
  on public.partners for all
  using (public.is_admin());

-- ============================================================
-- PARTNER SERVICES — public read (active), admin write
-- ============================================================
create policy "Anyone can view active partner services"
  on public.partner_services for select
  using (is_active = true);

create policy "Admins can manage partner services"
  on public.partner_services for all
  using (public.is_admin());

create policy "Partner owners can manage own services"
  on public.partner_services for all
  using (public.is_partner_for(partner_id));

-- ============================================================
-- PARTNER USERS — own row, partner owner, admin
-- ============================================================
create policy "Partner users can view own partnership"
  on public.partner_users for select
  using (user_id = auth.uid());

create policy "Admins can manage partner users"
  on public.partner_users for all
  using (public.is_admin());

-- ============================================================
-- REDEMPTIONS — own (subscribers), partner's (partners), admin all
-- ============================================================
create policy "Users can view own redemptions"
  on public.redemptions for select
  using (user_id = auth.uid());

create policy "Partner users can view partner redemptions"
  on public.redemptions for select
  using (public.is_partner_for(partner_id));

create policy "Service role can insert redemptions"
  on public.redemptions for insert
  with check (auth.role() = 'service_role');

create policy "Admins can view all redemptions"
  on public.redemptions for select
  using (public.is_admin());

-- ============================================================
-- FLASH DEALS — active visible to authenticated, admin write
-- ============================================================
create policy "Authenticated users can view active flash deals"
  on public.flash_deals for select
  to authenticated
  using (is_active = true and expires_at > now());

create policy "Admins can manage flash deals"
  on public.flash_deals for all
  using (public.is_admin());

-- ============================================================
-- FLASH BOOKINGS — own only
-- ============================================================
create policy "Users can view own flash bookings"
  on public.flash_bookings for select
  using (user_id = auth.uid());

create policy "Service role can manage flash bookings"
  on public.flash_bookings for all
  using (auth.role() = 'service_role');

-- ============================================================
-- EVENTS — public read
-- ============================================================
create policy "Anyone can view events"
  on public.events for select
  using (starts_at > now() - interval '1 day');

create policy "Admins can manage events"
  on public.events for all
  using (public.is_admin());

create policy "Partner users can manage own events"
  on public.events for all
  using (public.is_partner_for(partner_id));

-- ============================================================
-- CREDIT TOPUPS — own only
-- ============================================================
create policy "Users can view own topups"
  on public.credit_topups for select
  using (user_id = auth.uid());

create policy "Service role can insert topups"
  on public.credit_topups for insert
  with check (auth.role() = 'service_role');

-- ============================================================
-- NOTIFICATION LOGS — own or admin
-- ============================================================
create policy "Users can view own notifications"
  on public.notification_logs for select
  using (user_id = auth.uid() or user_id is null);

create policy "Admins can manage notifications"
  on public.notification_logs for all
  using (public.is_admin());
