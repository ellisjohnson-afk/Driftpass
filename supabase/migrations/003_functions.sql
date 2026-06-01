-- ============================================================
-- DriftPass DB Functions + Triggers — Migration 003
-- ============================================================

-- ============================================================
-- Auto-create profile on new user sign-up
-- ============================================================
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name, avatar_url)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.raw_user_meta_data->>'avatar_url'
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- Get current credit balance for a user
-- Returns the balance_after of the most recent transaction
-- Falls back to plan credits if no transactions yet
-- ============================================================
create or replace function public.get_credit_balance(p_user_id uuid)
returns integer language sql security definer stable as $$
  select coalesce(
    (
      select balance_after
      from public.credit_transactions
      where user_id = p_user_id
      order by created_at desc
      limit 1
    ),
    -- If no transactions, check if they have an active sub and return plan credits
    (
      select p.credits_per_month
      from public.subscriptions s
      join public.plans p on p.id = s.plan_id
      where s.user_id = p_user_id
        and s.status = 'active'
      limit 1
    ),
    0
  )
$$;

-- ============================================================
-- Safely deduct credits (called from API via service role)
-- Returns the new balance or raises exception if insufficient
-- This runs in a transaction — atomic with redemption insert
-- ============================================================
create or replace function public.deduct_credits(
  p_user_id       uuid,
  p_subscription_id uuid,
  p_amount        integer,
  p_description   text,
  p_redemption_id uuid default null
)
returns integer language plpgsql security definer as $$
declare
  v_current_balance integer;
  v_new_balance     integer;
begin
  -- Lock the user's latest transaction row to prevent race conditions
  select balance_after into v_current_balance
  from public.credit_transactions
  where user_id = p_user_id
  order by created_at desc
  limit 1
  for update skip locked;

  -- If no transactions yet, get balance from plan
  if v_current_balance is null then
    select p.credits_per_month into v_current_balance
    from public.subscriptions s
    join public.plans p on p.id = s.plan_id
    where s.id = p_subscription_id
      and s.status = 'active';
  end if;

  if v_current_balance is null then
    raise exception 'No active subscription found' using errcode = 'P0001';
  end if;

  if v_current_balance < p_amount then
    raise exception 'Insufficient credits: have %, need %', v_current_balance, p_amount
      using errcode = 'P0002';
  end if;

  v_new_balance := v_current_balance - p_amount;

  insert into public.credit_transactions (
    user_id, subscription_id, type, amount, balance_after, description, redemption_id
  ) values (
    p_user_id, p_subscription_id, 'debit', -p_amount, v_new_balance, p_description, p_redemption_id
  );

  return v_new_balance;
end;
$$;

-- ============================================================
-- Credit monthly allowance (called from Stripe webhook on renewal)
-- ============================================================
create or replace function public.credit_monthly_allowance(
  p_user_id         uuid,
  p_subscription_id uuid,
  p_plan_id         uuid
)
returns integer language plpgsql security definer as $$
declare
  v_credits integer;
  v_new_balance integer;
  v_current_balance integer;
begin
  select credits_per_month into v_credits
  from public.plans where id = p_plan_id;

  -- Get current balance (may carry over 0 from last period after billing resets)
  select coalesce(
    (select balance_after from public.credit_transactions
     where user_id = p_user_id order by created_at desc limit 1),
    0
  ) into v_current_balance;

  -- Reset to plan credits (do not carry over unused credits)
  v_new_balance := v_credits;

  insert into public.credit_transactions (
    user_id, subscription_id, type, amount, balance_after, description
  ) values (
    p_user_id, p_subscription_id, 'credit', v_credits,
    v_new_balance,
    'Monthly credit allowance — ' || to_char(now(), 'Mon YYYY')
  );

  return v_new_balance;
end;
$$;

-- ============================================================
-- Add topup credits
-- ============================================================
create or replace function public.add_topup_credits(
  p_user_id       uuid,
  p_subscription_id uuid,
  p_amount        integer,
  p_topup_id      uuid
)
returns integer language plpgsql security definer as $$
declare
  v_current_balance integer;
  v_new_balance     integer;
begin
  select coalesce(
    (select balance_after from public.credit_transactions
     where user_id = p_user_id order by created_at desc limit 1),
    0
  ) into v_current_balance;

  v_new_balance := v_current_balance + p_amount;

  insert into public.credit_transactions (
    user_id, subscription_id, type, amount, balance_after, description
  ) values (
    p_user_id, p_subscription_id, 'topup', p_amount, v_new_balance,
    'Credit top-up — ' || p_amount || ' credits'
  );

  return v_new_balance;
end;
$$;

-- ============================================================
-- Get nearby partners (geo search)
-- Returns partners within radius_km, ordered by distance
-- ============================================================
create or replace function public.nearby_partners(
  lat float8,
  lng float8,
  radius_km float8 default 10.0,
  p_category text default null
)
returns table(
  id uuid, name text, slug text, category text, city text,
  address text, lat float8, lng float8, google_rating float4,
  logo_url text, is_featured boolean, distance_km float8
)
language sql security definer stable as $$
  select
    p.id, p.name, p.slug, p.category, p.city,
    p.address, p.lat, p.lng, p.google_rating,
    p.logo_url, p.is_featured,
    round((earth_distance(
      ll_to_earth(p.lat, p.lng),
      ll_to_earth(nearby_partners.lat, nearby_partners.lng)
    ) / 1000)::numeric, 2)::float8 as distance_km
  from public.partners p
  where
    p.is_active = true
    and p.deleted_at is null
    and p.lat is not null
    and p.lng is not null
    and earth_distance(
      ll_to_earth(p.lat, p.lng),
      ll_to_earth(nearby_partners.lat, nearby_partners.lng)
    ) <= (radius_km * 1000)
    and (p_category is null or p.category = p_category)
  order by distance_km asc
$$;

-- ============================================================
-- Decrement flash deal seats (atomic, prevents overselling)
-- ============================================================
create or replace function public.claim_flash_seat(p_deal_id uuid)
returns boolean language plpgsql security definer as $$
declare
  v_seats integer;
begin
  update public.flash_deals
  set seats_remaining = seats_remaining - 1
  where id = p_deal_id
    and seats_remaining > 0
    and is_active = true
    and expires_at > now()
  returning seats_remaining into v_seats;

  if v_seats is null then
    return false;   -- no seats or deal expired
  end if;
  return true;
end;
$$;
