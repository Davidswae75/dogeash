-- DEVELOPMENT ONLY. Removes everything the core marketplace migration creates, including all
-- stores, dogs, profiles and shortlists, so the migration can be run again from scratch.
-- Safe on a half-finished setup: everything is "if exists". Never run this on a live project.
drop trigger if exists on_auth_user_created on auth.users;
drop table if exists public.shortlist_items, public.dogs, public.store_members, public.stores, public.profiles cascade;
drop function if exists public.has_store_role(uuid, public.store_role[]) cascade;
drop function if exists public.handle_new_user() cascade;
drop function if exists public.handle_new_store() cascade;
drop function if exists public.keep_one_owner() cascade;
drop function if exists public.set_updated_at() cascade;
drop type if exists public.store_status, public.store_role, public.dog_status, public.dog_sex, public.property_type cascade;
