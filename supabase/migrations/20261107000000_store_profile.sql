-- Store profile editing. A store's owners and managers write the about text, owner profile, history,
-- services, hours and delivery areas (all in `details`). The inspection record, reviews and figures kept
-- in `details` are Dogeash's: a store can't add or change them, and editing the profile keeps them.

create function public.protect_store_details()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  owned text[] := array['inspection', 'reviewSamples', 'dogsPlaced', 'replies'];
  k text;
begin
  if auth.uid() is null then return new; end if;  -- the seed, or Dogeash staff in the SQL editor
  new.details := coalesce(new.details, '{}'::jsonb) - owned;
  if tg_op = 'UPDATE' then
    foreach k in array owned loop
      if old.details ? k then new.details := jsonb_set(new.details, array[k], old.details -> k); end if;
    end loop;
  end if;
  return new;
end;
$$;
create trigger stores_protect_details before insert or update on public.stores
  for each row execute function public.protect_store_details();
revoke execute on function public.protect_store_details() from public, anon, authenticated;

-- Limits that match the profile form
alter table public.stores
  add constraint stores_name_length check (length(name) <= 80),
  add constraint stores_tagline_length check (length(tagline) <= 140),
  add constraint stores_place_length check (length(city) <= 60 and length(area) <= 60 and length(state) <= 60),
  add constraint stores_founded_range check (founded is null or founded between 1900 and 2100),
  add constraint stores_details_size check (octet_length(details::text) <= 20000);
