-- Grants for order_vouchers (required for API + service role inserts)

grant select on public.order_vouchers to authenticated;
grant all on public.order_vouchers to service_role;
