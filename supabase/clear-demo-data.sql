-- CLEAR THE DEMO DATA from a live Dogeash database (run by hand in the SQL Editor; not a migration).
-- It removes only what supabase/seed.sql put there: stores STR-001 to STR-006, their dogs, and care providers
-- CARE-01 to CARE-09. Real stores, dogs and providers you've added since are not touched.
--
-- Deleting a demo store also deletes everything attached to it: its dogs, team members, visits, conversations,
-- reviews, inspections and applications. Test reservations, payments, refunds and payouts on demo dogs are
-- deleted too (the database won't remove a dog that still has them). Deleting a demo care provider also deletes
-- its bookings, team members, invites, waiting list and dog care-team links. Buyers' own dogs that came from a
-- demo store keep their records; only the link to the store is cleared.
--
-- STEP 1: run this part on its own, and read the numbers.
select
  (select count(*) from public.stores where public_id between 'STR-001' and 'STR-006') as demo_stores,
  (select count(*) from public.dogs d join public.stores s on s.id = d.store_id where s.public_id between 'STR-001' and 'STR-006') as demo_dogs,
  (select count(*) from public.store_members m join public.stores s on s.id = m.store_id where s.public_id between 'STR-001' and 'STR-006') as people_on_demo_store_teams,
  (select count(*) from public.reservations r join public.stores s on s.id = r.store_id where s.public_id between 'STR-001' and 'STR-006') as reservations_on_demo_stores,
  (select count(*) from public.visits v join public.stores s on s.id = v.store_id where s.public_id between 'STR-001' and 'STR-006') as visits_to_demo_stores,
  (select count(*) from public.care_providers where public_id between 'CARE-01' and 'CARE-09') as demo_care_providers,
  (select count(*) from public.care_bookings b join public.care_providers p on p.id = b.provider_id where p.public_id between 'CARE-01' and 'CARE-09') as bookings_with_demo_providers,
  (select count(*) from public.care_provider_members m join public.care_providers p on p.id = m.provider_id where p.public_id between 'CARE-01' and 'CARE-09') as people_managing_demo_providers;

-- If "people_on_demo_store_teams" or "people_managing_demo_providers" includes your own account (because you've
-- been testing as a demo store or provider), you'll lose that membership: create your real store or provider first.

-- STEP 2: when the numbers look right, run everything from BEGIN to COMMIT together.
begin;

create temporary table demo_reservations on commit drop as
  select r.id from public.reservations r join public.stores s on s.id = r.store_id where s.public_id between 'STR-001' and 'STR-006';

delete from public.payouts where reservation_id in (select id from demo_reservations);
delete from public.refunds where reservation_id in (select id from demo_reservations);
delete from public.payments where reservation_id in (select id from demo_reservations);
delete from public.reservations where id in (select id from demo_reservations);

delete from public.dogs where store_id in (select id from public.stores where public_id between 'STR-001' and 'STR-006');
delete from public.stores where public_id between 'STR-001' and 'STR-006';
delete from public.care_providers where public_id between 'CARE-01' and 'CARE-09';

commit;

-- Afterwards the site shows only real stores, dogs and providers. Uploaded demo photos aren't stored in Supabase
-- (the demo dogs use photos bundled with the site), so there's nothing to clean up in Storage.
