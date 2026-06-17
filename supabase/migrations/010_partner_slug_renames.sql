-- DriftPass Migration 010 — Canonical partner slugs and names
--
-- airlie-beach-fit  (was ailey-beach-fit typo slug)
-- frequent-seas     (was frequencies)
--
-- Run in Supabase SQL editor on production.

-- 1. Remove duplicate Airlie Beach Fit row if the typo slug is the real one
delete from public.partners
where slug = 'airlie-beach-fit'
  and exists (select 1 from public.partners where slug = 'ailey-beach-fit');

-- 2. Rename typo slug → canonical
update public.partners
set slug = 'airlie-beach-fit',
    name = 'Airlie Beach Fit'
where slug = 'ailey-beach-fit';

-- 3. Ensure name on any row already using canonical slug
update public.partners
set name = 'Airlie Beach Fit'
where slug = 'airlie-beach-fit';

-- 4. Rename Frequencies → Frequent-Seas
update public.partners
set slug = 'frequent-seas',
    name = 'Frequent-Seas'
where slug = 'frequencies';

-- 5. Re-apply opening hours on canonical slugs (safe if already set)
update public.partners set
  timezone = 'Australia/Brisbane',
  opening_hours = '{
    "rows": [
      { "label": "Mon – Fri", "hours": "5:00 am – 9:00 pm", "open": "05:00", "close": "21:00", "days": [1,2,3,4,5] },
      { "label": "Sat – Sun", "hours": "6:00 am – 7:00 pm", "open": "06:00", "close": "19:00", "days": [0,6] }
    ]
  }'::jsonb
where slug = 'airlie-beach-fit';

update public.partners set
  timezone = 'Australia/Brisbane',
  opening_hours = '{
    "rows": [
      { "label": "Mon – Sun", "hours": "7:00 am – 5:00 pm", "open": "07:00", "close": "17:00", "days": [0,1,2,3,4,5,6] }
    ]
  }'::jsonb
where slug = 'frequent-seas';
