-- Store settings for kennel visits: the days and times a store takes visits, whether it also visits buyers
-- at home, and pausing visit requests (with a note buyers see). Owners and managers change them, like the
-- rest of the store. New visit requests must fit: the database refuses other days, times or places.
-- Existing stores keep what the site offered before: Monday to Saturday, five times, at the kennel only.

-- Times like 9:00 or 14:30, 1 to 12 of them
create function public.valid_visit_slots(slots text[])
returns boolean language sql immutable set search_path = ''
as $$ select cardinality(slots) between 1 and 12 and not exists (select 1 from unnest(slots) s where s !~ '^([01]?[0-9]|2[0-3]):[0-5][0-9]$') $$;

alter table public.stores
  add column visit_days smallint[] not null default '{1,2,3,4,5,6}',
  add column visit_slots text[] not null default '{9:00,10:30,12:00,14:00,15:30}',
  add column home_visits boolean not null default false,
  add column visits_paused boolean not null default false,
  add column pause_note text not null default '',
  add constraint stores_visit_days_valid check (cardinality(visit_days) between 1 and 7 and visit_days <@ '{0,1,2,3,4,5,6}'),
  add constraint stores_visit_slots_valid check (public.valid_visit_slots(visit_slots)),
  add constraint stores_pause_note_length check (length(pause_note) <= 200);

grant update (visit_days, visit_slots, home_visits, visits_paused, pause_note) on public.stores to authenticated;

-- A new visit request has to fit the store's settings
create function public.check_visit_time()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  st record;
begin
  select visit_days, visit_slots, home_visits, visits_paused into st from public.stores where id = new.store_id;
  if st is null then return new; end if;
  if st.visits_paused then raise exception 'This store isn''t taking visits right now'; end if;
  if not (extract(dow from new.day)::smallint = any (st.visit_days)) then raise exception 'The store doesn''t take visits on that day'; end if;
  if not (new.slot = any (st.visit_slots)) then raise exception 'Choose one of the store''s visit times'; end if;
  if new.place = 'home' and not st.home_visits then raise exception 'This store only takes visits at the kennel'; end if;
  return new;
end;
$$;
create trigger visits_check_time before insert on public.visits for each row execute function public.check_visit_time();

revoke execute on function public.check_visit_time() from public, anon, authenticated;
