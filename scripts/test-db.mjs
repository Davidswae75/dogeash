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
  create table auth.users (id uuid primary key default gen_random_uuid(), raw_user_meta_data jsonb default '{}');
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('test.uid', true), '')::uuid $$;
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
const user = async (name) => (await db.query(`insert into auth.users (raw_user_meta_data) values ('{"full_name":"${name}"}') returning id`)).rows[0].id
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
const newDog = (store, no, status) => `insert into public.dogs (file_no, store_id, name, breed, sex, city, age, weight_kg, level, price_naira, status) values ('${no}', '${store}', 'Test', 'Boerboel', 'Male', 'Abuja', '2 years', 50, 3, 100, '${status}') returning id`
check('a draft store can add a draft dog', (await as('authenticated', buyer, newDog(draft, 'T-1', 'draft')))?.length === 1)
check('a new dog can\'t skip straight to available', await as('authenticated', buyer, newDog(draft, 'T-2', 'available')) === null)
check('an unverified store can\'t list a dog', await as('authenticated', buyer, `update public.dogs set status = 'available' where file_no = 'T-1'`) === null)
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

await db.close()
console.log(failed ? `\n${failed} failed` : '\nAll access rules hold')
process.exit(failed ? 1 : 0)
