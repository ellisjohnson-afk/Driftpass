-- DriftPass Migration 009 — Duplicate Airlie Beach Fit partner cleanup
--
-- Production has both slug 'ailey-beach-fit' (canonical in app code) and
-- 'airlie-beach-fit' (duplicate). The app only links to ailey-beach-fit.
-- Deactivate the duplicate so perks does not show the gym twice.

update public.partners set
  is_active = false,
  deleted_at = coalesce(deleted_at, now())
where slug = 'airlie-beach-fit'
  and exists (select 1 from public.partners where slug = 'ailey-beach-fit');
