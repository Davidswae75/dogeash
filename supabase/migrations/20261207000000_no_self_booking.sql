  -- Care bookings: the people who manage a listing can't book it (they answer its bookings), and a listing
  -- that isn't listed yet can't be booked. Everything else about a booking is as before. Plain ASCII.

  create or replace function public.prepare_care_booking()
  returns trigger language plpgsql security definer set search_path = ''
  as $$
  declare
    pr record;
  begin
    new.buyer_id := auth.uid();
    new.status := 'requested';
    new.provider_note := '';
    if new.buyer_id is null then raise exception 'Sign in first'; end if;
    if public.is_blocked() then raise exception 'Your account can''t make bookings right now'; end if;
    select * into pr from public.care_providers where id = new.provider_id;
    -- The people who run a listing can't book it: they answer bookings, they don't make them
    if public.is_provider_member(new.provider_id) then raise exception 'You manage this listing, so you can''t book it'; end if;
    -- A listing Dogeash hasn't listed yet can't be booked either
    if not pr.listed then raise exception 'This provider isn''t taking bookings right now'; end if;
    if not pr.taking_bookings then raise exception 'This provider isn''t taking bookings right now'; end if;
    if new.day <= current_date then raise exception 'Choose a day from tomorrow on'; end if;
    if new.day > current_date + 60 then raise exception 'Choose a day in the next two months'; end if;
    if not (extract(dow from new.day)::smallint = any (pr.weekdays)) then raise exception 'The provider doesn''t work on that day'; end if;
    if not (new.slot = any (pr.slots)) then raise exception 'Choose one of the provider''s times'; end if;
    if new.place = 'home' and not pr.home_visits then raise exception 'This provider doesn''t visit homes'; end if;
    if new.owned_dog_id is not null then
      select name into new.dog_name from public.owned_dogs where id = new.owned_dog_id and owner_id = new.buyer_id;
      if new.dog_name is null then raise exception 'Not your dog'; end if;
    else
      -- A dog not in My dogs: just its name, and nothing to add a record to
      new.dog_name := left(trim(coalesce(new.dog_name, '')), 40);
      new.share_record := false;
    end if;
    if (select count(*) from public.care_bookings where buyer_id = new.buyer_id and status = 'requested') >= 10 then
      raise exception 'You have 10 bookings waiting for an answer. Wait for some replies first';
    end if;
    select coalesce(nullif(full_name, ''), 'A buyer'), nullif(phone, '') into new.buyer_name, new.buyer_phone from public.profiles where id = new.buyer_id;
    return new;
  end;
  $$;
