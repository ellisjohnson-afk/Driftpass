-- DriftPass Migration 008 — Partner opening hours in database

alter table public.partners
  add column if not exists timezone text not null default 'Australia/Brisbane',
  add column if not exists opening_hours jsonb;

comment on column public.partners.opening_hours is
  'JSON: { "rows": [{ "label", "hours", "open", "close", "days" }] } — days 0=Sun..6=Sat';

update public.partners set
  timezone = 'Australia/Brisbane',
  opening_hours = '{
    "rows": [
      { "label": "Mon – Fri", "hours": "5:00 am – 9:00 pm", "open": "05:00", "close": "21:00", "days": [1,2,3,4,5] },
      { "label": "Sat – Sun", "hours": "6:00 am – 7:00 pm", "open": "06:00", "close": "19:00", "days": [0,6] }
    ]
  }'::jsonb
where slug = 'ailey-beach-fit';

update public.partners set
  timezone = 'Australia/Brisbane',
  opening_hours = '{
    "rows": [
      { "label": "Mon – Sun", "hours": "7:00 am – 5:00 pm", "open": "07:00", "close": "17:00", "days": [0,1,2,3,4,5,6] }
    ]
  }'::jsonb
where slug = 'frequencies';

update public.partners set
  timezone = 'Australia/Brisbane',
  opening_hours = '{
    "rows": [
      { "label": "Mon – Sun", "hours": "8:00 am – 6:00 pm", "open": "08:00", "close": "18:00", "days": [0,1,2,3,4,5,6] }
    ]
  }'::jsonb
where slug = 'le-shack';

update public.partners set
  timezone = 'Australia/Brisbane',
  opening_hours = '{
    "rows": [
      { "label": "Mon – Sun", "hours": "10:00 am – 8:00 pm", "open": "10:00", "close": "20:00", "days": [0,1,2,3,4,5,6] }
    ]
  }'::jsonb
where slug = 'frozen-yogurt-place';
