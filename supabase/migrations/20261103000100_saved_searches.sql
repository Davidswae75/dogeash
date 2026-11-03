-- Saved searches: a buyer keeps the filters from Find a guard dog and can be told when a new dog matches.
-- Yours only. At most 20 per person, so alerts stay meaningful.
create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null check (length(trim(label)) between 1 and 120),
  filters jsonb not null default '{}',
  alerts boolean not null default true,
  created_at timestamptz not null default now()
);
create index saved_searches_user_idx on public.saved_searches (user_id);

create function public.limit_saved_searches()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if (select count(*) from public.saved_searches where user_id = new.user_id) >= 20 then
    raise exception 'You can keep up to 20 saved searches';
  end if;
  return new;
end;
$$;
create trigger saved_searches_limit before insert on public.saved_searches for each row execute function public.limit_saved_searches();
revoke execute on function public.limit_saved_searches() from public, anon, authenticated;

alter table public.saved_searches enable row level security;
revoke all on public.saved_searches from anon, authenticated;
grant select, delete on public.saved_searches to authenticated;
grant insert (label, filters, alerts) on public.saved_searches to authenticated;
grant update (label, alerts) on public.saved_searches to authenticated;
create policy "Manage own saved searches" on public.saved_searches for all to authenticated
  using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()));
