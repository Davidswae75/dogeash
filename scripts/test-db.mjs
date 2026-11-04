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
  create table auth.users (id uuid primary key default gen_random_uuid(), email text, raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text references storage.buckets, name text, owner uuid default auth.uid());
  alter table storage.objects enable row level security;
  grant select, insert, update, delete on storage.objects to authenticated;
  grant usage on schema storage to anon, authenticated;
  grant usage on schema auth, public to anon, authenticated, service_role;
  grant execute on function auth.uid() to anon, authenticated;
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

// Messages and visits
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

await db.close()
console.log(failed ? `\n${failed} failed` : '\nAll access rules hold')
process.exit(failed ? 1 : 0)
