-- Provider bookings history, 12 Nov: the provider dashboard's "Everything" and "Last 3 months" need more than the
-- last 90 days. Returns two years back (and everything ahead). Same function, same columns (with services).
-- Runs after 20261213000000_provider_team.sql.
create or replace function public.provider_bookings(provider uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
begin
  if not public.is_provider_member(provider) then raise exception 'You don''t manage this listing' using errcode = '42501'; end if;
  return coalesce((select jsonb_agg(x order by x.day, x.slot) from (
    select b.id, b.service, b.services, b.day, b.slot, b.place, b.note, b.dog_name, b.share_record and b.owned_dog_id is not null as can_add_record,
      b.status, b.provider_note, b.buyer_name, case when b.status in ('requested', 'confirmed') then b.buyer_phone end as buyer_phone,
      b.created_at, b.updated_at, (select count(*) from public.owned_dog_records r where r.care_booking_id = b.id) as records_added
    from public.care_bookings b where b.provider_id = provider and b.day >= current_date - 730
  ) x), '[]'::jsonb);
end;
$$;
