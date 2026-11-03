-- The buyer's home profile (what dogs are matched against) and how they'd like to hear from us.
-- Each person changes only their own row: the existing profile policies already ensure that.
create type public.handler_experience as enum ('first-time', 'some', 'experienced', 'professional');

alter table public.profiles
  add column property public.property_type,
  add column has_children boolean,
  add column has_other_pets boolean,
  add column experience public.handler_experience,
  add column notify_email boolean not null default true,
  add column notify_sms boolean not null default false,
  add column notify_whatsapp boolean not null default false;

-- Names and phone numbers stay sensible however they're sent
alter table public.profiles
  add constraint profiles_full_name_length check (length(full_name) <= 120),
  add constraint profiles_phone_format check (phone is null or phone ~ '^\+?[0-9 ]{7,20}$'),
  add constraint profiles_city_length check (city is null or length(city) <= 80);

grant update (property, has_children, has_other_pets, experience, notify_email, notify_sms, notify_whatsapp) on public.profiles to authenticated;
