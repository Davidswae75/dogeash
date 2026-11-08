-- Invitation links: the email's link carries the invitation's id, so sign-up and sign-in can say what the
-- person is accepting ("manage Kuje Veterinary Clinic", "join K9 Guardian Kennels as manager") and fill in
-- their email. Anyone holding the link can read this much: the id is random and was only sent to that email.
-- Accepting still needs the signed-in account's email to match (accept_provider_invite, accept_store_invite).
-- Plain ASCII.

create function public.invite_preview(kind text, invite uuid)
returns jsonb language plpgsql stable security definer set search_path = ''
as $$
declare
  out_row jsonb;
begin
  if kind = 'provider' then
    select jsonb_build_object('kind', 'provider', 'email', i.email, 'name', p.name, 'type', p.type, 'city', p.city)
    into out_row
    from public.care_provider_invites i join public.care_providers p on p.id = i.provider_id where i.id = invite;
  elsif kind = 'store' then
    select jsonb_build_object('kind', 'store', 'email', i.email, 'name', s.name, 'city', s.city, 'role', i.role,
      'invitedBy', coalesce(nullif(pr.full_name, ''), 'The owner'))
    into out_row
    from public.store_invites i join public.stores s on s.id = i.store_id left join public.profiles pr on pr.id = i.invited_by
    where i.id = invite;
  end if;
  return out_row;
end;
$$;

revoke execute on function public.invite_preview(text, uuid) from public;
grant execute on function public.invite_preview(text, uuid) to anon, authenticated;
