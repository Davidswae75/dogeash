-- Store reviews. A buyer can review a store once one of their kennel visits there is marked done
-- (until purchases and handovers exist): one review per buyer per store, which they can edit or delete.
-- The store's owners and managers can reply once, and edit the reply. The store's rating and review count
-- are worked out from these reviews whenever one changes (sample stores keep their sample figures until
-- their first real review). Owners and managers hear about new reviews; buyers hear about replies.

alter type public.notification_kind add value if not exists 'review';

create table public.store_reviews (
  id uuid primary key default gen_random_uuid(),
  store_id uuid not null references public.stores (id) on delete cascade,
  author_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  author_name text not null default '',
  author_city text not null default '',
  visit_id uuid references public.visits (id) on delete set null,
  rating smallint not null check (rating between 1 and 5),
  body text not null check (length(trim(body)) between 20 and 1000),
  store_reply text check (store_reply is null or length(trim(store_reply)) between 1 and 1000),
  replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (store_id, author_id)
);
create index store_reviews_store_idx on public.store_reviews (store_id, created_at desc);
create trigger store_reviews_updated_at before update on public.store_reviews for each row execute function public.set_updated_at();

-- ── Rules the database enforces ─────────────────────────────────────────────
-- A new review: always the signed-in buyer, only after a done visit with this store, with their name
-- and city copied in (stores never read buyer profiles), and no reply yet
create function public.prepare_review()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  profile record;
begin
  new.author_id := auth.uid();
  if new.author_id is null then raise exception 'Sign in first'; end if;
  select v.id into new.visit_id from public.visits v
  where v.store_id = new.store_id and v.buyer_id = new.author_id and v.status = 'done'
  order by v.day desc limit 1;
  if new.visit_id is null then raise exception 'You can review a store after a visit there'; end if;
  select full_name, city into profile from public.profiles where id = new.author_id;
  new.author_name := coalesce(profile.full_name, '');
  new.author_city := coalesce(profile.city, '');
  new.store_reply := null;
  new.replied_at := null;
  return new;
end;
$$;
create trigger store_reviews_prepare before insert on public.store_reviews for each row execute function public.prepare_review();

-- Changes: the author edits the rating and text; the store's owners and managers write the reply
create function public.check_review_change()
returns trigger language plpgsql security definer set search_path = ''
as $$
begin
  if old.author_id = auth.uid() then
    if new.store_reply is distinct from old.store_reply then raise exception 'Only the store can reply'; end if;
  elsif public.has_store_role(old.store_id, '{owner,manager}') then
    if new.rating <> old.rating or new.body <> old.body then raise exception 'A store can''t change a buyer''s review'; end if;
    if new.store_reply is distinct from old.store_reply then new.replied_at := case when new.store_reply is null then null else now() end; end if;
  else
    raise exception 'Not your review';
  end if;
  return new;
end;
$$;
create trigger store_reviews_check_change before update on public.store_reviews for each row execute function public.check_review_change();

-- The store's rating and count follow its reviews
create function public.refresh_store_rating()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  target uuid := coalesce(new.store_id, old.store_id);
begin
  update public.stores s set
    rating = coalesce((select round(avg(r.rating), 1) from public.store_reviews r where r.store_id = target), 0),
    reviews_count = (select count(*) from public.store_reviews r where r.store_id = target)
  where s.id = target;
  return null;
end;
$$;
create trigger store_reviews_rating after insert or delete or update of rating on public.store_reviews
  for each row execute function public.refresh_store_rating();

-- A new review → the store's owners and managers; a reply → the buyer
create function public.notify_review()
returns trigger language plpgsql security definer set search_path = ''
as $$
declare
  store record;
begin
  select name, slug into store from public.stores where id = new.store_id;
  if tg_op = 'INSERT' then
    perform public.notify(m.user_id, 'review',
      'New review: ' || new.rating || ' out of 5 from ' || coalesce(nullif(new.author_name, ''), 'a buyer'),
      new.body, '/dashboard/reviews', 'review:' || new.id)
    from public.store_members m where m.store_id = new.store_id and m.role in ('owner', 'manager');
  elsif new.store_reply is not null and new.store_reply is distinct from old.store_reply then
    perform public.notify(new.author_id, 'review', store.name || ' replied to your review', new.store_reply,
      '/stores/' || store.slug || '#reviews', 'review-reply:' || new.id);
  end if;
  return new;
end;
$$;
create trigger store_reviews_notify after insert or update of store_reply on public.store_reviews
  for each row execute function public.notify_review();

-- ── Access ──────────────────────────────────────────────────────────────────
alter table public.store_reviews enable row level security;
create policy "Anyone reads reviews of verified stores" on public.store_reviews for select to anon, authenticated
  using (exists (select 1 from public.stores s where s.id = store_id and s.status = 'verified'));
create policy "Authors and the store's people read its reviews" on public.store_reviews for select to authenticated
  using (author_id = (select auth.uid()) or public.has_store_role(store_id, '{owner,manager,handler}'));
create policy "Buyers write reviews" on public.store_reviews for insert to authenticated with check (true);
create policy "Authors edit, owners and managers reply" on public.store_reviews for update to authenticated
  using (author_id = (select auth.uid()) or public.has_store_role(store_id, '{owner,manager}'))
  with check (author_id = (select auth.uid()) or public.has_store_role(store_id, '{owner,manager}'));
create policy "Authors delete their review" on public.store_reviews for delete to authenticated
  using (author_id = (select auth.uid()));

-- Visitors don't get the author's account id; signed-in people need it to find their own review
revoke all on public.store_reviews from anon, authenticated;
grant select (id, store_id, author_name, author_city, rating, body, store_reply, replied_at, created_at, updated_at) on public.store_reviews to anon;
grant select on public.store_reviews to authenticated;
grant insert (store_id, rating, body) on public.store_reviews to authenticated;
grant update (rating, body, store_reply) on public.store_reviews to authenticated;
grant delete on public.store_reviews to authenticated;

revoke execute on function public.prepare_review() from public, anon, authenticated;
revoke execute on function public.check_review_change() from public, anon, authenticated;
revoke execute on function public.refresh_store_rating() from public, anon, authenticated;
revoke execute on function public.notify_review() from public, anon, authenticated;
