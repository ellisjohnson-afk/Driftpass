-- Migration 010: partner slug renames (airlie-beach-fit, frequent-seas)

delete from public.partners
where slug = 'airlie-beach-fit'
  and exists (select 1 from public.partners where slug = 'ailey-beach-fit');

update public.partners
set slug = 'airlie-beach-fit',
    name = 'Airlie Beach Fit'
where slug = 'ailey-beach-fit';

update public.partners
set name = 'Airlie Beach Fit'
where slug = 'airlie-beach-fit';

update public.partners
set slug = 'frequent-seas',
    name = 'Frequent-Seas'
where slug = 'frequencies';

update public.partners set
  timezone = 'Australia/Brisbane',
  opening_hours = '{"rows":[{"label":"Mon - Fri","hours":"5:00 am - 9:00 pm","open":"05:00","close":"21:00","days":[1,2,3,4,5]},{"label":"Sat - Sun","hours":"6:00 am - 7:00 pm","open":"06:00","close":"19:00","days":[0,6]}]}'::jsonb
where slug = 'airlie-beach-fit';

update public.partners set
  timezone = 'Australia/Brisbane',
  opening_hours = '{"rows":[{"label":"Mon - Sun","hours":"7:00 am - 5:00 pm","open":"07:00","close":"17:00","days":[0,1,2,3,4,5,6]}]}'::jsonb
where slug = 'frequent-seas';
