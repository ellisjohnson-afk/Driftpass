-- ============================================================
-- Trip Help order payouts — track partner share per sale
-- ============================================================

alter table public.order_vouchers
  add column if not exists partner_payout_cents integer not null default 0
    check (partner_payout_cents >= 0),
  add column if not exists platform_fee_cents integer not null default 0
    check (platform_fee_cents >= 0);

create index if not exists order_vouchers_partner_collected_idx
  on public.order_vouchers (partner_id, status, collected_at desc)
  where partner_id is not null;

-- Backfill from partner_services where linked
update public.order_vouchers ov
set
  partner_payout_cents = ps.aud_payout_cents,
  platform_fee_cents = greatest(ov.amount_aud_cents - ps.aud_payout_cents, 0)
from public.partner_services ps
where ov.partner_service_id = ps.id
  and ov.partner_payout_cents = 0;

-- Fallback: 80% partner / 20% platform for legacy rows
update public.order_vouchers
set
  partner_payout_cents = (amount_aud_cents * 80) / 100,
  platform_fee_cents = amount_aud_cents - ((amount_aud_cents * 80) / 100)
where partner_payout_cents = 0
  and amount_aud_cents > 0;

-- Admins can view all orders for payout reporting
create policy "Admins can view all order vouchers"
  on public.order_vouchers for select
  using (public.is_admin());
