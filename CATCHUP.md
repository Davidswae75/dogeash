# Catch-up log

What was built, in order, from 3 Nov 2026 on. Newest at the bottom. Each entry says what changed, where, and anything you need to do.

---

## 1. Store dashboard: Dogs

**What it does:** stores add, edit, publish and retire their own dogs from the dashboard, with a photo. Everything is saved in Supabase.

**Status:** migration run on 4 Nov and checked live: the `dog-photos` bucket and the photo-folder function exist, and the 18 dogs still load.

**Database** (the migration above):
- Dogeash gives every new dog its file number: `KD-2026-100`, `KD-2026-101`, and so on. Stores can't type or pick one.
- The "inspected" line of a dog's K9 file belongs to Dogeash. A store can't add or change it; editing a dog keeps it.
- Limits match the form: name 1–40 characters, weight up to 120 kg, price up to ₦1bn.
- New public storage bucket `dog-photos`. Each store can upload only into its own folder; anyone can view the photos.
- Unchanged rules:
  - new dogs start as drafts
  - a dog goes live only when the store is verified
  - only owners and managers can delete a draft
  - handlers can edit and change status
- `npm run db:test` gained 15 checks: file numbers, the inspection line, publishing, selling, photo folders. All pass.

**Pages** (store dashboard):
- `/dashboard/dogs`:
  - every dog of the store, with filters for All, Live, Drafts, and Sold and withdrawn
  - each row's ⋯ menu: Edit, View listing, then Go live, Mark reserved, Mark sold, Withdraw or Back to available (depending on the status), and Delete draft
  - deleting asks first
- `/dashboard/dogs/new`: the add form. "Save and go live" appears for verified stores; "Save as draft" is always there. You see the new file number in the toast.
- `/dashboard/dogs/<file number>`: edit. The status and ⋯ actions sit at the top, and Dogeash's inspection line is shown read-only.
- **The form** has these sections:
  - The dog: photo, name, breed, sex, age, born, weight, city
  - Protection: level 1–5, what it suits, safe with children, up to 6 traits
  - Health: hip grade, hips/elbows in full, vaccinations, microchip
  - Training: titles, sire, dam
  - The listing: summary, best suited to, price
- **Photos:** one per dog for now. JPG, PNG or WebP, up to 5 MB. A photo uploads as soon as it's picked and is required before going live. Replacing a photo deletes the old file.
- **Elsewhere on the dashboard:**
  - the top bar's "Add a dog" opens the form
  - the overview's "Your dogs" panel shows the real dogs with their status and links to editing

**Code:**
- `app/utils/dogForm.ts`: the form's rules (zod), its text fields, conversion to and from database columns.
- `app/utils/dogs.ts`:
  - `StoreDog` (a dog with any status), `toStoreDog` and `toDog` (database row → dog), `dogPhotoUrl`
  - `listingStatusLabels`, `listingActions` (what can happen next for each status)
- `app/composables/useStoreDogs.ts`: load, upload a photo, create, update, change status, delete drafts, with toasts.
- New components:
  - `FieldShell.vue`, `ListingStatusChip.vue`
  - `dashboard/DashboardDogForm.vue`, `DashboardDogPhoto.vue`, `DashboardDogTable.vue`, `DashboardDogActions.vue`
- `useNotify`: `dogUpdated` and `failed` toasts.

## 2. The public site reads stores and dogs from Supabase

**What it does:** Home, Find a guard dog, dog pages, Stores, store pages, protection levels, shortlists and the sign-in panel now show what's in the database: verified stores and their live (available or reserved) dogs. A dog a store puts live shows up for buyers on the next page load; a withdrawn or sold dog disappears.

**How:**
- `app/plugins/00.catalog.ts` loads the catalogue once per page load on the server and passes it to the browser with the page.
- It asks only for verified stores and available or reserved dogs, explicitly, because the catalogue is shared by every visitor. A store member's own drafts can't leak into it.
- If Supabase can't be reached, the site falls back to the sample dogs and stores, so it still browses.
- The sample data in `app/utils/dogs.ts` and `stores.ts` is kept: it's the fallback, and `scripts/generate-seed.mjs` builds the seed from it.
- Code: `listedDogs` and `listedStores` replace direct use of `sampleDogs` and `sampleStores`; `marketCities` is now a function. The existing helpers (`findDog`, `getStore`, `findStore`, `storeSummary`, `marketRows`) work as before.
- Seeded dogs keep using the photos bundled with the site (`dogs/…jpg`); uploads come from the bucket.

**Checked:** all public pages return 200 and show the 18 seeded dogs from the database. The signed-in dashboard flows weren't tested in the browser (I don't sign in as you).

## 3. Store dashboard: Bookings, and a real overview

**What it does:** stores see and answer kennel visit requests on their own page, and the dashboard overview now shows real numbers instead of examples.

**You need to do:** nothing. No database change.

**`/dashboard/bookings`** (was a "Coming next" page):
- **Waiting for your answer:** visit requests from today on, each with a note box and Confirm / Decline.
- **Coming up:** confirmed visits, each with Mark as done / Can't make it. A confirmed visit stays here after its day until you mark it done.
- **Earlier:** done, declined, cancelled, and requests whose day passed unanswered.
- Deciding here is the same as deciding in the inbox; the buyer sees it in their visits.
- Owners, managers and handlers all see and answer visits (every role has the bookings permission).

**Overview (`/dashboard`):**
- **Greeting:** today's real date. Chips: unread messages, visit requests to answer, visits today. Each chip only shows if your role can act on it. The "deposit in escrow" chip is gone until reservations exist.
- **Needs your attention:** built from real data:
  - messages waiting for a reply (links to the oldest)
  - visit requests to answer (shows the soonest)
  - drafts not live yet
  - "All caught up" when there's nothing.
  The sample items (booster due, store banner, escrow deposit) are gone.
- **Coming up** (the dark card): real visits from today on, grouped by day, "Today" highlighted, requests marked "Needs your answer". Empty message when nothing is booked.
- Still examples: the four stat tiles at the top (store views, etc.), the per-dog view counts, and the store health checklist. They need tracking that doesn't exist yet.

**Code:**
- `app/composables/useStoreInbox.ts`: adds `waiting`, `confirmed`, `earlier`, `today`, `upcoming`, `unreadMessages` and `decideVisit(visit, status, note)`. The dashboard layout already loads it on every dashboard page.
- `app/pages/dashboard/bookings.vue`: new page. Reuses `DashboardInboxVisit` (the inbox's visit panel) and `VisitCard`.
- `app/utils/dashboard.ts`: `attentionItems()` builds the attention list. Removed `dashboardAttention`, `dashboardToday`, `dashboardUpcoming`, and the "Coming next" text for Enquiries and Bookings (enquiries live in the Inbox).
- `DashboardAgenda.vue`, `DashboardGreeting.vue`, `DashboardAttention.vue`: switched to real data.

## 4. Real notifications in the bell

**What it does:** the bell in the site header (signed-in buyers) shows real notifications instead of four samples.

**Status:** migration run on 4 Nov and checked live: the table and function exist, and visitors are refused.

**What creates a notification** (the database does it, so it works whoever made the change and from any device):
- A store replies in a conversation → "New message from <store>", with the text. Opens that conversation.
- A store confirms or declines a visit (including "Can't make it") → "Kennel visit confirmed / declined", with the day, time and the store's note. Opens My visits.
- A dog on your shortlist:
  - is reserved → "<dog> was reserved"
  - is sold → "<dog> was sold"
  - goes from reserved back to available → "<dog> is available again"
  - drops in price → "Price drop on <dog>: now ₦…, down from ₦…"
  Opens the dog's page. Price rises don't notify.

**No pile-ups:** repeats about the same thing update the one unread notification. Five replies in a conversation are one "New message" with the latest text. Once you've read it, the next reply makes a new one.

**Read and unread:**
- Clicking a notification marks it read. "Mark all read" at the top.
- Opening a conversation in My messages marks its message notification read automatically.
- The bell checks for new ones when you open it, and every minute while the page is visible.

**Safety:** you only see your own notifications. Nobody can write or edit one directly; only the database's own triggers write them. You can only mark yours read or delete them.

**Not done yet:**
- Notifications for store members (new buyer messages, visit requests). The store dashboard already shows these through the inbox and its counts.
- Email, SMS and WhatsApp copies of notifications.
- The bell is hidden on phone widths (as before).

**Code:**
- `supabase/migrations/20261106000000_notifications.sql`: the `notifications` table, the triggers, the access rules.
- `npm run db:test`: 13 new checks (replies, visits, reserved, back on sale, price drop, no pile-ups, privacy). All pass.
- `app/composables/useNotifications.ts`: load, mark read, mark all read. Loaded with the account in `app/plugins/account.ts`.
- `app/components/account/AccountNotifications.vue`: the bell, now with an empty state and times like "5 min".
- `app/types/database.types.ts`: the new table and kind list.
- Removed `sampleNotifications` from `app/utils/account.ts`.

## 5. Store dashboard: Store profile

**What it does:** owners and managers edit what buyers read on their public store page, at `/dashboard/profile` (was a "Coming next" page).

**Status:** migration run on 4 Nov. To double-check the protection is in place, run `select tgname from pg_trigger where tgname = 'stores_protect_details';` in the SQL Editor; it should return one row.

**Security fix (important):** a store's `details` holds both what the store writes and Dogeash's own records: the inspection result, review samples, dogs placed and reply time. Until now, any owner or manager could have rewritten their own inspection or reviews through the database. The migration stops that:
- On edit, those parts are put back as they were, whatever is sent.
- A new store can't start with an inspection or reviews.
- Dogeash (the SQL Editor) can still set them.
- Also adds limits: name up to 80 characters, tagline 140, city, area and state 60 each, founded 1900–2100.

**The form** has these sections:
- Your store: name, tagline, city, area, state, year founded.
- About the kennel: about text, what you offer (handover, delivery, boarding, puppies, imports, training), opening hours, where you deliver.
- Who runs it: name, role, years with dogs, short bio, up to 6 credentials.
- History: up to 12 moments (year and what happened). You can add and remove them, and they show oldest first.
- Save changes (greyed out until something changes). Verified stores also get "View your store page".

**Also on the page:** the inspection, rating and review count, read-only. Handlers see "Store profile isn't part of your role" instead of the form.

**After saving:** the dashboard and the public store page in that tab update straight away. Everyone else sees it on their next page load.

**Overview:** the "Store health" checklist is now real. It checks:
- about and history
- owner profile
- what you offer
- hours and delivery
- care team
Each missing item links to the section that fixes it. The "store banner and logo" item is gone, since there's no banner upload yet.

**Not done yet:**
- Banner and logo upload.
- Changing the store's web address (slug); it stays as it was when the store opened.

**Code:**
- `app/utils/storeForm.ts`: the form's rules (zod), its text fields, conversion to database columns.
- `app/composables/useStoreProfile.ts`: save, then refresh the session and the public catalogue in this tab.
- `app/components/dashboard/DashboardStoreForm.vue`: the form.
- `app/pages/dashboard/profile.vue`: the page.
- `app/components/dashboard/DashboardNoAccess.vue`: the "not part of your role" panel, now shared with the "Coming next" sections. Its wording is now accurate for managers too; it used to say "is for the owner".
- `useNotify`: `storeUpdated` toast.
- `utils/dashboard.ts`: `profileChecklist(store)` replaces the sample checklist.
- `npm run db:test`: 8 new checks. All pass.

## 6. Store dashboard: Team

**What it does:** owners invite people to their store by email with a role, change roles and remove people, at `/dashboard/team` (was a "Coming next" page). The person invited joins from their own account.

**Status:** migration run on 4 Nov and checked live: the table and its three functions exist, and visitors are refused.

**How inviting works (no email is sent yet):**
1. The owner enters an email and picks a role (Owner, Manager or Handler). The form explains what each role opens.
2. If an account with that email exists, that person gets a bell notification.
3. They see a "Join <store>" card at the top of their account overview (`/account`), with Join the team and Decline.
4. If they don't have an account yet, the invitation waits. They sign up with that email and the card is there.
5. On joining they become a member with that role, the store appears in their account menu, and the invitation is used up.

The owner should tell the person to sign in or sign up with that email; Dogeash doesn't email them yet.

**The Team page:**
- Your team: everyone on it, owners first, with name, role and when they joined. Owners also see each person's email.
- Owners can:
  - change anyone's role from a dropdown
  - remove people (it asks first)
  - see invitations waiting, and withdraw them
- Anyone on the team can open the page to see it, and can leave the store (it asks first). The sidebar link shows only for owners, as before.
- A store always keeps at least one owner. Demoting or removing the last owner is refused with a clear message.

**Rules the database enforces:**
- Only owners invite or withdraw invitations.
- You can't invite someone already on the team, or the same email twice.
- Badly typed emails are refused.
- Each store can have at most 20 invitations waiting.
- Only the person whose account email matches can see, accept or decline an invitation.
- Teammates see each other's names, but only owners see emails. Outsiders see nothing.

**Code:**
- `supabase/migrations/20261108000000_store_team.sql`: `store_invites` table, `store_team()`, `my_store_invites()`, `accept_store_invite()`, the invite notification, a new "team" notification kind.
- `npm run db:test`: 17 new checks. All pass. The test setup's fake users now have emails.
- `app/composables/useStoreTeam.ts`: the team for the dashboard (load, invite, withdraw, change role, remove or leave).
- `app/composables/useStoreInvites.ts`: invitations for the signed-in person (load, join, decline). Loaded with the account.
- New components:
  - `dashboard/DashboardTeamList.vue`, `dashboard/DashboardTeamInvite.vue`
  - `account/AccountStoreInvites.vue`
- `app/pages/dashboard/team.vue`: the page.
- `useStoreContext` now has `storeUuid()`, the store's database id, shared with the Dogs code (which had its own copy).
- `storeRoles` gained a one-line description per role. `useNotify` gained a `teamUpdated` toast. The bell gained a team icon.

**Not done yet:**
- Sending the invitation by email or SMS.
- A store switcher for people on several stores' teams (the dashboard shows their first store).

## 7. Store banner and logo

**What it does:** owners and managers upload a banner and a logo on `/dashboard/profile`. Buyers see them everywhere the store appears.

**You need to do:** nothing. `supabase/migrations/20261109000000_store_media.sql` is already live (checked 4 Nov: the bucket, the function and both columns exist).

**On the profile page:** a new "Banner and logo" panel above the form.
- Each image previews the way buyers see it, with Add / Change and Remove.
- An image saves as soon as you pick it; there's no need to press Save. Removing goes back to the initials.
- JPG, PNG or WebP, up to 5 MB. Replacing an image deletes the old file.

**Where buyers see them:**
- The banner replaces the initials artwork on the store page and store tiles. The file line and patrol route stay on top, with a dark fade so they read on any photo.
- The logo replaces the initials on store cards, the store page, the shortlist, the account's store card and the dashboard sidebar.
- Not yet in Messages, which still shows initials (conversations only carry the initials).

**Rules the database enforces:**
- Images go in the new public `store-media` bucket, in the store's own folder.
- Only that store's owners and managers can upload, replace or remove them. Handlers and outsiders can't.
- A store can only point its banner or logo at its own folder.

**Overview:** the Store health checklist gained "Banner and logo".

**Code:**
- `app/utils/imageUpload.ts`: shared image checks (type, 5 MB) and file naming. Dog photos use it too now; they had their own copy.
- `app/composables/useStoreProfile.ts`: `setImage(kind, file | null)`, which uploads, saves, deletes the old file and refreshes this tab.
- `app/components/dashboard/DashboardStoreImages.vue`: the panel.
- `StoreBanner.vue` and `StoreAvatar.vue`: show the uploaded images.
- `app/utils/stores.ts`: `Store` gained `banner`, `logo` (URLs) and their paths, and `storeMediaUrl()`. `toStore()` takes the Supabase URL to build them.
- `npm run db:test`: 7 new checks. All pass.

## 8. Reviews

**What it does:** buyers review a store after a kennel visit there, store owners and managers reply, and the store's rating comes from real reviews.

**Status:** migration run on 4 Nov and checked live: visitors can read reviews but not who wrote them (account ids are hidden), and sample stores keep their figures.

**Who can review:** a buyer whose kennel visit at that store was marked **done** by the store. Purchases and handovers don't exist yet, so this is the rule for now. Store pages used to say "after a completed handover"; that now says "buyers who have visited the kennel".
- One review per buyer per store.
- The buyer can edit or delete it any time.
- A review needs 1–5 stars and 20–1,000 characters.
- The buyer's name and city are copied in when they write it; stores never see buyer profiles.

**Where buyers write it:**
- **My visits (`/account/bookings`):** visits marked done get a "Review <store>" button.
- **The store page:** a "You visited this kennel. How did it go?" strip with "Write a review" (or "Edit your review"). It isn't shown on your own store.
- **The dialog:** stars with a word ("Excellent"), the review text, and "Delete review" (it asks first) when editing.

**On the store page:** real reviews, newest first, with the store's reply under each. A store with no real reviews keeps showing its sample reviews.

**Store dashboard: new "Reviews" page (`/dashboard/reviews`)**, in the sidebar for owners and managers:
- The average, the number of reviews, and how many have no reply.
- Each review has Reply (or Edit reply / Remove reply). Replies are public.
- A store can't change or remove a buyer's review, or its stars.

**Rating:** the store's rating and review count are recalculated from real reviews whenever one is added, edited or deleted. Sample stores keep their sample figures (like 4.9 from 84) until their first real review; then the figures switch to real ones. Stores can't set their rating themselves.

**Notifications (bell):**
- A new review → the store's owners and managers.
- A reply → the buyer who wrote the review. It opens the store page's reviews.

**Not done yet:**
- Reporting an unfair review to Dogeash. For now, delete it in the SQL Editor if needed.
- Reviews after a purchase or handover, once those exist.
- Reviews of care providers.

**Code:**
- `supabase/migrations/20261110000000_store_reviews.sql`: the `store_reviews` table, the rules, the rating update, notifications, a new "review" notification kind.
- `npm run db:test`: 18 new checks. All pass.
- `app/utils/reviews.ts`: the `Review` shape, the form rules, sample reviews in the same shape.
- `app/composables/useStoreReviews.ts`: load, write or edit, delete, reply, and who can review.
- New components:
  - `review/ReviewStars.vue`, `review/ReviewCard.vue`, `review/ReviewDialog.vue`
  - `dashboard/DashboardReviewReply.vue`
- `app/pages/dashboard/reviews.vue`: new. Edited: the store page, `account/bookings.vue`, the dashboard sidebar, the bell's icons, `useNotify` (`reviewSaved`).

## 9. Care team, and the care directory in the database

**What it does:** the care directory (vets, trainers, groomers, kennel builders, equipment, boarding) now comes from Supabase. Stores manage their own care team at `/dashboard/care` (was a "Coming next" page).

**Status:** migration run on 4 Nov and checked live:
- 9 providers in the directory.
- 11 care links across the 5 stores, matching their old lists exactly.
- The old `care` lists are gone from `details`.
- Visitors can't write links.
- The site reads all of it from the database, not the samples.

**The migration:**
- Creates the `care_providers` table and adds the 9 sample providers to it.
- Creates `store_care_links` (which store works with which provider, and "what they do for us").
- Moves each store's existing care team out of `details` into links, then removes the old `care` list from `details`. Links that point at an unknown provider are skipped.

**Rules:**
- Anyone can read the directory. Only Dogeash (the SQL Editor) adds or edits providers; there are no provider accounts yet.
- Anyone can see a verified store's care team.
- Only that store's owners and managers can add, rename or remove providers on it. Handlers and outsiders can't.
- Up to 12 providers per store. "What they do" must be 1–60 characters.

**The Care team page:**
- **Your care team:** each provider with type, person, city and a "Checked by Dogeash" mark. Their "what they do for you" line can be edited. Remove asks first; the provider stays in the directory.
- **Add from the directory:**
  - search by name, filter by type, and "Only in <your city>" (on by default)
  - checked providers come first
  - "Add" suggests a line by type ("Our vet", "Our handover trainer") that you can change before adding
- Handlers see "Care team isn't part of your role".
- The store page, the provider pages ("Stores that work with them") and the overview's Store health checklist all use the real links.

**Also fixed:** `npm run db:seed` (the seed generator) had been broken since the dog photo change earlier this week. It now works again, and also writes the care providers and links. `supabase/seed.sql` is regenerated; the dog rows are unchanged.

**Not done yet:**
- Provider accounts, so providers can join and edit their own listing.
- "Invite a provider to join Dogeash".
- Booking a provider from a store's page through to an appointment.

**Code:**
- `supabase/migrations/20261111000000_care_providers.sql`, and `npm run db:test` with 12 new checks. One of them reruns the migration's move on a store that still has the old list. All pass.
- `app/utils/care.ts`: `listedProviders` (loaded per page), `toCareProvider`, and a suggested line per type.
- `app/plugins/00.catalog.ts`: also loads the directory. `app/utils/stores.ts`: a store's care team now comes from its links.
- `app/composables/useStoreCare.ts`: add, rename, remove. `useStoreProfile` gained `reload()`.
- New components: `dashboard/DashboardCareMember.vue`, `dashboard/DashboardCareFinder.vue`. New page: `app/pages/dashboard/care.vue`.
- The profile form no longer writes the care team into `details`.
- `scripts/generate-seed.mjs`: fixed, and now includes providers and links.

## 10. Store settings: kennel visit times, pausing, closing

**What it does:** store owners choose when they take kennel visits, can pause visit requests, and can delete a draft store, at `/dashboard/settings` (was a "Coming next" page).

**You need to do (soon):** run `supabase/migrations/20261112000000_store_visit_settings.sql` in the Supabase SQL Editor (it's on your clipboard). Until you do:
- the public site shows sample data
- store dashboards won't load their store
The site now asks for the new columns, which only exist after the migration.

**Kennel visits** (before this, every store offered the same fixed days and times):
- **Days you take visits:** any of Mon–Sun. Existing stores start on Mon–Sat, as before.
- **Times:** pick up to 12 half-hours between 7:00 and 18:00. Existing stores start on 9:00, 10:30, 12:00, 14:00 and 15:30, as before.
- **Also visit buyers at home:** when on, buyers can choose "At my home" in the booking dialog. Off by default.
- The "Book a kennel visit" dialog on store and dog pages offers exactly these days (the next six open days) and times.
- The database refuses requests on other days, at other times, or at home when the store doesn't offer home visits. Buyers get a plain message for each.

**Pause visit requests:**
- Turns "Book a kennel visit" into a greyed-out "Visits paused" button, with an optional note like "Back on 1 December".
- The store and its dogs stay listed, and buyers can still message.
- Visits already booked aren't affected.
- The database refuses new requests while paused.

**Close your store:**
- A store still in draft can be deleted here, after asking. Its dogs have to be deleted first.
- A store buyers have seen is closed through Dogeash; the page says so.

**Who:**
- The Settings page is for owners.
- The database lets owners and managers change visit settings, as with the rest of the store profile. Handlers can't.

**Also fixed:** the booking dialog worked out day dates in UTC. Just after midnight in Lagos that gave yesterday's date for the chosen weekday, which the new day rule would have refused. It now uses the local date.

**Not done yet:**
- Blocking out single dates (holidays).
- Different times on different days.
- Notification choices for the store (no email or SMS sending exists yet).

**Code:**
- `supabase/migrations/20261112000000_store_visit_settings.sql`: new store columns, limits, and the rule on new visits.
- `npm run db:test`: 10 new checks. All pass. The test store now takes visits every day, so the older visit tests don't depend on what day it is.
- `app/utils/storeSettings.ts`: the form's rules, time choices, weekday labels.
- `app/utils/stores.ts`: `VisitSettings`, `visitSettings(store)` with the old defaults for sample stores, `Store.status`.
- `app/composables/useStoreProfile.ts`: `saveVisits()` and `deleteDraft()`. `useVisits`: plain messages for each refusal.
- `BookingDialog.vue` takes `weekdays` and `slots`. `KennelVisitDialog.vue` passes the store's settings, or shows "Visits paused".
- New components: `dashboard/DashboardVisitSettings.vue`, `dashboard/DashboardCloseStore.vue`. New page: `app/pages/dashboard/settings.vue`.
