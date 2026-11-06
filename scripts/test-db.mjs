// Runs the migrations and seed in an in-process Postgres (no Docker or Supabase project needed),
// then acts as each kind of person to prove the access rules hold. Run with `npm run db:test`.
import { readdirSync, readFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { PGlite } from '@electric-sql/pglite'

const root = resolve(import.meta.dirname, '..')
const db = new PGlite()

// The parts of Supabase the migrations rely on
await db.exec(`
  create role anon nologin; create role authenticated nologin; create role service_role nologin bypassrls;
  create schema auth;
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}', created_at timestamptz default now(), last_sign_in_at timestamptz);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create function auth.jwt() returns jsonb language sql stable as $$ select coalesce(nullif(current_setting('test.jwt', true), ''), '{}')::jsonb $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text, owner uuid default auth.uid());
  alter table storage.objects enable row level security;
  create function storage.foldername(name text) returns text[] language sql immutable as $$ select (string_to_array(name, '/'))[1:array_length(string_to_array(name, '/'), 1) - 1] $$;
  grant select, insert, update, delete on storage.objects to authenticated;
  grant usage on schema storage to anon, authenticated;
  grant usage on schema auth, public to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated;
  grant execute on function auth.jwt() to anon, authenticated;
  grant all on all tables in schema auth to service_role;
  alter default privileges in schema public grant all on tables to anon, authenticated, service_role;
  alter default privileges in schema public grant execute on functions to anon, authenticated, service_role;
`)
for (const file of readdirSync(join(root, 'supabase/migrations')).sort()) await db.exec(readFileSync(join(root, 'supabase/migrations', file), 'utf8'))
await db.exec(readFileSync(join(root, 'supabase/seed.sql'), 'utf8'))
await db.exec(`grant all on all tables in schema public to service_role;`)

let failed = 0
const check = (name, ok) => { console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`); if (!ok) failed++ }

// Run SQL as someone. Returns rows, or null if the database refused.
async function as(role, uid, sql) {
  await db.exec(`set test.uid = '${uid ?? ''}'; set role ${role};`)
  try { return (await db.query(sql)).rows }
  catch { return null }
  finally { await db.exec('reset role;') }
}
const emailOf = name => `${name.split(' ')[0].toLowerCase()}@test.ng`
const user = async (name) => (await db.query(`insert into auth.users (email, raw_user_meta_data) values ('${emailOf(name)}', '{"full_name":"${name}"}') returning id`)).rows[0].id
const scalar = async sql => Object.values((await db.query(sql)).rows[0])[0]
const member = (store, uid, role) => db.exec(`insert into public.store_members values ('${store}', '${uid}', '${role}')`)

const buyer = await user('Tunde Ade')
const other = await user('Ngozi Eze')
const owner = await user('Ibrahim Danjuma')
const manager = await user('Adaeze Okafor')
const handler = await user('Musa Bello')
const k9 = await scalar(`select id from public.stores where public_id = 'STR-001'`)
await member(k9, owner, 'owner'); await member(k9, manager, 'manager'); await member(k9, handler, 'handler')
const rambo = await scalar(`select id from public.dogs where file_no = 'KD-2026-003'`)

// Sign-up
check('sign-up creates a profile with the name', await scalar(`select full_name from public.profiles where id = '${buyer}'`) === 'Tunde Ade')

// Home profile and contact preferences
check('you can fill in your home profile', (await as('authenticated', buyer, `update public.profiles set property = 'compound', has_children = true, experience = 'first-time', notify_sms = true where id = '${buyer}' returning property`))?.[0]?.property === 'compound')
await as('authenticated', other, `update public.profiles set property = 'estate' where id = '${buyer}'`)
check('nobody else can change it', await scalar(`select property from public.profiles where id = '${buyer}'`) === 'compound')
check('a phone number must look like one', await as('authenticated', buyer, `update public.profiles set phone = 'call me maybe' where id = '${buyer}'`) === null)

// Saved searches
const saved = await as('authenticated', buyer, `insert into public.saved_searches (label, filters) values ('Level 4 · Abuja', '{"level":"4","city":"Abuja"}') returning id, user_id`)
check('you can save a search, and it\'s yours', saved?.[0]?.user_id === buyer)
check('nobody else sees it', (await as('authenticated', other, 'select * from public.saved_searches')).length === 0)
check('you can turn its alerts off', (await as('authenticated', buyer, `update public.saved_searches set alerts = false where id = '${saved[0].id}' returning alerts`))?.[0]?.alerts === false)
check('you can\'t save a search for someone else', await as('authenticated', other, `insert into public.saved_searches (user_id, label) values ('${buyer}', 'x')`) === null)
await as('authenticated', buyer, `insert into public.saved_searches (label) select 'Search ' || n from generate_series(1, 19) n`)
check('20 saved searches is the limit', await as('authenticated', buyer, `insert into public.saved_searches (label) values ('One too many')`) === null)

// Public browsing
const totalDogs = await scalar(`select count(*)::int from public.dogs`)
const listed = await scalar(`select count(*)::int from public.dogs d join public.stores s on s.id = d.store_id where d.status in ('available','reserved') and s.status = 'verified'`)
check(`visitors see listed dogs of verified stores (${listed} of ${totalDogs})`, (await as('anon', null, 'select id from public.dogs')).length === listed && listed > 0)
check('visitors can\'t read profiles', await as('anon', null, 'select * from public.profiles') === null)
check('visitors can\'t write a dog', await as('anon', null, `update public.dogs set price_naira = 1`) === null)
check('visitors can\'t read a shortlist', await as('anon', null, 'select * from public.shortlist_items') === null)

// Profiles and shortlists are private
check('you read only your own profile', (await as('authenticated', buyer, 'select id from public.profiles')).length === 1)
await as('authenticated', other, `update public.profiles set full_name = 'Hacked' where id = '${buyer}'`)
check('you can\'t change someone else\'s profile', await scalar(`select full_name from public.profiles where id = '${buyer}'`) === 'Tunde Ade')
check('you can shortlist a dog', (await as('authenticated', buyer, `insert into public.shortlist_items (user_id, dog_id) values ('${buyer}', '${rambo}') returning dog_id`))?.length === 1)
check('you can\'t add to someone else\'s shortlist', await as('authenticated', other, `insert into public.shortlist_items (user_id, dog_id) values ('${buyer}', '${rambo}')`) === null)
check('you can\'t see someone else\'s shortlist', (await as('authenticated', other, 'select * from public.shortlist_items')).length === 0)
check('saving the same dog twice is ignored', (await as('authenticated', buyer, `insert into public.shortlist_items (user_id, dog_id) values ('${buyer}', '${rambo}') on conflict (user_id, dog_id) do nothing returning dog_id`))?.length === 0)
check('you can tick a dog to compare', (await as('authenticated', buyer, `update public.shortlist_items set comparing = true where user_id = '${buyer}' and dog_id = '${rambo}' returning comparing`))?.[0]?.comparing === true)
check('your shortlist reads with each dog\'s file number', (await as('authenticated', buyer, `select d.file_no from public.shortlist_items s join public.dogs d on d.id = s.dog_id`))?.[0]?.file_no === 'KD-2026-003')
check('you can remove a dog from your shortlist', (await as('authenticated', buyer, `delete from public.shortlist_items where user_id = '${buyer}' and dog_id = '${rambo}' returning dog_id`))?.length === 1)

// Trust: nobody verifies themselves
check('a store can\'t verify itself', await as('authenticated', owner, `update public.stores set status = 'verified' where id = '${k9}'`) === null)
check('a store can\'t set its own rating', await as('authenticated', owner, `update public.stores set rating = 5 where id = '${k9}'`) === null)
check('a new store can\'t start out verified', await as('authenticated', buyer, `insert into public.stores (public_id, slug, name, city, status) values ('X', 'x', 'Fake', 'Abuja', 'verified')`) === null)

// Opening a store
const started = await as('authenticated', buyer, `insert into public.stores (public_id, slug, name, city) values ('STR-900', 'sentinel-k9', 'Sentinel K9', 'Abuja') returning id, status`)
check('anyone signed in can start a store, as a draft, and owns it', started?.[0]?.status === 'draft' && await scalar(`select role from public.store_members where store_id = '${started[0].id}' and user_id = '${buyer}'`) === 'owner')
const draft = started?.[0]?.id
check('a draft store is hidden from the public', !(await as('anon', null, 'select id from public.stores')).some(s => s.id === draft))
check('its owner can see it', (await as('authenticated', buyer, `select id from public.stores where id = '${draft}'`)).length === 1)

// Listings
const newDog = (store, status, file = '{}') => `insert into public.dogs (store_id, name, breed, sex, city, age, weight_kg, level, price_naira, status, file) values ('${store}', 'Test', 'Boerboel', 'Male', 'Abuja', '2 years', 50, 3, 100, '${status}', '${file}') returning id, file_no, file`
const draftDog = (await as('authenticated', buyer, newDog(draft, 'draft', '{"summary":"x","inspected":"Inspected by me"}')))?.[0]
check('a draft store can add a draft dog', !!draftDog)
check('Dogeash gives a new dog its file number', /^KD-\d{4}-1\d\d$/.test(draftDog?.file_no ?? ''))
check('a store can\'t write its own inspection line', draftDog && !('inspected' in draftDog.file))
check('a store can\'t choose a file number', await as('authenticated', buyer, `insert into public.dogs (file_no, store_id, name, breed, sex, city, age, weight_kg, level, price_naira) values ('KD-2026-001', '${draft}', 'Test', 'Boerboel', 'Male', 'Abuja', '2 years', 50, 3, 100)`) === null)
check('a new dog can\'t skip straight to available', await as('authenticated', buyer, newDog(draft, 'available')) === null)
check('an unverified store can\'t list a dog', await as('authenticated', buyer, `update public.dogs set status = 'available' where id = '${draftDog?.id}'`) === null)
check('a dog needs a name', await as('authenticated', buyer, `update public.dogs set name = '  ' where id = '${draftDog?.id}'`) === null)
const ramboFile = await as('authenticated', owner, `update public.dogs set file = '{"summary":"New summary","inspected":"Faked"}' where id = '${rambo}' returning file`)
check('editing a dog\'s file keeps Dogeash\'s inspection line', ramboFile?.[0]?.file?.summary === 'New summary' && ramboFile[0].file.inspected === 'Breed survey inspected November 2025')
const k9Dog = (await as('authenticated', manager, newDog(k9, 'draft')))?.[0]
check('a verified store can publish a new dog', (await as('authenticated', manager, `update public.dogs set status = 'available' where id = '${k9Dog?.id}' returning status`))?.[0]?.status === 'available')
check('and mark it sold', (await as('authenticated', handler, `update public.dogs set status = 'sold' where id = '${k9Dog?.id}' returning status`))?.[0]?.status === 'sold')
check('a handler can\'t delete a draft', (await as('authenticated', handler, `delete from public.dogs where id = '${draftDog?.id}' returning id`))?.length === 0)

// Dog photos: each store writes only in its own folder
check('the dog-photos bucket is public', await scalar(`select public::text from storage.buckets where id = 'dog-photos'`) === 'true')
check('a store member can upload to their store\'s folder', (await as('authenticated', handler, `insert into storage.objects (bucket_id, name) values ('dog-photos', '${k9}/rambo.jpg') returning id`))?.length === 1)
check('nobody can upload into another store\'s folder', await as('authenticated', buyer, `insert into storage.objects (bucket_id, name) values ('dog-photos', '${k9}/fake.jpg')`) === null)
check('a folder that isn\'t a store is refused', await as('authenticated', owner, `insert into storage.objects (bucket_id, name) values ('dog-photos', 'loose.jpg')`) === null)
check('visitors can\'t upload', await as('anon', null, `insert into storage.objects (bucket_id, name) values ('dog-photos', '${k9}/x.jpg')`) === null)
check('outsiders can\'t remove a store\'s photo', (await as('authenticated', other, `delete from storage.objects where name = '${k9}/rambo.jpg' returning id`))?.length === 0)
await as('authenticated', other, `update public.dogs set price_naira = 1 where id = '${rambo}'`)
check('outsiders can\'t change a store\'s dogs', await scalar(`select price_naira::int from public.dogs where id = '${rambo}'`) === 3200000)
check('a member can change their store\'s dogs', (await as('authenticated', handler, `update public.dogs set price_naira = 3100000 where id = '${rambo}' returning id`))?.length === 1)
check('a dog can\'t be moved to another store', await as('authenticated', owner, `update public.dogs set store_id = '${draft}' where id = '${rambo}'`) === null)

// Messages and visits (the test store takes visits every day, at the times these tests use)
await db.exec(`update public.stores set visit_days = '{0,1,2,3,4,5,6}', visit_slots = '{10:30,11:00}' where id = '${k9}'`)
const sargeId = await scalar(`select id from public.dogs where file_no = 'KD-2026-014'`)
const otherStoreDog = await scalar(`select id from public.dogs where store_id <> '${k9}' limit 1`)
const conv = await as('authenticated', buyer, `insert into public.conversations (store_id, dog_id) values ('${k9}', '${sargeId}') returning id, buyer_name`)
check('a buyer can start a conversation about a dog, with their name attached', conv?.[0]?.buyer_name === 'Tunde Ade')
const convId = conv?.[0]?.id
check('a buyer can write in their conversation', (await as('authenticated', buyer, `insert into public.messages (conversation_id, sender_role, body) values ('${convId}', 'buyer', 'Is Sarge still available?') returning id`))?.length === 1)
check('a buyer can\'t write as the store', await as('authenticated', buyer, `insert into public.messages (conversation_id, sender_role, body) values ('${convId}', 'store', 'Yes, half price')`) === null)
check('the store\'s owner sees the message', (await as('authenticated', owner, `select body from public.messages where conversation_id = '${convId}'`))?.[0]?.body === 'Is Sarge still available?')
check('the store\'s manager can reply as the store', (await as('authenticated', manager, `insert into public.messages (conversation_id, sender_role, body) values ('${convId}', 'store', 'Yes, he is.') returning id`))?.length === 1)
check('a handler can\'t read the store\'s messages', (await as('authenticated', handler, 'select * from public.messages')).length === 0)
check('outsiders see nothing', (await as('authenticated', other, 'select * from public.conversations')).length === 0 && (await as('authenticated', other, 'select * from public.messages')).length === 0)
check('an outsider can\'t slip a message in', await as('authenticated', other, `insert into public.messages (conversation_id, sender_role, body) values ('${convId}', 'buyer', 'hi')`) === null)
check('the conversation shows the latest message', await scalar(`select last_message_preview from public.conversations where id = '${convId}'`) === 'Yes, he is.')
check('a reply from the store shows as unread for the buyer', await scalar(`select (last_message_at > buyer_read_at)::text from public.conversations where id = '${convId}'`) === 'true')
await as('authenticated', buyer, `select public.mark_conversation_read('${convId}')`)
check('opening it marks it read', await scalar(`select (last_message_at <= buyer_read_at)::text from public.conversations where id = '${convId}'`) === 'true')
check('a conversation can\'t be about another store\'s dog', await as('authenticated', buyer, `insert into public.conversations (store_id, dog_id) values ('${k9}', '${otherStoreDog}')`) === null)
const unverified = await scalar(`select id from public.stores where status <> 'verified' limit 1`)
check('you can\'t message a store that isn\'t verified', await as('authenticated', buyer, `insert into public.conversations (store_id) values ('${unverified}')`) === null)

const visit = await as('authenticated', buyer, `insert into public.visits (store_id, dog_ids, service, day, slot) values ('${k9}', '{${sargeId}}', 'Meet the dogs', current_date + 3, '10:30') returning id, status, buyer_name`)
check('a buyer can request a kennel visit', visit?.[0]?.status === 'requested' && visit[0].buyer_name === 'Tunde Ade')
const visitId = visit?.[0]?.id
check('a visit can\'t be in the past', await as('authenticated', buyer, `insert into public.visits (store_id, service, day, slot) values ('${k9}', 'Meet the dogs', current_date - 1, '10:30')`) === null)
check('a buyer can\'t confirm their own visit', await as('authenticated', buyer, `update public.visits set status = 'confirmed' where id = '${visitId}'`) === null)
check('a handler sees the store\'s visits', (await as('authenticated', handler, 'select id from public.visits')).length === 1)
check('the store can confirm it', (await as('authenticated', handler, `update public.visits set status = 'confirmed', store_note = 'Bring ID for the gate' where id = '${visitId}' returning status`))?.[0]?.status === 'confirmed')
check('outsiders can\'t see or change it', (await as('authenticated', other, 'select * from public.visits')).length === 0)
check('the buyer can cancel it', (await as('authenticated', buyer, `update public.visits set status = 'cancelled' where id = '${visitId}' returning status`))?.[0]?.status === 'cancelled')
check('a cancelled visit can\'t be cancelled again', await as('authenticated', buyer, `update public.visits set status = 'cancelled', store_note = 'x' where id = '${visitId}'`) === null)

// Notifications: written by the database, read and cleared by their owner
const mine = sql => as('authenticated', buyer, sql)
const firstChat = await mine(`select read_at from public.notifications where topic = 'conversation:${convId}'`)
check('a store reply notifies the buyer, and reading it clears it', firstChat?.length === 1 && firstChat[0].read_at !== null)
check('a confirmed visit notifies the buyer with the store\'s note', (await mine(`select title, body from public.notifications where topic = 'visit:${visitId}'`))?.[0]?.body?.includes('Bring ID for the gate'))
await as('authenticated', manager, `insert into public.messages (conversation_id, sender_role, body) values ('${convId}', 'store', 'He is vaccinated.')`)
await as('authenticated', manager, `insert into public.messages (conversation_id, sender_role, body) values ('${convId}', 'store', 'Come on Saturday.')`)
const unreadChat = await mine(`select body from public.notifications where topic = 'conversation:${convId}' and read_at is null`)
check('several replies make one unread notification with the latest text', unreadChat?.length === 1 && unreadChat[0].body === 'Come on Saturday.')
check('the store\'s people aren\'t notified of their own replies', (await as('authenticated', manager, 'select id from public.notifications')).length === 0)
check('nobody sees someone else\'s notifications', (await as('authenticated', other, 'select id from public.notifications')).length === 0)
check('you can\'t write a notification yourself', await mine(`insert into public.notifications (user_id, kind, title, link) values ('${buyer}', 'message', 'Fake', '/')`) === null)
check('you can\'t rewrite a notification', await mine(`update public.notifications set title = 'x'`) === null)
check('you can\'t call the notify function', await mine(`select public.notify('${buyer}', 'message', 'Fake', '', '/', null)`) === null)

await mine(`insert into public.shortlist_items (user_id, dog_id) values ('${buyer}', '${sargeId}')`)
await as('authenticated', manager, `update public.dogs set status = 'reserved' where id = '${sargeId}'`)
check('a shortlisted dog being reserved notifies the buyer', (await mine(`select kind from public.notifications where topic = 'dog:${sargeId}'`))?.[0]?.kind === 'reserved')
await as('authenticated', manager, `update public.dogs set status = 'available' where id = '${sargeId}'`)
const sargeNews = await mine(`select kind, title from public.notifications where topic = 'dog:${sargeId}'`)
check('back on sale replaces the unread "reserved" one', sargeNews?.length === 1 && sargeNews[0].kind === 'available')
check('you can mark it read', (await mine(`update public.notifications set read_at = now() where topic = 'dog:${sargeId}' returning id`))?.length === 1)
await as('authenticated', manager, `update public.dogs set price_naira = price_naira - 100000 where id = '${sargeId}'`)
const drop = await mine(`select body from public.notifications where topic = 'dog:${sargeId}' and read_at is null`)
check('a price drop is a new notification once the last was read', drop?.length === 1 && drop[0].body.startsWith('Now ₦'))
await as('authenticated', manager, `update public.dogs set price_naira = price_naira + 500000 where id = '${sargeId}'`)
check('a price rise doesn\'t notify', (await mine(`select body from public.notifications where topic = 'dog:${sargeId}' and read_at is null`))?.[0]?.body === drop?.[0]?.body)
check('you can clear your notifications', (await mine(`delete from public.notifications returning id`))?.length >= 3)

// Store profile: the store writes its story; the inspection record and reviews stay Dogeash's
const k9Details = sql => as('authenticated', manager, sql)
const edited = await k9Details(`update public.stores set details = details || '{"about":"New about text","inspection":{"status":"passed","by":"Me"},"reviewSamples":[]}' where id = '${k9}' returning details`)
check('a manager can edit the store\'s about text', edited?.[0]?.details?.about === 'New about text')
check('editing keeps Dogeash\'s inspection record', edited?.[0]?.details?.inspection?.by === 'Dogeash inspection team')
check('editing keeps the reviews', edited?.[0]?.details?.reviewSamples?.length === 2)
const wiped = await k9Details(`update public.stores set details = '{"about":"Only this"}' where id = '${k9}' returning details`)
check('replacing all details still keeps the inspection', wiped?.[0]?.details?.inspection?.status === 'passed' && wiped[0].details.dogsPlaced === 212)
const fakePass = await as('authenticated', other, `insert into public.stores (public_id, slug, name, city, details) values ('STR-T2', 'fake-pass', 'Fake Pass', 'Abuja', '{"about":"Hi","inspection":{"status":"passed"}}') returning details`)
check('a new store can\'t start with an inspection', fakePass?.length === 1 && fakePass[0].details.about === 'Hi' && fakePass[0].details.inspection === undefined)
check('a tagline over 140 characters is refused', await k9Details(`update public.stores set tagline = repeat('x', 141) where id = '${k9}'`) === null)
check('a handler can\'t edit the profile', (await as('authenticated', handler, `update public.stores set details = '{}' where id = '${k9}' returning id`))?.length === 0)

// Store banner and logo: owners and managers, in their own store's folder only
check('the store-media bucket is public', await scalar(`select public::text from storage.buckets where id = 'store-media'`) === 'true')
check('a manager can upload a store image', (await as('authenticated', manager, `insert into storage.objects (bucket_id, name) values ('store-media', '${k9}/banner.jpg') returning id`))?.length === 1)
check('a handler can\'t upload store images', await as('authenticated', handler, `insert into storage.objects (bucket_id, name) values ('store-media', '${k9}/h.jpg')`) === null)
check('outsiders can\'t upload into a store\'s folder', await as('authenticated', buyer, `insert into storage.objects (bucket_id, name) values ('store-media', '${k9}/x.jpg')`) === null)
check('a manager can set the banner', (await as('authenticated', manager, `update public.stores set banner_path = '${k9}/banner.jpg', logo_path = '${k9}/logo.png' where id = '${k9}' returning banner_path`))?.[0]?.banner_path === `${k9}/banner.jpg`)
check('a store can\'t use another store\'s image', await as('authenticated', manager, `update public.stores set logo_path = '${draft}/logo.png' where id = '${k9}'`) === null)
check('a handler can\'t change the banner', (await as('authenticated', handler, `update public.stores set banner_path = null where id = '${k9}' returning id`))?.length === 0)

// Reviews: after a done visit, one per buyer per store; the store replies; the rating follows
const review = (uid, sql) => as('authenticated', uid, sql)
check('you can\'t review a store you haven\'t visited', await review(buyer, `insert into public.store_reviews (store_id, rating, body) values ('${k9}', 5, 'Great dogs and a great handover.')`) === null)
const doneVisit = (await review(buyer, `insert into public.visits (store_id, service, day, slot) values ('${k9}', 'Meet the dogs', current_date + 1, '11:00') returning id`))?.[0]?.id
await review(owner, `update public.visits set status = 'done' where id = '${doneVisit}'`)
check('a buyer can\'t write the store\'s reply', await review(buyer, `insert into public.store_reviews (store_id, rating, body, store_reply) values ('${k9}', 5, 'Serious dogs, honest advice, and a calm kennel.', 'fake reply')`) === null)
const written = await review(buyer, `insert into public.store_reviews (store_id, rating, body) values ('${k9}', 5, 'Serious dogs, honest advice, and a calm kennel.') returning id, author_name, visit_id, store_reply`)
check('after a done visit you can review the store', written?.[0]?.author_name === 'Tunde Ade' && written[0].visit_id === doneVisit && written[0].store_reply === null)
const reviewId = written?.[0]?.id
check('the store\'s rating and count follow its reviews', (await scalar(`select rating::text || '/' || reviews_count from public.stores where id = '${k9}'`)) === '5.0/1')
check('one review per buyer per store', await review(buyer, `insert into public.store_reviews (store_id, rating, body) values ('${k9}', 4, 'Writing a second one for the same store.')`) === null)
check('a short review is refused', await review(buyer, `update public.store_reviews set body = 'ok' where id = '${reviewId}'`) === null)
check('visitors read reviews, without the author\'s account id', (await as('anon', null, `select body from public.store_reviews where id = '${reviewId}'`))?.length === 1 && await as('anon', null, 'select author_id from public.store_reviews') === null)
check('the owner and manager are told about a new review', (await review(owner, `select kind from public.notifications where topic = 'review:${reviewId}'`))?.[0]?.kind === 'review' && (await review(manager, `select id from public.notifications where topic = 'review:${reviewId}'`))?.length === 1)
check('handlers aren\'t told about reviews', (await review(handler, `select id from public.notifications where topic = 'review:${reviewId}'`))?.length === 0)
check('the author can\'t reply as the store', await review(buyer, `update public.store_reviews set store_reply = 'Thanks!' where id = '${reviewId}'`) === null)
check('a handler can\'t reply', (await review(handler, `update public.store_reviews set store_reply = 'Thanks!' where id = '${reviewId}' returning id`))?.length === 0)
check('a manager can reply', (await review(manager, `update public.store_reviews set store_reply = 'Thank you, Tunde.' where id = '${reviewId}' returning replied_at`))?.[0]?.replied_at !== null)
check('the buyer is told about the reply', (await review(buyer, `select title from public.notifications where topic = 'review-reply:${reviewId}'`))?.[0]?.title === 'K9 Guardian Kennels replied to your review')
check('the store can\'t change the rating', await review(manager, `update public.store_reviews set rating = 1 where id = '${reviewId}'`) === null)
await review(buyer, `update public.store_reviews set rating = 3 where id = '${reviewId}'`)
check('editing the rating updates the store\'s rating', (await scalar(`select rating::text from public.stores where id = '${k9}'`)) === '3.0')
check('outsiders can\'t delete a review', (await review(other, `delete from public.store_reviews where id = '${reviewId}' returning id`))?.length === 0)
check('the author can delete their review', (await review(buyer, `delete from public.store_reviews where id = '${reviewId}' returning id`))?.length === 1 && (await scalar(`select reviews_count::int from public.stores where id = '${k9}'`)) === 0)

// Care team: providers are public; owners and managers link the ones they work with
check('anyone can read the care directory', (await as('anon', null, 'select public_id from public.care_providers')).length === 9)
check('anyone can read a verified store\'s care team', (await as('anon', null, `select relationship from public.store_care_links where store_id = '${k9}'`)).length === 3)
const careId = async publicId => scalar(`select id from public.care_providers where public_id = '${publicId}'`)
const lagosVet = await careId('CARE-04')
check('a manager can link a provider', (await as('authenticated', manager, `insert into public.store_care_links (store_id, provider_id, relationship) values ('${k9}', '${lagosVet}', 'Our Lagos vet') returning relationship`))?.length === 1)
check('a handler can\'t link providers', await as('authenticated', handler, `insert into public.store_care_links (store_id, provider_id, relationship) values ('${k9}', '${await careId('CARE-05')}', 'x')`) === null)
check('outsiders can\'t change a store\'s care team', await as('authenticated', buyer, `insert into public.store_care_links (store_id, provider_id, relationship) values ('${k9}', '${await careId('CARE-06')}', 'x')`) === null)
check('a manager can say what a provider does', (await as('authenticated', manager, `update public.store_care_links set relationship = 'Vet for our Lagos buyers' where store_id = '${k9}' and provider_id = '${lagosVet}' returning relationship`))?.[0]?.relationship === 'Vet for our Lagos buyers')
check('the relationship can\'t be blank', await as('authenticated', manager, `update public.store_care_links set relationship = '  ' where store_id = '${k9}' and provider_id = '${lagosVet}'`) === null)
check('nobody but Dogeash edits the directory', await as('authenticated', owner, `update public.care_providers set verified = true where public_id = 'CARE-05'`) === null)
check('a manager can unlink a provider', (await as('authenticated', manager, `delete from public.store_care_links where store_id = '${k9}' and provider_id = '${lagosVet}' returning store_id`))?.length === 1)
const allProviders = (await db.query('select id from public.care_providers')).rows.map(r => r.id)
for (const id of allProviders) await db.query(`insert into public.store_care_links (store_id, provider_id, relationship) values ('${k9}', '${id}', 'Works with us') on conflict do nothing`)
await db.query(`insert into public.care_providers (public_id, slug, name, type, city) values ('CARE-T1', 'test-one', 'Test One', 'vet', 'Abuja'), ('CARE-T2', 'test-two', 'Test Two', 'vet', 'Abuja'), ('CARE-T3', 'test-three', 'Test Three', 'vet', 'Abuja'), ('CARE-T4', 'test-four', 'Test Four', 'vet', 'Abuja')`)
for (const t of ['T1', 'T2', 'T3']) await as('authenticated', owner, `insert into public.store_care_links (store_id, provider_id, relationship) values ('${k9}', '${await careId(`CARE-${t}`)}', 'x')`)
check('a store links up to 12 providers', await as('authenticated', owner, `insert into public.store_care_links (store_id, provider_id, relationship) values ('${k9}', '${await careId('CARE-T4')}', 'x')`) === null)
check('the care team no longer lives in a store\'s details', await scalar(`select (details ? 'care')::text from public.stores where id = '${k9}'`) === 'false')
// The migration's one-off move of `details.care` into links, on a store that still has the old list
const migration = readFileSync(join(root, 'supabase/migrations/20261111000000_care_providers.sql'), 'utf8')
const move = migration.slice(migration.indexOf('insert into public.store_care_links (store_id, provider_id, relationship)\nselect'))
await db.query(`update public.stores set details = details || '{"care":[{"providerId":"CARE-07","relationship":"Our vet"},{"providerId":"CARE-99","relationship":"Gone"}]}' where public_id = 'STR-004'`)
await db.exec(move)
const moved = await db.query(`select p.public_id, l.relationship from public.store_care_links l join public.care_providers p on p.id = l.provider_id join public.stores s on s.id = l.store_id where s.public_id = 'STR-004' and p.public_id = 'CARE-07'`)
check('the old care lists move into links (unknown providers are skipped)', moved.rows[0]?.relationship === 'Our vet' && await scalar(`select (details ? 'care')::text from public.stores where public_id = 'STR-004'`) === 'false')

// Visit settings: requests must fit the store's days, times and places, and nothing comes in while paused
const visitOn = (day, slot = '10:30', place = 'kennel') => as('authenticated', buyer, `insert into public.visits (store_id, service, day, slot, place) values ('${k9}', 'Meet the dogs', ${day}, '${slot}', '${place}') returning id`)
check('a manager can set the store\'s visit times', (await as('authenticated', manager, `update public.stores set visit_days = '{1,2,3,4,5}', visit_slots = '{9:00,14:30}', home_visits = false where id = '${k9}' returning visit_slots`))?.length === 1)
const nextDow = dow => `(current_date + ((${dow} - extract(dow from current_date)::int + 7) % 7 + 7))`
check('a visit on a day the store takes visits is fine', (await visitOn(nextDow(2), '14:30'))?.length === 1)
check('a visit on a day off is refused', await visitOn(nextDow(0), '14:30') === null)
check('a time the store doesn\'t offer is refused', await visitOn(nextDow(2), '10:30') === null)
check('a home visit is refused unless the store offers them', await visitOn(nextDow(3), '9:00', 'home') === null)
await as('authenticated', manager, `update public.stores set home_visits = true where id = '${k9}'`)
check('a home visit is fine once the store offers them', (await visitOn(nextDow(3), '9:00', 'home'))?.length === 1)
await as('authenticated', owner, `update public.stores set visits_paused = true, pause_note = 'Back on 1 December' where id = '${k9}'`)
check('nothing comes in while visits are paused', await visitOn(nextDow(4), '9:00') === null)
check('a badly written time is refused', await as('authenticated', owner, `update public.stores set visit_slots = '{9am}' where id = '${k9}'`) === null)
check('a store needs at least one visit day', await as('authenticated', owner, `update public.stores set visit_days = '{}' where id = '${k9}'`) === null)
check('a handler can\'t change visit settings', (await as('authenticated', handler, `update public.stores set visits_paused = false where id = '${k9}' returning id`))?.length === 0)
await db.exec(`update public.stores set visits_paused = false, pause_note = '', home_visits = false, visit_days = '{0,1,2,3,4,5,6}', visit_slots = '{10:30,11:00}' where id = '${k9}'`)

// Dog photos and videos: up to 8 more photos and 4 videos, only from the store's own folder
const media = (sql) => as('authenticated', handler, sql)
const g = n => `'{${Array.from({ length: n }, (_, i) => `${k9}/g${i}.jpg`).join(',')}}'`
const vid = (path, kind = 'obedience') => `{"path":"${path}","kind":"${kind}","title":"Heel work"}`
check('a handler can add more photos and a video', (await media(`update public.dogs set gallery_paths = ${g(3)}, videos = '[${vid(`${k9}/heel.mp4`)}]' where id = '${rambo}' returning id`))?.length === 1)
check('up to 8 more photos', await media(`update public.dogs set gallery_paths = ${g(9)} where id = '${rambo}'`) === null)
check('photos only from the store\'s own folder', await media(`update public.dogs set gallery_paths = '{${draft}/x.jpg}' where id = '${rambo}'`) === null)
check('up to 4 videos', await media(`update public.dogs set videos = '[${[1, 2, 3, 4, 5].map(i => vid(`${k9}/v${i}.mp4`)).join(',')}]' where id = '${rambo}'`) === null)
check('a video says what it shows', await media(`update public.dogs set videos = '[${vid(`${k9}/v.mp4`, 'party')}]' where id = '${rambo}'`) === null)
check('videos only from the store\'s own folder', await media(`update public.dogs set videos = '[${vid(`${draft}/v.mp4`)}]' where id = '${rambo}'`) === null)
check('the dog-videos bucket is public', await scalar(`select public::text from storage.buckets where id = 'dog-videos'`) === 'true')
check('a store member can upload a video to their folder', (await media(`insert into storage.objects (bucket_id, name) values ('dog-videos', '${k9}/heel.mp4') returning id`))?.length === 1)
check('outsiders can\'t upload videos into a store\'s folder', await as('authenticated', buyer, `insert into storage.objects (bucket_id, name) values ('dog-videos', '${k9}/fake.mp4')`) === null)

// Roles
check('a handler can\'t edit the store', (await as('authenticated', handler, `update public.stores set tagline = 'x' where id = '${k9}' returning id`))?.length === 0)
check('a manager can edit the store', (await as('authenticated', manager, `update public.stores set tagline = 'x' where id = '${k9}' returning id`))?.length === 1)
check('a manager can\'t promote themselves', (await as('authenticated', manager, `update public.store_members set role = 'owner' where user_id = '${manager}' returning role`))?.length === 0)
check('you can\'t add yourself to a store', await as('authenticated', other, `insert into public.store_members (store_id, user_id, role) values ('${k9}', '${other}', 'owner')`) === null)
check('an owner can add a member', (await as('authenticated', owner, `insert into public.store_members (store_id, user_id, role) values ('${k9}', '${other}', 'handler') returning role`))?.length === 1)
check('the last owner can\'t leave', await as('authenticated', owner, `delete from public.store_members where user_id = '${owner}' and store_id = '${k9}'`) === null)
check('a verified store can\'t be deleted by its owner', (await as('authenticated', owner, `delete from public.stores where id = '${k9}' returning id`))?.length === 0)
await db.exec(`delete from public.dogs where store_id = '${draft}'`)
check('an owner can delete their draft store', (await as('authenticated', buyer, `delete from public.stores where id = '${draft}' returning id`))?.length === 1)

// Store team: owners invite by email; the invited person joins or declines; the team sees each other
const recruit = await user('Kemi Ola')
const invited = await as('authenticated', owner, `insert into public.store_invites (store_id, email, role) values ('${k9}', ' Kemi@Test.NG ', 'handler') returning id, email`)
check('an owner can invite someone by email', invited?.[0]?.email === 'kemi@test.ng')
const inviteId = invited?.[0]?.id
check('a manager can\'t invite', await as('authenticated', manager, `insert into public.store_invites (store_id, email, role) values ('${k9}', 'x@test.ng', 'handler')`) === null)
check('you can\'t invite someone already on the team', await as('authenticated', owner, `insert into public.store_invites (store_id, email, role) values ('${k9}', '${emailOf('Musa Bello')}', 'manager')`) === null)
check('a badly typed email is refused', await as('authenticated', owner, `insert into public.store_invites (store_id, email, role) values ('${k9}', 'not-an-email', 'handler')`) === null)
check('the invited person gets a notification', (await as('authenticated', recruit, `select kind from public.notifications where topic = 'invite:${inviteId}'`))?.[0]?.kind === 'team')
const waitingFor = await as('authenticated', recruit, 'select * from public.my_store_invites()')
check('the invited person sees the invitation with the store\'s name', waitingFor?.length === 1 && waitingFor[0].store_name === 'K9 Guardian Kennels' && waitingFor[0].invited_by_name === 'Ibrahim Danjuma')
check('nobody else sees it', (await as('authenticated', buyer, 'select * from public.my_store_invites()')).length === 0 && (await as('authenticated', buyer, 'select id from public.store_invites')).length === 0)
check('someone else can\'t accept it', await as('authenticated', buyer, `select public.accept_store_invite('${inviteId}')`) === null)
check('the invited person can join', (await as('authenticated', recruit, `select public.accept_store_invite('${inviteId}') as store`))?.[0]?.store === 'STR-001')
check('joining gives the invited role and uses up the invitation', await scalar(`select role from public.store_members where store_id = '${k9}' and user_id = '${recruit}'`) === 'handler' && await scalar(`select count(*)::int from public.store_invites where id = '${inviteId}'`) === 0)
const inviteNote = await as('authenticated', recruit, `select read_at from public.notifications where topic = 'invite:${inviteId}'`)
check('joining clears the notification', inviteNote?.length === 1 && inviteNote[0].read_at !== null)
const declined = await as('authenticated', owner, `insert into public.store_invites (store_id, email, role) values ('${k9}', 'later@test.ng', 'manager') returning id`)
check('an owner can withdraw an invitation', (await as('authenticated', owner, `delete from public.store_invites where id = '${declined?.[0]?.id}' returning id`))?.length === 1)

const teamAsHandler = await as('authenticated', handler, `select * from public.store_team('${k9}')`)
check('the team sees everyone on it, owners first, with names', teamAsHandler?.length >= 4 && teamAsHandler[0].role === 'owner' && teamAsHandler.some(m => m.name === 'Kemi Ola'))
check('only owners see the team\'s emails', teamAsHandler.every(m => m.email === null) && (await as('authenticated', owner, `select email from public.store_team('${k9}')`)).every(m => m.email))
check('outsiders see no team', (await as('authenticated', buyer, `select * from public.store_team('${k9}')`)).length === 0)
check('an owner can change someone\'s role', (await as('authenticated', owner, `update public.store_members set role = 'manager' where store_id = '${k9}' and user_id = '${recruit}' returning role`))?.[0]?.role === 'manager')
check('a member can leave', (await as('authenticated', recruit, `delete from public.store_members where store_id = '${k9}' and user_id = '${recruit}' returning user_id`))?.length === 1)

// Staff: added only in the SQL editor; every staff power also needs a one-time-code session (aal2)
const admin = await user('Zainab Musa')
const inspector = await user('Femi Ade')
await db.exec(`insert into public.staff (user_id, role) values ('${admin}', 'admin'), ('${inspector}', 'inspector')`)
// Run SQL as someone whose session has (aal2) or hasn't (aal1) passed a one-time code
async function withCode(uid, aal, sql) {
  await db.exec(`set test.jwt = '{"aal":"${aal}"}'`)
  try { return await as('authenticated', uid, sql) }
  finally { await db.exec(`set test.jwt = ''`) }
}
check('nobody can make themselves staff', await as('authenticated', buyer, `insert into public.staff (user_id, role) values ('${buyer}', 'admin')`) === null)
check('staff can\'t promote themselves', (await withCode(inspector, 'aal2', `update public.staff set role = 'admin' where user_id = '${inspector}' returning role`)) === null)
check('you can see your own staff role, and no one else\'s', (await as('authenticated', admin, 'select role from public.staff'))?.length === 1 && (await as('authenticated', buyer, 'select role from public.staff')).length === 0)
check('the overview is refused to non-staff', await withCode(buyer, 'aal2', 'select public.admin_overview()') === null)
check('the overview is refused to staff without a one-time code', await withCode(admin, 'aal1', 'select public.admin_overview()') === null)
const overview = (await withCode(admin, 'aal2', 'select public.admin_overview() as o'))?.[0]?.o
check('an admin with a one-time code gets the overview', overview?.stores?.verified >= 5 && typeof overview?.waiting?.storesInReview === 'number')
check('the overview has 60 days of activity, the top stores and cities', overview?.series?.length === 60 && overview.series.at(-1).accounts >= 0 && overview.topStores.length > 0 && overview.cities[0]?.dogs > 0)
check('the daily series can\'t be called directly', await withCode(admin, 'aal2', 'select public.admin_series()') === null)
check('an inspector with a one-time code gets the overview too', (await withCode(inspector, 'aal2', 'select public.admin_overview() as o'))?.[0]?.o?.accounts > 0)
check('is_staff is false without a one-time code', (await withCode(admin, 'aal1', 'select public.is_staff() as yes'))?.[0]?.yes === false)
check('nobody writes the audit log directly', await withCode(admin, 'aal2', `insert into public.admin_audit (action, target_type, target_id) values ('x', 'store', 'STR-001')`) === null && await withCode(admin, 'aal2', `select public.admin_log('x', 'store', 'STR-001')`) === null)
await db.exec(`set test.uid = '${admin}'; select public.admin_log('test.action', 'store', 'STR-001', '{"why":"testing"}'); reset test.uid;`)
check('admins with a one-time code read the audit log', (await withCode(admin, 'aal2', 'select actor_name, action from public.admin_audit'))?.[0]?.actor_name === 'Zainab Musa')
check('the audit log is closed to everyone else', (await withCode(inspector, 'aal2', 'select id from public.admin_audit')).length === 0 && (await withCode(admin, 'aal1', 'select id from public.admin_audit')).length === 0)

// Store status from the admin overview: approve, decline, suspend, restore; logged and told to the store
const savanna = await scalar(`select id from public.stores where public_id = 'STR-004'`)
await db.exec(`insert into public.store_members (store_id, user_id, role) values ('${savanna}', '${other}', 'owner') on conflict do nothing`)
await db.exec(`update public.stores set status = 'in_review', details = details - 'inspection' where id = '${savanna}'`)
const allStores = (await withCode(admin, 'aal2', 'select public.admin_stores() as s'))?.[0]?.s
check('admins see every store, any status, with its owner', allStores?.some(s => s.public_id === 'STR-004' && s.status === 'in_review' && s.owner))
check('the store list is refused without a one-time code', await withCode(admin, 'aal1', 'select public.admin_stores()') === null)
check('inspectors can\'t change a store\'s status', await withCode(inspector, 'aal2', `select public.admin_set_store_status('STR-004', 'verified')`) === null)
check('owners can\'t change their own status', await withCode(other, 'aal2', `select public.admin_set_store_status('STR-004', 'verified')`) === null)
check('declining needs a reason', await withCode(admin, 'aal2', `select public.admin_set_store_status('STR-004', 'draft')`) === null)
check('an admin can approve a store', (await withCode(admin, 'aal2', `select public.admin_set_store_status('STR-004', 'verified', 'All checks passed')`)) !== null && await scalar(`select status::text from public.stores where id = '${savanna}'`) === 'verified')
check('approving records the inspection', await scalar(`select details -> 'inspection' ->> 'status' from public.stores where id = '${savanna}'`) === 'passed')
check('the store\'s owner is told, with the note', (await as('authenticated', other, `select title, body from public.notifications where topic = 'store-status:${savanna}'`))?.[0]?.body === 'All checks passed')
check('the change is in the audit log', (await withCode(admin, 'aal2', `select detail ->> 'from' as from_status from public.admin_audit where action = 'store.verified' and target_id = 'STR-004'`))?.[0]?.from_status === 'in_review')
check('an admin can suspend it, with a reason the store reads', (await withCode(admin, 'aal2', `select public.admin_set_store_status('STR-004', 'suspended', 'Complaints under review')`)) !== null && (await as('authenticated', other, `select status_note from public.stores where id = '${savanna}'`))?.[0]?.status_note === 'Complaints under review')
check('a suspended store disappears from the public', (await as('anon', null, `select id from public.stores where id = '${savanna}'`)).length === 0)
check('stores still can\'t write the inspection themselves', (await as('authenticated', other, `update public.stores set details = details || '{"inspection":{"status":"passed","by":"Me"}}' where id = '${savanna}' returning details -> 'inspection' ->> 'by' as by`))?.[0]?.by !== 'Me')
check('changing to the same status is refused', await withCode(admin, 'aal2', `select public.admin_set_store_status('STR-004', 'suspended', 'again')`) === null)

// Admin sections: listings, reviews, people, care directory (admins with a one-time code only)
const adm = sql => withCode(admin, 'aal2', sql)
const sarge2 = await scalar(`select id from public.dogs where file_no = 'KD-2026-014'`)
check('admins list every dog, any status', (await adm('select public.admin_dogs() as d'))?.[0]?.d?.length >= 18)
check('the dog list is closed to everyone else', await withCode(inspector, 'aal2', 'select public.admin_dogs()') === null && await withCode(owner, 'aal2', 'select public.admin_dogs()') === null)
check('taking a dog down needs a reason', await adm(`select public.admin_set_dog_status('${sarge2}', 'withdrawn')`) === null)
await adm(`select public.admin_set_dog_status('${sarge2}', 'withdrawn', 'Photos don''t match the K9 file')`)
check('an admin can take a dog down, with a note the store reads', (await as('authenticated', manager, `select status, admin_note from public.dogs where id = '${sarge2}'`))?.[0]?.admin_note === 'Photos don\'t match the K9 file')
check('the store is told', (await as('authenticated', owner, `select title from public.notifications where topic = 'dog-admin:${sarge2}'`))?.[0]?.title?.includes('taken down'))
check('a taken-down dog leaves the public listings', (await as('anon', null, `select id from public.dogs where id = '${sarge2}'`)).length === 0)
await as('authenticated', manager, `update public.dogs set status = 'draft' where id = '${sarge2}'`)
check('when the store moves the dog on itself, Dogeash\'s note goes', await scalar(`select admin_note from public.dogs where id = '${sarge2}'`) === '')
await adm(`select public.admin_set_dog_status('${sarge2}', 'available', '')`)
check('an admin can put it back', await scalar(`select status::text from public.dogs where id = '${sarge2}'`) === 'available')
const draftStoreDog = await scalar(`select d.id from public.dogs d join public.stores s on s.id = d.store_id where s.status <> 'verified' limit 1`)
if (draftStoreDog) check('a dog of an unverified store can\'t be put live', await adm(`select public.admin_set_dog_status('${draftStoreDog}', 'available', '')`) === null)

const rv = await as('authenticated', buyer, `insert into public.store_reviews (store_id, rating, body) values ('${k9}', 1, 'Terrible, they never answered my calls at all.') returning id`)
const rvId = rv?.[0]?.id
check('admins list every review with its author', (await adm('select public.admin_reviews() as r'))?.[0]?.r?.some(x => x.id === rvId && x.author_email))
check('removing a review needs a reason', await adm(`select public.admin_remove_review('${rvId}', '')`) === null)
await adm(`select public.admin_remove_review('${rvId}', 'Breaks the review rules: no visit details')`)
check('an admin can remove a review; the author is told', await scalar(`select count(*)::int from public.store_reviews where id = '${rvId}'`) === 0 && (await as('authenticated', buyer, `select body from public.notifications where topic = 'review-removed:${rvId}'`))?.[0]?.body?.includes('review rules'))
check('removals are in the audit log with the review', (await adm(`select detail ->> 'body' as body from public.admin_audit where action = 'review.remove' and target_id = '${rvId}'`))?.[0]?.body?.startsWith('Terrible'))

const people = (await adm(`select public.admin_people('ibrahim') as p`))?.[0]?.p
check('admins can look people up, with their stores', people?.length === 1 && people[0].stores?.some(s => s.role === 'owner'))
check('people search is closed to everyone else', await withCode(buyer, 'aal2', 'select public.admin_people()') === null)

const newCare = (await adm(`select public.admin_save_provider('{"name":"Gwarinpa Pet Clinic","type":"vet","city":"Abuja","verified":true,"priceFrom":12000}') as id`))?.[0]?.id
check('an admin can add a care provider', /^CARE-\d+$/.test(newCare ?? '') && await scalar(`select slug from public.care_providers where public_id = '${newCare}'`) === 'gwarinpa-pet-clinic')
check('an admin can edit one', (await adm(`select public.admin_save_provider('{"id":"${newCare}","name":"Gwarinpa Pet Clinic","type":"vet","city":"Abuja","areas":"Abuja","verified":false}')`)) !== null && await scalar(`select verified::text from public.care_providers where public_id = '${newCare}'`) === 'false')
check('only admins edit the directory', await withCode(inspector, 'aal2', `select public.admin_save_provider('{"name":"X Y","type":"vet","city":"Abuja"}')`) === null)
check('an admin can remove one', (await adm(`select public.admin_delete_provider('${newCare}')`)) !== null && await scalar(`select count(*)::int from public.care_providers where public_id = '${newCare}'`) === 0)

// Store applications: a draft store's owner applies with documents; admins review; sending back reopens it
const applicant = await user('Bisi Adeyemi')
const appStore = (await as('authenticated', applicant, `insert into public.stores (public_id, slug, name, city) values ('STR-APP', 'eko-shield', 'Eko Shield K9', 'Lagos') returning id`))?.[0]?.id
const asApplicant = sql => as('authenticated', applicant, sql)
check('an owner can start their store\'s application', (await asApplicant(`insert into public.store_applications (store_id, address, contact_phone, preferred_days) values ('${appStore}', '14 Admiralty Way, Lekki Phase 1', '0803 000 0000', array[current_date + 3]) returning store_id`))?.length === 1)
check('nobody else can read it', (await as('authenticated', buyer, 'select store_id from public.store_applications')).length === 0)
check('the owner can upload a document to their private folder', (await asApplicant(`insert into storage.objects (bucket_id, name) values ('store-documents', '${appStore}/id.pdf') returning id`))?.length === 1)
check('the documents bucket is private', await scalar(`select public::text from storage.buckets where id = 'store-documents'`) === 'false')
check('outsiders can\'t upload or read store documents', await as('authenticated', buyer, `insert into storage.objects (bucket_id, name) values ('store-documents', '${appStore}/x.pdf')`) === null && (await as('authenticated', buyer, `select id from storage.objects where bucket_id = 'store-documents'`)).length === 0)
check('sending needs a finished profile', await asApplicant(`select public.submit_store_application('${appStore}')`) === null)
await asApplicant(`update public.stores set tagline = 'Family guardians raised in Lekki', details = '{"about":"A family kennel raising calm, clear-headed guardians for homes in Lagos.","owner":{"name":"Bisi Adeyemi"}}' where id = '${appStore}'`)
check('sending needs a dog', await asApplicant(`select public.submit_store_application('${appStore}')`) === null)
await asApplicant(newDog(appStore, 'draft'))
check('sending needs the owner\'s ID and the CAC certificate', await asApplicant(`select public.submit_store_application('${appStore}')`) === null)
await asApplicant(`update public.store_applications set id_doc_path = '${appStore}/id.pdf', cac_registered = false where store_id = '${appStore}'`)
check('documents only from the store\'s own folder', await asApplicant(`update public.store_applications set address_doc_path = '${k9}/bill.pdf' where store_id = '${appStore}'`) === null)
check('a handler or outsider can\'t send it', await as('authenticated', buyer, `select public.submit_store_application('${appStore}')`) === null)
check('with everything in, the owner can send it', (await asApplicant(`select public.submit_store_application('${appStore}')`)) !== null && await scalar(`select status::text from public.stores where id = '${appStore}'`) === 'in_review')
check('admins are told about it', (await as('authenticated', admin, `select title from public.notifications where topic = 'application:${appStore}'`))?.[0]?.title === 'New store application: Eko Shield K9')
check('in review, the application is locked', (await asApplicant(`update public.store_applications set address = 'Somewhere else entirely' where store_id = '${appStore}' returning store_id`))?.length === 0 && await asApplicant(`insert into storage.objects (bucket_id, name) values ('store-documents', '${appStore}/late.pdf')`) === null)
const apps = (await adm('select public.admin_applications() as a'))?.[0]?.a
check('admins see the application with its owner and documents', apps?.some(a => a.public_id === 'STR-APP' && a.owner?.email === 'bisi@test.ng' && a.id_doc_path))
check('the applications list is closed to everyone else', await withCode(applicant, 'aal2', 'select public.admin_applications()') === null)
check('admins can open the documents', (await adm(`select id from storage.objects where bucket_id = 'store-documents' and name = '${appStore}/id.pdf'`))?.length === 1)
await adm(`select public.admin_set_store_status('STR-APP', 'draft', 'Your ID photo is blurry. Upload a clearer one.')`)
check('sending it back reopens the application', (await asApplicant(`update public.store_applications set note = 'New ID uploaded' where store_id = '${appStore}' returning store_id`))?.length === 1)

// Inspections: an admin books one; the inspector works the sheet; the result verifies the store (or sends it back)
await db.exec(`update public.stores set status = 'in_review' where id = '${appStore}'`)
const asInspector = sql => withCode(inspector, 'aal2', sql)
const when = `now() + interval '2 days'`
check('only admins book inspections', await asInspector(`select public.admin_schedule_inspection('STR-APP', ${when}, '${inspector}')`) === null)
const insId = (await adm(`select public.admin_schedule_inspection('STR-APP', ${when}, '${inspector}', 'Gate code 1234') as id`))?.[0]?.id
check('an admin books an inspection with an inspector', !!insId)
check('a store can\'t have two booked at once', await adm(`select public.admin_schedule_inspection('STR-APP', ${when}, '${inspector}')`) === null)
check('the owner and the inspector are told', (await asApplicant(`select title from public.notifications where topic = 'inspection:${insId}'`))?.[0]?.title?.startsWith('Inspection booked') && (await as('authenticated', inspector, `select id from public.notifications where topic = 'inspection-assigned:${insId}'`))?.length === 1)
check('the owner sees when, and with whom', (await asApplicant(`select public.my_store_inspection('${appStore}') as i`))?.[0]?.i?.status === 'scheduled' && (await as('authenticated', buyer, `select public.my_store_inspection('${appStore}') as i`))?.[0]?.i === null)
const sheet = (await asInspector(`select public.admin_inspection('${insId}') as s`))?.[0]?.s
check('the inspector gets the sheet, with every listed dog and the address', sheet?.dogs?.length === 1 && sheet.address?.includes('Admiralty'))
check('inspectors see only their own inspections; outsiders none', (await asInspector('select public.admin_inspections() as l'))?.[0]?.l?.length >= 1 && await withCode(buyer, 'aal2', `select public.admin_inspection('${insId}')`) === null)
check('the result needs every check marked', await asInspector(`select public.admin_complete_inspection('${insId}', true)`) === null)
check('the inspector can add photos (private, staff only)', (await asInspector(`insert into storage.objects (bucket_id, name) values ('inspection-photos', '${insId}/run.jpg') returning id`))?.length === 1 && await as('authenticated', applicant, `insert into storage.objects (bucket_id, name) values ('inspection-photos', '${insId}/x.jpg')`) === null)
const dogId = sheet?.dogs?.[0]?.id
const checklist = `'[{"key":"runs","label":"Clean, shaded kennel runs","ok":true,"note":""},{"key":"vet","label":"Vet records for every dog","ok":true,"note":""},{"key":"chips","label":"Microchips scanned and matched","ok":false,"note":"One chip unreadable"}]'`
const dogsSeen = `'[{"id":"${dogId}","seen":true,"confirmed_level":4,"note":"Solid"}]'`
check('photos must belong to the inspection', await asInspector(`select public.admin_save_inspection('${insId}', ${checklist}, ${dogsSeen}, '{${appStore}/x.jpg}', '')`) === null)
check('the inspector saves the sheet', (await asInspector(`select public.admin_save_inspection('${insId}', ${checklist}, ${dogsSeen}, '{${insId}/run.jpg}', 'Good kennel; one chip to rescan.')`)) !== null)
check('a pass verifies the store', (await asInspector(`select public.admin_complete_inspection('${insId}', true)`)) !== null && await scalar(`select status::text from public.stores where id = '${appStore}'`) === 'verified')
check('the store\'s inspection record names the inspector and the checks passed', await scalar(`select (details -> 'inspection' ->> 'by') || '|' || jsonb_array_length(details -> 'inspection' -> 'checks') from public.stores where id = '${appStore}'`) === 'Femi Ade, Dogeash|2')
check('dogs seen get their confirmed level and the inspected line', await scalar(`select level || '|' || (file ->> 'inspected') from public.dogs where id = '${dogId}'`) === `4|Inspected ${new Date().toLocaleString('en-GB', { month: 'long', timeZone: 'Africa/Lagos' })} ${new Date().getFullYear()} by Dogeash`)
check('a finished inspection can\'t be recorded again', await asInspector(`select public.admin_complete_inspection('${insId}', false)`) === null)

await db.exec(`update public.stores set status = 'in_review' where id = '${appStore}'`)
const failId = (await adm(`select public.admin_schedule_inspection('STR-APP', ${when}, '${admin}') as id`))?.[0]?.id
await adm(`select public.admin_save_inspection('${failId}', '[{"key":"runs","label":"Clean runs","ok":false,"note":"Flooded"}]', '[]', '{}', '')`)
check('a fail needs a summary for the store', await adm(`select public.admin_complete_inspection('${failId}', false)`) === null)
await adm(`select public.admin_save_inspection('${failId}', '[{"key":"runs","label":"Clean runs","ok":false,"note":"Flooded"}]', '[]', '{}', 'The runs flood when it rains. Raise the floor, then apply again.')`)
check('a fail sends the store back with the summary', (await adm(`select public.admin_complete_inspection('${failId}', false)`)) !== null && await scalar(`select status::text || '|' || status_note from public.stores where id = '${appStore}'`) === 'draft|The runs flood when it rains. Raise the floor, then apply again.')
const cancelId = (await adm(`select public.admin_schedule_inspection('STR-APP', ${when}, '${inspector}') as id`))?.[0]?.id
check('cancelling needs a reason', await adm(`select public.admin_cancel_inspection('${cancelId}', '')`) === null)
check('an admin can cancel a booked inspection', (await adm(`select public.admin_cancel_inspection('${cancelId}', 'Owner asked to move it')`)) !== null && await scalar(`select status::text from public.inspections where id = '${cancelId}'`) === 'cancelled')
check('the inspections table is closed to direct reading', (await as('authenticated', admin, 'select id from public.inspections')) === null)

// Reports: anyone signed in reports a listing, store, review or conversation; admins resolve; messages read only via a report
const ramboNo = 'KD-2026-003'
const rep = await as('authenticated', buyer, `insert into public.reports (kind, target_id, reason, details) values ('dog', '${ramboNo}', 'wrong_info', 'The photos show a different dog.') returning id, status`)
const repId = rep?.[0]?.id
check('anyone signed in can report a listing', rep?.[0]?.status === 'open')
check('the same thing can\'t be reported twice while open', await as('authenticated', buyer, `insert into public.reports (kind, target_id, reason) values ('dog', '${ramboNo}', 'scam')`) === null)
check('visitors can\'t report', await as('anon', null, `insert into public.reports (kind, target_id, reason) values ('dog', '${ramboNo}', 'scam')`) === null)
check('admins are told about each report', (await as('authenticated', admin, `select id from public.notifications where topic = 'report:${repId}'`))?.length === 1)
check('people see only their own reports', (await as('authenticated', other, 'select id from public.reports')).length === 0)
check('you can only report a conversation you\'re in', await as('authenticated', applicant, `insert into public.reports (kind, target_id, reason) values ('conversation', '${convId}', 'abuse')`) === null)
const convRep = (await as('authenticated', buyer, `insert into public.reports (kind, target_id, reason, details) values ('conversation', '${convId}', 'abuse', 'Rude messages') returning id`))?.[0]?.id
const queue = (await adm('select public.admin_reports() as r'))?.[0]?.r
check('admins see reports with what they\'re about', queue?.some(r => r.id === repId && r.target?.label?.includes('Rambo') && r.reporter_email))
check('the reports queue is closed to everyone else', await withCode(inspector, 'aal2', 'select public.admin_reports()') === null)
check('admins can read a reported conversation, and that\'s logged', (await adm(`select public.admin_report_messages('${convRep}') as m`))?.[0]?.m?.length > 0 && (await adm(`select id from public.admin_audit where action = 'report.read_messages' and target_id = '${convId}'`))?.length === 1)
check('resolving needs a note for the reporter', await adm(`select public.admin_resolve_report('${repId}', 'resolved', '')`) === null)
await adm(`select public.admin_resolve_report('${repId}', 'resolved', 'We asked the store to replace the photos.')`)
check('resolving tells the reporter', (await as('authenticated', buyer, `select body from public.notifications where topic = 'report-done:${repId}'`))?.[0]?.body === 'We asked the store to replace the photos.')

// Blocking: a blocked account can read but not write anything; staff can't be blocked
const blockee = await user('Musa Fraud')
check('admins can\'t block staff', await adm(`select public.admin_block_person('${inspector}', 'Testing')`) === null)
check('blocking needs a reason', await adm(`select public.admin_block_person('${blockee}', '')`) === null)
await adm(`select public.admin_block_person('${blockee}', 'Fake listings reported by three buyers')`)
check('a blocked account sees why', (await as('authenticated', blockee, 'select public.my_block() as b'))?.[0]?.b?.reason === 'Fake listings reported by three buyers')
check('a blocked account can still read', (await as('authenticated', blockee, 'select id from public.dogs limit 1'))?.length === 1)
check('a blocked account can\'t message', await as('authenticated', blockee, `insert into public.conversations (store_id) values ('${k9}')`) === null)
check('a blocked account can\'t open a store', await as('authenticated', blockee, `insert into public.stores (public_id, slug, name, city) values ('STR-BLK', 'blk', 'Blocked Dogs', 'Abuja')`) === null)
check('a blocked account can\'t save dogs or upload', await as('authenticated', blockee, `insert into public.shortlist_items (user_id, dog_id) values ('${blockee}', '${rambo}')`) === null && await as('authenticated', blockee, `insert into storage.objects (bucket_id, name) values ('dog-photos', 'x/y.jpg')`) === null)
check('a blocked account can\'t report', await as('authenticated', blockee, `insert into public.reports (kind, target_id, reason) values ('dog', '${ramboNo}', 'scam')`) === null)
check('People shows who is blocked', (await adm(`select public.admin_people('musa fraud') as p`))?.[0]?.p?.[0]?.blocked?.reason?.startsWith('Fake'))
await adm(`select public.admin_unblock_person('${blockee}')`)
check('unblocking lets them write again', (await as('authenticated', blockee, `insert into public.shortlist_items (user_id, dog_id) values ('${blockee}', '${rambo}') returning dog_id`))?.length === 1)
check('blocks and unblocks are in the audit log', (await adm(`select count(*)::int as n from public.admin_audit where action in ('person.block', 'person.unblock') and target_id = '${blockee}'`))?.[0]?.n === 2)

// Detail pages: everything about one store, and one person (admins only; no message text)
const k9Detail = (await adm(`select public.admin_store('STR-001') as d`))?.[0]?.d
check('a store\'s page has its team, dogs, reviews, visits and history', k9Detail?.team?.some(m => m.role === 'owner' && m.email) && k9Detail.dogs.length > 0 && Array.isArray(k9Detail.reviews) && k9Detail.visits && Array.isArray(k9Detail.audit))
const appDetail = (await adm(`select public.admin_store('STR-APP') as d`))?.[0]?.d
check('it includes the application and inspections', !!appDetail?.application?.address && appDetail.inspections.length >= 1 && appDetail.audit.some(a => a.action.startsWith('inspection.')))
check('the store page is for admins only', await withCode(inspector, 'aal2', `select public.admin_store('STR-001')`) === null && await withCode(owner, 'aal2', `select public.admin_store('STR-001')`) === null)
const buyerDetail = (await adm(`select public.admin_person('${buyer}') as d`))?.[0]?.d
check('a person\'s page has their visits, conversations, reviews and reports', buyerDetail?.person?.email === 'tunde@test.ng' && buyerDetail.visits.length > 0 && buyerDetail.conversations.length > 0 && buyerDetail.reports_made.length > 0)
check('it never includes message text', !JSON.stringify(buyerDetail?.conversations ?? []).includes('Is Sarge still available'))
check('the person page shows blocks and admin actions about them', (await adm(`select public.admin_person('${blockee}') as d`))?.[0]?.d?.audit?.some(a => a.action === 'person.block'))
check('the person page is for admins only', await withCode(inspector, 'aal2', `select public.admin_person('${buyer}')`) === null)

// Visit oversight: requests needing a chase, missed ones, how fast stores answer, nudging a store
const staleVisit = (await as('authenticated', buyer, `insert into public.visits (store_id, service, day, slot) values ('${k9}', 'Meet the dogs', current_date + 5, '10:30') returning id`))?.[0]?.id
await db.exec(`update public.visits set created_at = now() - interval '3 days' where id = '${staleVisit}'`)
const oversight = (await adm('select public.admin_visits() as v'))?.[0]?.v
check('admins see visits that need chasing', oversight?.visits?.some(v => v.id === staleVisit && v.needs_chasing && v.buyer_email))
check('and how each store answers', oversight?.stores?.some(s => s.store_id === 'STR-001' && s.requests > 0))
check('visit oversight is for admins only', await withCode(inspector, 'aal2', 'select public.admin_visits()') === null)
await adm(`select public.admin_nudge_visit('${staleVisit}')`)
check('nudging tells the store\'s owner and is logged', (await as('authenticated', owner, `select id from public.notifications where topic = 'visit-nudge:${staleVisit}'`))?.length === 1 && (await adm(`select id from public.admin_audit where action = 'visit.nudge'`))?.length >= 1)
check('an answered visit can\'t be nudged', await adm(`select public.admin_nudge_visit('${doneVisit}')`) === null)

// Re-inspection: a year of verification, extended by passing again; reminders 30 days before
check('verified stores get a year', await scalar(`select (verified_until > current_date + 300)::text from public.stores where public_id = 'STR-001'`) === 'true')
check('a store verified by its inspection got a fresh year', await scalar(`select (verified_until = (now() at time zone 'Africa/Lagos')::date + 365)::text from public.stores where id = '${appStore}'`) === 'true' || await scalar(`select status::text from public.stores where id = '${appStore}'`) !== 'verified')
await db.exec(`update public.stores set verified_until = current_date + 10 where public_id = 'STR-001'`)
const reminded = (await adm('select public.admin_send_reinspection_reminders() as n'))?.[0]?.n
check('stores due within 30 days are reminded', reminded >= 1 && (await as('authenticated', owner, `select title from public.notifications where topic like 'reinspection:${k9}:%'`))?.length === 1)
check('only once per year', (await adm('select public.admin_send_reinspection_reminders() as n'))?.[0]?.n === 0)
check('admins see who is due', (await adm('select public.admin_reinspections() as r'))?.[0]?.r?.[0]?.public_id === 'STR-001')
check('the store\'s people can see their date; others can\'t', !!(await as('authenticated', handler, `select public.my_store_verification('${k9}') as d`))?.[0]?.d && (await as('authenticated', buyer, `select public.my_store_verification('${k9}') as d`))?.[0]?.d === null)
await adm(`select public.admin_set_store_status('STR-001', 'suspended', 'testing')`)
await adm(`select public.admin_set_store_status('STR-001', 'verified', '')`)
check('being verified again starts a fresh year', await scalar(`select (verified_until > current_date + 300)::text from public.stores where public_id = 'STR-001'`) === 'true')
check('re-inspection lists are for admins only', await withCode(inspector, 'aal2', 'select public.admin_reinspections()') === null)

// Announcements: to everyone, stores or buyers, into the bell; optionally a strip on the site for visitors too
const toStores = (await adm(`select public.admin_send_announcement('stores', 'New photo rules', 'From December, every dog needs at least three photos.', '/dashboard/dogs') as n`))?.[0]?.n
check('an announcement to stores reaches store teams only', toStores > 0 && (await as('authenticated', owner, `select title from public.notifications where kind = 'announcement'`))?.[0]?.title === 'New photo rules' && (await as('authenticated', blockee, `select id from public.notifications where kind = 'announcement'`)).length === 0)
check('one to buyers reaches people with no store', (await adm(`select public.admin_send_announcement('buyers', 'Holiday hours', 'Stores answer slower over the holidays.') as n`))?.[0]?.n > 0 && (await as('authenticated', blockee, `select id from public.notifications where kind = 'announcement'`)).length === 1)
check('only admins announce', await withCode(inspector, 'aal2', `select public.admin_send_announcement('everyone', 'Hi there', 'Testing this')`) === null)
check('no site strip unless asked for', (await as('anon', null, 'select public.site_banner() as b'))?.[0]?.b === null)
await adm(`select public.admin_send_announcement('everyone', 'Maintenance on Sunday', 'Dogeash is down from 2 to 3am.', null, now() + interval '2 days')`)
const strip = (await as('anon', null, 'select public.site_banner() as b'))?.[0]?.b
check('a strip shows to visitors until its date', strip?.title === 'Maintenance on Sunday')
await adm(`select public.admin_end_banner('${strip?.id}')`)
check('admins can take the strip down early', (await as('anon', null, 'select public.site_banner() as b'))?.[0]?.b === null)
check('announcements are listed with how many got them', (await adm('select public.admin_announcements() as a'))?.[0]?.a?.length === 3)
check('a bad link is refused', await adm(`select public.admin_send_announcement('everyone', 'Click me', 'Go here now', 'http://evil.example')`) === null)

// Listing review policy: off by default; when on, a store's "go live" lands on "pending review" for Dogeash
const freshDraft = async () => (await as('authenticated', manager, newDog(k9, 'draft')))?.[0]?.id
const goLive = async id => (await as('authenticated', manager, `update public.dogs set status = 'available' where id = '${id}' returning status`))?.[0]?.status
check('with no review rules, a verified store\'s dog goes live', await goLive(await freshDraft()) === 'available')
check('only admins see or change the settings', await withCode(inspector, 'aal2', 'select public.admin_settings()') === null && await withCode(owner, 'aal2', `select public.admin_save_settings('{"review_all_listings":true}')`) === null)
await adm(`select public.admin_save_settings('{"review_high_levels":true}')`)
const strongDog = await freshDraft()
await as('authenticated', manager, `update public.dogs set level = 4 where id = '${strongDog}'`)
check('level 4–5 dogs go to review when that rule is on', await goLive(strongDog) === 'pending_review')
check('admins are told', (await as('authenticated', admin, `select id from public.notifications where topic = 'listing-review:${strongDog}'`))?.length === 1)
check('other levels still go live', await goLive(await freshDraft()) === 'available')
await adm(`select public.admin_set_dog_status('${strongDog}', 'available', '')`)
check('an admin approves it live', await scalar(`select status::text from public.dogs where id = '${strongDog}'`) === 'available')
await adm(`select public.admin_save_settings('{"review_high_levels":false,"review_all_listings":true}')`)
check('with every listing reviewed, any go-live waits', await goLive(await freshDraft()) === 'pending_review')
await adm(`select public.admin_save_settings('{"review_all_listings":false,"review_first_listings":true}')`)
check('a store with three listings already isn\'t held back by "first three"', await goLive(await freshDraft()) === 'available')
check('settings changes are in the audit log', (await adm(`select count(*)::int as n from public.admin_audit where action = 'settings.save'`))?.[0]?.n === 3)
await adm(`select public.admin_save_settings('{"review_first_listings":false}')`)

// Longer history: day-by-day figures for 7 to 730 days
check('admins get a year of daily figures (two, to compare)', (await adm('select public.admin_history(730) as h'))?.[0]?.h?.length === 730)
check('the range is kept between 7 and 730 days', (await adm('select public.admin_history(5000) as h'))?.[0]?.h?.length === 730 && (await adm('select public.admin_history(1) as h'))?.[0]?.h?.length === 7)
check('the long history is for admins only', await withCode(inspector, 'aal2', 'select public.admin_history(90)') === null)

// Search across everything: stores, dogs, people, care providers (admins only)
const found = (await adm(`select public.admin_search('guardian') as r`))?.[0]?.r
check('search finds stores by name', found?.stores?.some(x => x.id === 'STR-001'))
check('search finds dogs by file number', (await adm(`select public.admin_search('KD-2026-003') as r`))?.[0]?.r?.dogs?.[0]?.title === 'Rambo')
check('search finds people by email', (await adm(`select public.admin_search('tunde@test') as r`))?.[0]?.r?.people?.length === 1)
check('search finds care providers', (await adm(`select public.admin_search('kuje vet') as r`))?.[0]?.r?.care?.length === 1)
check('one letter finds nothing (too broad)', (await adm(`select public.admin_search('a') as r`))?.[0]?.r?.stores?.length === 0)
check('search is for admins only', await withCode(inspector, 'aal2', `select public.admin_search('rambo')`) === null)

// Applications list stores in review even without a form (so the sidebar count and the page agree)
const appsNow = (await adm('select public.admin_applications() as a'))?.[0]?.a
check('a store in review without a form is listed, marked as such', appsNow?.some(a => a.public_id === 'STR-006' && a.has_form === false && Array.isArray(a.preferred_days)))

// My dogs: owners only, records only on your own dogs, photos in your own folder
const rex = (await as('authenticated', buyer, `insert into public.owned_dogs (name, breed, sex) values ('Rex', 'Boerboel', 'Male') returning id, owner_id`))?.[0]
check('a buyer can add a dog they own (owner is always them)', rex?.owner_id === buyer)
check('nobody else can see that dog', (await as('authenticated', other, `select id from public.owned_dogs where id = '${rex?.id}'`))?.length === 0)
check('visitors can\'t read owned dogs', await as('anon', null, 'select * from public.owned_dogs') === null)
check('nobody else can change that dog', (await as('authenticated', other, `update public.owned_dogs set name = 'Mine' where id = '${rex?.id}' returning id`))?.length === 0)
check('the owner adds a vaccination with a due date', (await as('authenticated', buyer, `insert into public.owned_dog_records (owned_dog_id, kind, title, done_on, due_on) values ('${rex?.id}', 'vaccination', 'Rabies', current_date - 30, current_date + 335) returning id`))?.length === 1)
check('nobody can add a record to someone else\'s dog', await as('authenticated', other, `insert into public.owned_dog_records (owned_dog_id, kind, title, due_on) values ('${rex?.id}', 'reminder', 'Walk', current_date)`) === null)
check('a record needs a date', await as('authenticated', buyer, `insert into public.owned_dog_records (owned_dog_id, kind, title) values ('${rex?.id}', 'reminder', 'Walk')`) === null)
check('a photo path in someone else\'s folder is refused', await as('authenticated', buyer, `update public.owned_dogs set photo_path = '${other}/x.jpg' where id = '${rex?.id}'`) === null)
check('the owned-dog-photos bucket is private', await scalar(`select public::text from storage.buckets where id = 'owned-dog-photos'`) === 'false')
check('an owner uploads into their own folder', (await as('authenticated', buyer, `insert into storage.objects (bucket_id, name) values ('owned-dog-photos', '${buyer}/rex.jpg') returning id`))?.length === 1)
check('nobody uploads into someone else\'s folder', await as('authenticated', other, `insert into storage.objects (bucket_id, name) values ('owned-dog-photos', '${buyer}/fake.jpg')`) === null)
check('nobody else sees an owner\'s dog photos', (await as('authenticated', other, `select id from storage.objects where bucket_id = 'owned-dog-photos'`))?.length === 0)
check('deleting a dog removes its record', (await as('authenticated', buyer, `delete from public.owned_dogs where id = '${rex?.id}' returning id`))?.length === 1 && await scalar(`select count(*)::int from public.owned_dog_records where owned_dog_id = '${rex?.id}'`) === 0)

// Shortlist: the price when saved is kept, whatever the buyer sends
const freshDog = await scalar(`select id from public.dogs where id <> '${rambo}' and status = 'available' limit 1`)
await as('authenticated', other, `insert into public.shortlist_items (user_id, dog_id) values ('${other}', '${freshDog}')`)
check('shortlisting keeps the price at the time', await scalar(`select (s.saved_price = d.price_naira)::text from public.shortlist_items s join public.dogs d on d.id = s.dog_id where s.user_id = '${other}' and s.dog_id = '${freshDog}'`) === 'true')

// Garbled text (UTF-8 read as Mac Roman on the way into the SQL Editor) is repaired, data and code alike
await db.exec(`update public.stores set tagline = 'Mon‚ÄìSat ¬∑ from ‚Ç¶2m' where public_id = 'STR-002'`)
await db.exec(`create or replace function public.garbled_sample() returns text language sql as $$ select 'Price ¬∑ ‚Ç¶1' $$`)
await db.exec(readFileSync(join(root, 'supabase/migrations/20261130000000_fix_garbled_text.sql'), 'utf8'))
check('garbled store text is repaired', await scalar(`select tagline from public.stores where public_id = 'STR-002'`) === 'Mon–Sat · from ₦2m')
check('garbled function code is repaired', await scalar(`select public.garbled_sample()`) === 'Price · ₦1')
check('ordinary text is left alone', await scalar(`select public.fix_garbled_text('Kuje, Abuja – 2014 · ₦2m')`) === 'Kuje, Abuja – 2014 · ₦2m')
check('visitors can\'t call the repair function', await as('anon', null, `select public.fix_garbled_text('x')`) === null)

await db.close()
console.log(failed ? `\n${failed} failed` : '\nAll access rules hold')
process.exit(failed ? 1 : 0)
