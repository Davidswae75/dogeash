-- Invitation emails: the site's server sends a link when someone is invited to a store's team or to manage
-- a care listing. It needs to know whether the email already has an account (the link goes to sign-in)
-- or not (the link goes to sign-up, with the email filled in). Server only. Plain ASCII.

create function public.account_exists(check_email text)
returns boolean language sql stable security definer set search_path = ''
as $$ select exists (select 1 from auth.users where lower(email) = lower(trim(check_email))) $$;

revoke execute on function public.account_exists(text) from public, anon, authenticated;
grant execute on function public.account_exists(text) to service_role;
