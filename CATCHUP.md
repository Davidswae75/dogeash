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

**Status:** migration run on 4 Nov and checked live: every store has Mon–Sat and the five old times, no home visits and not paused. The site reads the settings from the database.

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

## 11. Store profile in steps

**What it does:** `/dashboard/profile` is now a step-by-step flow instead of one long form. You asked for this on 4 Nov.

**You need to do:** nothing. No database change.

**The steps:**
1. Your store: name, tagline, city, area, state, founded
2. About the kennel: about, what you offer, hours, delivery
3. Who runs it: name, role, years, bio, credentials
4. History (optional)
5. Banner and logo (optional)
6. Review: each step with what's saved, a done or not-done mark, and Edit

Each step has a short line on why buyers need it.

**Setting up** (while steps 1–3 aren't complete, as for a new store):
- Opens on the first unfinished step and goes in order. Steps ahead are locked until you reach them.
- Buttons: Back, "Save and continue" ("Continue" when nothing changed), "Skip for now" on the optional steps, and Finish on the review.
- Each step is checked on its own rules when you leave it, and saved there and then. Someone who stops at step 4 comes back with steps 1–3 kept.

**Editing** (once the essentials are done, as for the sample stores):
- Any step opens directly, in any order.
- "Save changes" saves just that step. Moving to another step also saves the open one first, so edits aren't lost.

**Layout:**
- **Laptops:** the steps run down the left (numbers, ticks for done steps, a line joining them); the open step sits on the right.
- **Phones:** "Step 2 of 6" with a progress bar. When editing, buttons to jump to any step.

**Also fixed:** the review card put a `<figcaption>` inside a `<div>`, which HTML doesn't allow and which can cause hydration errors.

**Not done yet:** the store application steps (documents, "Send for review"). They'll join this flow as part of the admin work.

**Code:**
- `app/utils/storeForm.ts`: `storeSteps` (titles, hints, why, fields), `storeStepSchema(key)` (the form's rules for one step), `storeStepDone(store, key)`, `storeSetupNeeded(store)`.
- `app/components/dashboard/DashboardStoreSetup.vue`: the stepper and navigation. It uses the UI kit's Stepper.
- New: `app/components/dashboard/store/StepBasics.vue`, `StepAbout.vue`, `StepOwner.vue`, `StepHistory.vue`, `StepReview.vue`. The banner and logo panel gained a `bare` look for inside a step.
- Removed `DashboardStoreForm.vue` (the long form).
- `useStoreProfile.save()` can save without a toast, since each step saves quietly.

## 12. Admin dashboard, part 1: staff, one-time codes, overview

**What it does:** a separate admin dashboard at `/admin` for Dogeash staff, plain and data-dense, unlike the marketplace. This part covers who can get in, the one-time code they need, an overview of the whole site, and an audit log. Approving and moderating come in the next parts.

**You need to do:**
1. Run `supabase/migrations/20261113000000_admin_staff.sql` in the Supabase SQL Editor (it's on your clipboard). The site keeps working without it; the admin dashboard just won't open.
2. Make yourself an admin, in the SQL Editor:
   `insert into public.staff (user_id, role) select id, 'admin' from auth.users where email = 'you@example.com';`
   (use your sign-in email). The site itself can never add staff.
3. Check that authenticator apps (TOTP) are allowed in Supabase: Authentication → Sign In / Providers → Multi-Factor (it's on by default).
4. Go to `/admin` (or the new "Admin" item in your avatar menu). The first time, it asks you to set up an authenticator app, then for a code each time you sign in.

**Who gets in:**
- Only people in the new `staff` table, as `admin` (everything) or `inspector` (for the inspection work coming next). You add them in the SQL Editor; nobody can add themselves or change their own role.
- Everyone else gets a plain "Page not found" at `/admin`, so the dashboard doesn't advertise itself. Signed-out visitors are sent to sign in first.

**One-time code (required):**
- The first time, `/admin/verify` shows a QR code to scan with an authenticator app (Google Authenticator, Microsoft Authenticator, 1Password, Authy), plus the key to type if scanning fails. You confirm with a code from the app.
- After that it asks for the 6-digit code once per sign-in.
- This is checked in the **database** too: every admin function and the audit log refuse a session that hasn't passed a code. A stolen password alone opens nothing, even by calling the database directly.

**The overview (`/admin`):**
- **Eight numbers, each with its detail:**
  - accounts (and this week)
  - verified stores (and in review, draft, suspended)
  - live dogs (and reserved, drafts, sold)
  - visits this week (and awaiting stores, confirmed, done)
  - messages this week (and new conversations)
  - reviews (and average, this week)
  - care providers
  - staff
- **Waiting:**
  - store applications to review and dog listings pending review, marked "needs Dogeash"
  - visit requests stores haven't answered in over 2 days
  - reviews without a store reply
- **Tables:** latest admin actions, newest stores, newest reviews.
- A "refresh" link to reload the numbers.

**The look:** one thin bar with the sections, who you are and your role, "site ↗" and "sign out"; monospace labels, hairlines, full width, no cards. It uses the same colour tokens, so Day and Night watch both work. Sections not built yet (applications, inspections, stores, dogs, reviews, people, care, audit log) are listed greyed out.

**Audit log:** a new `admin_audit` table. Every admin action from the next parts records who did it, what, to what and when. Only admins with a code can read it, and nobody can write to it directly.

**Checked:**
- `npm run db:test`: 11 new checks. All pass.
- The typecheck shows no new errors, and every new file compiles.
- In the browser, `/admin` signed out goes to sign-in and back, with no console errors.

I haven't been through the authenticator set-up; that needs your account.

**Code:**
- `supabase/migrations/20261113000000_admin_staff.sql`: `staff`, `admin_audit`, `is_staff()`, `admin_overview()`, and the internal helpers `require_staff()` and `admin_log()`.
- `app/composables/useStaff.ts` (role, authenticator set-up and codes) and `app/composables/useAdmin.ts`.
- `app/middleware/admin.ts`, `app/layouts/admin.vue`, `app/pages/admin/index.vue`, `app/pages/admin/verify.vue`.
- `app/components/admin/StatGrid.vue`, `Waiting.vue`, `Table.vue`; `app/utils/admin.ts`.
- `nuxt.config.ts`: admin pages render in the browser only.
- The avatar menu shows "Admin" for staff.

## 13. Admin dashboard redesign

**What it does:** you said the first admin dashboard looked bad. `/admin` is now a proper console: a dark sidebar, headline cards with trends, an activity chart and panels.

**You need to do:** run `supabase/migrations/20261114000000_admin_overview_charts.sql` in the Supabase SQL Editor (it's on your clipboard). It adds the daily figures behind the charts. Until then the page still works; the charts and the top-stores and cities panels are just empty.

**Layout:**
- **Sidebar:** dark in both themes. A "Dogeash · Admin console" mark, then the sections in three groups (Monitor, Review, Manage) with icons. Sections not built yet say "soon". Applications and Listings show how many are waiting. At the bottom: you, your role, and sign out.
- **Phones:** the sidebar becomes a drawer behind a menu button.
- **Main area:** wide, with rounded cards on soft shadows.

**The overview, top to bottom:**
1. **Greeting:** "Good evening, <name>", today's date, "Updated 19:22", a **7 days / 30 days** switch and a refresh button.
2. **Four headline cards:** new accounts, visit requests, messages and reviews for the period. Each has the change against the period before (a green or red pill with an arrow) and a sparkline. **Click a card** to chart it.
3. **Activity chart:** the chosen measure per day. A dropdown adds "New dog listings". Hovering shows a crosshair and a tooltip with the date and value.
4. **Needs attention:**
   - store applications and listings to review (marigold when something's waiting on Dogeash)
   - unanswered visit requests
   - reviews without a reply
5. **Supply:** stores (verified, in review, draft, suspended) and dog listings (for sale, reserved, drafts, sold, withdrawn) as segmented bars, with counts in the legend.
6. **Top stores:** verified stores by live dogs, with visit requests in the last 30 days and their rating.
7. **Where the dogs are:** live listings by city.
8. **Admin activity:** the audit log as a feed.
9. **Newest reviews:** with stars.

**Colours:**
- Single-measure charts use marigold, deepened on light (`#a06e00`, 4.2:1) so the line reads.
- The status bars use five colours checked with the dataviz validator in both themes: every pair stays distinguishable, including for colour-blind readers.
- Counts are always written next to the colours, so nothing depends on colour alone.
- New tokens: `--chart-line`, `--chart-fill`, `--chart-grid`, `--cat-1`…`--cat-5`, each with light and dark values.

**Checked in the browser:**
- Laptop (1280px), light and Night watch, and phone (375px), using a temporary preview page with made-up figures. The preview is deleted.
- Fixed while checking: the legend cut labels off, and the headline cards stacked one per row on phones (now two across).
- The chart tooltip works.
- No sideways scrolling on phones.
- The typecheck shows no new errors, and `npm run db:test` passes, with 2 new checks.

**Code:**
- **Migration:** `supabase/migrations/20261114000000_admin_overview_charts.sql`. `admin_series()` gives 60 days per day on Lagos time; `admin_overview()` gains `series`, `topStores` and `cities`.
- **Charts** (plain SVG, no chart library added): `app/components/admin/chart/Sparkline.vue`, `AreaChart.vue`, `SegmentedBar.vue`, `BarList.vue`.
- **Panels:** `app/components/admin/Sidebar.vue`, `Card.vue`, `KpiCard.vue`, `Waiting.vue`, `Pipeline.vue`, `TopStores.vue`, `AuditFeed.vue`, `NewestReviews.vue`.
- **Rewritten:** `app/layouts/admin.vue` and `app/pages/admin/index.vue`.
- `app/utils/admin.ts`: the nav groups, period totals and axis ticks.
- **Removed:** `StatGrid.vue` and `Table.vue`.

**Update (same day):** the sidebar is now fixed down the full height of the screen and stays put while you scroll. The work area fills the rest of the width, with no maximum, so big monitors are used fully. Checked at 1920×1080.

**Correction (same day):** I misread "let the sidebar fill the screen" as being about laptops. You meant phones: the admin menu there now opens across the **full width** of the screen, with a close button top right. Checked at 375px. (The laptop change above stays.)

## 14. Dog photos and videos: stores upload what the dog page shows

**What it does:** you noticed the dog page shows a gallery with photos and videos, but the store's dog form only took one photo. Worse, the page didn't even use that photo: its gallery was placeholder boxes ("MAIN PHOTO", "▶ VIDEO · OBEDIENCE"). Now stores upload all of it, and the page shows it for real.

**Status:** migration run on 4 Nov and checked live: the new dog columns and the `dog-videos` bucket exist, and the site reads them.

**What a store can add to each dog** (in the dashboard's dog form, new "More photos and videos" section):
- **Main photo:** as before, and needed to go live.
- **Up to 8 more photos:** pick several at once; each uploads straight away; thumbnails with remove. JPG, PNG or WebP, up to 5 MB each.
- **Up to 4 videos:** choose what the video shows first, then the file:
  - **Kinds:** obedience, protection work, temperament, health or other.
  - **Title:** a short one, editable.
  - **Preview:** each video plays in the form.
  - **Files:** MP4, WebM or MOV, up to 50 MB each (Supabase's per-file limit).
- Everything else on the dog page already had a matching field: age, born, weight, hips and elbows, microchip, vaccinations, titles, sire, dam, summary, best suited, traits and price. The "kennel inspected" line is Dogeash's.
- Removing a photo or video, or deleting a draft, deletes the files from storage when you save.

**On the dog page:**
- **Gallery:** the main photo large (with the verified stamp), then videos as dark tiles with a marigold play button and their title, then more photos. "+N more" shows on the last tile when there are more than fit.
- **Viewer:** clicking any tile opens a full-screen viewer. It has arrows, the keyboard's left and right keys, and a thumbnail strip; videos play there.
- **No photo yet:** a plain "No photos yet" panel replaces the old placeholder boxes.

**Rules the database enforces:**
- Up to 8 more photos and 4 videos per dog.
- Files only from the store's own folder.
- Each video says what it shows, with a title of up to 60 characters.
- Videos go in a new public `dog-videos` bucket (50 MB, video types only). Only the store's people can add or remove them.

**Checked:**
- `npm run db:test`: 9 new checks. All pass.
- The typecheck shows no new errors.
- In the browser, with a temporary page using the sample photos (deleted after):
  - laptop and phone layouts
  - the "+4 more" tile
  - the viewer: opening, arrow keys, thumbnails
  - no sideways scrolling on phones
- The real dog, dogs and store pages still load.
- I haven't uploaded through the dashboard, which needs a store account.

**Code:**
- `supabase/migrations/20261115000000_dog_media.sql`: `gallery_paths` and `videos` on dogs, the rule `dog_media_ok()`, and the `dog-videos` bucket and its access rules.
- `app/utils/dogs.ts`: `Dog.photos` and `Dog.videos`, `DogMedia`, `videoKinds`, `dogVideoUrl()`. `StoreDog.media` holds the paths.
- `app/utils/dogForm.ts`: `dogFormToRow(values, media)`.
- `app/composables/useStoreDogs.ts`: `uploadVideo()`. `create` and `update` take the media, and unused files are deleted.
- New components: `app/components/dashboard/DashboardDogGallery.vue`, `DashboardDogVideos.vue`, and `app/components/DogGallery.vue` (the page gallery and viewer).
- `DashboardDogForm.vue`, `pages/dashboard/dogs/new.vue` and `[fileNo].vue`, and `pages/dogs/[id].vue` are updated.

**Also fixed:** a type error in the admin overview's fallback for missing chart data (from section 13).

## 15. Admin: change a store's status from the overview

**What it does:** a **Stores** panel on the admin overview lists every store (drafts included) and lets you approve, decline, suspend or restore it. You asked for this as a first step before the full Stores section. You can then watch the effect on the store's side.

**Status:** migration run on 4 Nov and checked live: the status columns exist, both admin functions refuse anyone without admin rights, and the site reads them.

**The Stores panel (admin overview):**
- Every store: its owner, status, live dogs out of all its dogs, and the last change with Dogeash's note.
- Filter chips by status (with counts) and a search box.
- The ⋯ menu on each row offers what makes sense for its status:
  - **In review:** Approve, or Decline (send back).
  - **Draft:** Mark in review, or Approve.
  - **Verified:** Suspend, or Send back to draft.
  - **Suspended:** Restore, or Send back to draft.
- Each action opens a confirm dialog that says what will happen, for example "The store and all its dogs disappear from the site at once". It also asks for a note. **Declining and suspending need a reason**, since the store reads it.
- After it's done, the panel, the numbers and the admin activity feed reload, and a toast confirms.

**What the store sees:**
- **Bell:** owners and managers get a notification such as "Eko Shield K9 is approved", "… was sent back" or "… is suspended", with your note.
- **Dashboard banner** (top of every store dashboard page):
  - Suspended: a red banner with your note and "Contact Dogeash".
  - Sent back: what to fix, with your note.
  - In review: "Dogeash is reviewing…".
  - Approved: "is approved", for a week.
  - A verified store that has settled in sees nothing.
- **For buyers:**
  - Approving shows the store and its live dogs, and lets it put dogs live.
  - Suspending or sending back hides the store and all its dogs at once.
- **Approving records the inspection** ("Inspected November 2026, Dogeash inspection team") if the store didn't have one, so its public page shows it as inspected.

**Rules the database enforces:**
- Only admins with a one-time code can list all stores or change a status. Inspectors and store owners can't.
- A reason is required for draft and suspended, and changing to the same status is refused.
- Every change goes to the audit log with the old status, the new one and the note.
- Stores still can't write their own inspection record; only admins can now.

**Also fixed:** the store's dog ⋯ menu (from section 1) had a see-through background. The UI kit's menus use a "popover" colour this project never defined. It's fixed there and in the new Stores menu, and every other menu already set its own.

**Checked:**
- `npm run db:test`: 13 new checks. All pass.
- The typecheck shows no new errors.
- In the browser, using a temporary page with made-up stores (deleted after): the panel, the filter chips, the menu, and the confirm dialog refusing to decline without a reason.
- The store banner compiles, but I haven't seen it with a real store; that needs a store account.

**Code:**
- `supabase/migrations/20261116000000_admin_store_status.sql`:
  - `admin_stores()` and `admin_set_store_status()`
  - `status_note` and `status_changed_at` on stores
  - a "store" notification kind
  - the store-details protection now lets admins through
- `app/components/admin/Stores.vue` (the panel). `app/utils/admin.ts`: status labels, the actions per status, and what each one does.
- `app/composables/useAdmin.ts`: `loadStores()` and `setStoreStatus()`.
- `app/components/dashboard/DashboardStoreStatus.vue`, shown by `layouts/dashboard.vue`.
- `Store.statusNote` and `statusChangedAt`. The `adminDone` toast. A bell icon for store notifications.

## 16. Admin sections: Stores, Listings, Reviews, People, Care directory, Audit log

**What it does:** every admin sidebar link now opens a working page, except Applications and Inspections, which wait for the store application flow.

**Status:** migration run on 5 Nov and checked live: `dogs.admin_note` exists, all seven admin functions refuse anyone without admin rights, and the site reads the catalogue from the database again.

**The pages:**
- **Stores (`/admin/stores`):** the Stores panel from the overview as a full page: every store, filters, search, and approve, decline, suspend or restore (section 15).
- **Listings (`/admin/listings`):** every dog in any status. Each row has its photo, store (and whether the store is verified), status, price, last update and Dogeash's note. Filter by status, and search by name, file number or store. Actions:
  - **Take down** a live or reserved dog. A reason is required; the dog disappears at once and the store is told.
  - **Put back live** a withdrawn dog (only if its store is verified).
  - **Approve and put live**, or **send back to the store**, a dog pending review.
  - Drafts and sold dogs have no actions; they're the store's business.
- **Reviews (`/admin/reviews`):** every review as a card with stars, store, text, the store's reply, and the author's name, city and email. Filter by 1–2 stars or 4–5 stars, and search. **Remove** needs a reason, which the author is told. The store's rating is recalculated, and the removed text is kept in the audit log.
- **People (`/admin/people`):** every account, newest first (up to 200), with search by name, email or phone as you type. Each row shows:
  - name, email and staff badge
  - phone and city
  - their stores, with status and role
  - activity: visits, conversations, reviews and shortlisted dogs
  - when they joined, and when they last signed in
- **Care directory (`/admin/care`):**
  - All providers, with how many stores use each.
  - **Add provider** opens a form: name, person, what they do, city, areas, credential, starting price, home visits, and the "checked by Dogeash" badge. **Edit** and **Remove** are in each row's ⋯ menu.
  - New providers get the next CARE number and a web address from their name.
  - The public directory updates straight away.
- **Audit log (`/admin/audit`):** every admin action, newest first. Each entry shows:
  - a readable label ("Store approved", "Listing taken down", "Review removed")
  - who did it, what it was done to, and when
  - the details: from → to, and the note sent
  Filter by stores, listings, reviews or care directory. "Load older" shows 100 more at a time.

**The store's side:**
- A dog taken down or sent back shows **"Dogeash took this dog down: <reason>"** on its page in the store dashboard, and the owner and managers get a bell notification.
- When the store moves the dog on itself, Dogeash's note is cleared, so an old reason never reappears.

**Blocking people isn't built.** Banning an account in Supabase needs its secret server key, which we never put in the website. The options are a small server function that holds the key (a Supabase Edge Function or a Nuxt server route), or a "blocked" flag the database checks on every write. I'd suggest the server function; it needs your go-ahead, since the key would live on the server.

**The sidebar** now loads the waiting counts (applications, listings to review) on any admin page, not only the overview.

**Checked:**
- `npm run db:test`: 20 new checks. All pass.
- The typecheck shows no new errors, and every new page compiles.
- In the browser (made-up listings and reviews on a temporary page, deleted after): Listings, Reviews, and the Care directory with the real providers, plus its Add form.
- People and Audit log compile, but I haven't seen them with data; they need your admin sign-in.

**Code:**
- `supabase/migrations/20261117000000_admin_sections.sql`: `admin_dogs()`, `admin_set_dog_status()`, `admin_reviews()`, `admin_remove_review()`, `admin_people()`, `admin_save_provider()`, `admin_delete_provider()`, `dogs.admin_note`, and the rule that clears the note.
- `app/pages/admin/stores.vue`, `listings.vue`, `reviews.vue`, `people.vue`, `care.vue`, `audit.vue`.
- `app/components/admin/Page.vue` (section header), `Confirm.vue` (the shared confirm-with-reason dialog, now also used by Stores) and `ProviderForm.vue`.
- `app/composables/useAdminListings.ts`, `useAdminReviews.ts`, `useAdminPeople.ts`, `useAdminCare.ts`, `useAdminAudit.ts`.
- `app/utils/admin.ts`: the nav links, statuses, the actions per status, and the audit labels.
- The store's dog page shows Dogeash's note (`StoreDog.adminNote`).

## 17. Store applications: apply to go live, and review applications in admin

**What it does:** a kennel that opened a store can now apply properly:
- the kennel's address and a phone for the inspector
- preferred inspection days
- documents: ID, the CAC certificate, and optional proof of address
- then "Send for review"
Admins review it all on the **Applications** page and approve it or send it back.

**Status:** migration run on 5 Nov and checked live: the table and both functions exist and refuse visitors, and public links to store documents are refused. To confirm the private bucket itself, run `select id, public, file_size_limit from storage.buckets where id = 'store-documents';` in the SQL Editor; it should show `public = false` and 10485760.

**For the store owner (store dashboard → Application):** the sidebar shows this item only to owners, and only until the store is verified.
- **"Before you send" checklist:** five items, ticked off as they're done, each linking to where to do it:
  - store profile
  - at least one dog
  - kennel address and phone
  - inspection days
  - documents
- **Kennel and inspection:**
  - the address (only Dogeash sees it), directions, and a phone for the inspector
  - **up to three** preferred days (Monday to Saturday, from three days out, for three weeks)
  - an "isn't registered as a business yet" switch, which drops the CAC requirement
  - a note for Dogeash
- **Documents:** the owner's ID (required), the CAC certificate (required unless not registered) and proof of address (optional). PDF or photo, up to 10 MB. Each can be uploaded, replaced or opened.
- **Send for review:** enabled only when the checklist is complete, and it asks first. The store goes to "In review" and the page locks, showing when it was sent and the chosen days.
- **Sent back:** the page opens again, and the banner at the top shows Dogeash's reason.
- **Links:** the draft banner on every dashboard page now has "Open the application". The sign-up welcome for new stores links to "Set up your store" and "Send your application".

**For admins (`/admin/applications`, Applications in the sidebar, with the waiting count):**
- **Waiting / Sent back** tabs.
- Each application shows:
  - the owner (name, email, phone)
  - the tagline, the about text, who runs it, and how many dogs
  - the address and directions, the phone (tap to call), the preferred days and the owner's note
  - each document with **Open** ("Not registered yet" or "Missing" otherwise)
- **Approve:** the store goes live and its inspection is recorded. **Send back:** a reason is required, which the owner reads. Both go in the audit log.
- Admins get a bell notification for each new application.

**Privacy and rules:**
- Documents go in a new **private** bucket, `store-documents`. Only the store's owner and admins with a one-time code can open them, through links that work for one minute.
- Only the owner can fill in or send the application, and only while the store is a draft. In review, it's locked, and uploads are refused too.
- The database refuses to send an application until:
  - the profile has a tagline, about text and who runs it
  - there's at least one dog
  - the address and phone are given
  - at least one day is chosen
  - the ID is uploaded, and the CAC certificate unless not registered
- Documents can only come from the store's own folder.

**Checked:**
- `npm run db:test`: 19 new checks, walking one store through draft, missing pieces, sending, locked, admin review, open document, sent back and editable again. All pass.
- The typecheck shows no new errors, and every new page compiles.
- In the browser (made-up data on a temporary page, deleted after):
  - the store's checklist, form and documents
  - the three-day limit: the fourth day greys out
  - the admin Applications card
- I haven't uploaded real documents or sent an application end to end; that needs a store account and your admin sign-in.

**Not done yet:** Inspections, meaning assigning an inspector, scheduling the visit and recording the checklist and photos. Approving currently stands in for "the inspection passed".

**Code:**
- **Migration:** `supabase/migrations/20261118000000_store_applications.sql`. The `store_applications` table, `submit_store_application()`, `admin_applications()`, the `store-documents` bucket and its rules.
- **Store side:** `app/pages/dashboard/application.vue`; `app/components/dashboard/DashboardApplicationChecklist.vue`, `DashboardApplicationForm.vue`, `DashboardApplicationDocs.vue`; `app/composables/useStoreApplication.ts`; `app/utils/storeApplication.ts`.
- **Admin side:** `app/pages/admin/applications.vue` and `app/composables/useAdminApplications.ts`.
- **Also changed:** the store sidebar shows Application until verified (`dashboardNav` `beforeVerified`), the draft banner links to it, the sign-up next steps, and an `applicationSent` toast.

## 18. Inspections

**What it does:** admins book kennel inspections from Applications. The inspector works through an inspection sheet (a checklist, the dogs, photos and a summary) and records a pass or a fail. A pass is what makes a store verified now; "Approve now" stays as an override.

**Status:** migration run on 5 Nov and checked live: the inspections table and all eight functions exist and refuse visitors, and the site still loads.

**You need to do:**
1. Nothing more for the migration.
2. To add an inspector (optional; admins can inspect too):
   `insert into public.staff (user_id, role) select id, 'inspector' from auth.users where email = 'inspector@example.com';`
   They sign in, set up their authenticator app at `/admin/verify` like you did, and see only Inspections.

**Booking (`/admin/applications`):**
- An application waiting for review has **Book inspection**. It asks for:
  - a day (the owner's preferred days are listed first, marked "preferred")
  - a time (8:00–16:00)
  - an inspector (any staff member)
  - an optional note for the inspector, such as a gate code
- The owner gets a bell notification ("Inspection booked: Tue 10 Nov at 10:00"). Their Application page shows **"Inspection booked: <when> with <inspector>"** and what to have ready.
- The inspector gets a bell notification with a link to the sheet.
- Once booked, the application card shows the inspection's status, time and inspector, with **Open the sheet**.
- A store can only have one inspection booked at a time.
- "Approve" is now **Approve now**, which approves without a sheet. Use it only when the inspection happened outside Dogeash.

**The Inspections page (`/admin/inspections`):** Booked and Done tabs. Each row shows the time, store, number of dogs, how many checks are marked, the inspector and the status, and opens the sheet. Admins see every inspection; inspectors see only their own.

**The inspection sheet (`/admin/inspections/<id>`):**
- **Where to go:** the kennel's address, directions, the owner's phone (tap to call) and the booking note.
- **Checklist:** 8 checks, each marked **Passed** or **Failed**, with a note:
  - clean, shaded runs
  - water
  - vet records for every dog
  - microchips scanned and matched
  - protection levels tested on site
  - dogs match their listings
  - the owner's ID matches
  - business registration seen
- **Dogs:** every dog the store listed when it was booked. Mark each one **Seen**, and confirm or correct its protection level.
- **Photos:** private, for staff only. Several can be added at once, and each saves straight away.
- **Summary:** the inspector's verdict. On a fail, it's the reason the store reads.
- **Save progress** at any time. **Record pass** and **Record fail** unlock once every check is marked, and both ask first. Admins can also **Cancel inspection** with a reason, and the owner is told.
- A finished sheet is read-only.

**What a result does:**
- **Pass:**
  - The store is **verified** and live.
  - Its public inspection record shows the month, the inspector ("Femi Ade, Dogeash") and the checks that passed.
  - Every dog marked seen gets **"Inspected <month> by Dogeash"** on its K9 file, and its protection level becomes the one confirmed.
  - The owner is told.
- **Fail:** the store goes back to its owner as a draft, with the summary as the reason (in the banner and the bell). They can fix things and apply again.
- Booking, pass, fail and cancel all go in the **audit log**, with a new Inspections filter there.

**Rules the database enforces:**
- Only admins book or cancel.
- Inspectors can only open and work the inspections assigned to them; admins can work any.
- A result needs every check marked, and a fail needs a summary.
- A finished inspection can't be changed or recorded again.
- Photos only go in that inspection's own folder, in the private `inspection-photos` bucket.
- The inspections table can't be read directly at all; it's only reachable through these checks.
- The rules that stop stores writing their own inspection lines now let inspectors through, inside these functions only.

**Checked:**
- `npm run db:test`: 21 new checks, covering booking, notifications, the sheet, photos, pass (store, record and dogs), fail, cancel, and access. All pass.
- The typecheck shows no new errors, and every new page compiles.
- In the browser (made-up data on a temporary page, deleted after): the checklist, the dogs (the level is locked until a dog is marked seen), the photos panel and the booking dialog. I widened the level dropdown, which was cutting its label off.
- I haven't run a real inspection end to end; that needs your admin sign-in.

**Code:**
- `supabase/migrations/20261119000000_inspections.sql`: the `inspections` table and the functions `admin_staff()`, `admin_schedule_inspection()`, `admin_cancel_inspection()`, `admin_inspections()`, `admin_inspection()`, `my_store_inspection()`, `admin_save_inspection()` and `admin_complete_inspection()`. Also the `inspection-photos` bucket, and the updated `protect_store_details()` and `prepare_dog()`.
- `app/utils/inspections.ts` (statuses, the 8 checks, the data shapes) and `app/composables/useAdminInspections.ts`.
- `app/pages/admin/inspections/index.vue` and `[id].vue`.
- `app/components/admin/ScheduleInspection.vue`, `InspectionChecklist.vue`, `InspectionDogs.vue`, `InspectionPhotos.vue`.
- Applications page: booking and the inspection link. The store's Application page shows the booked inspection.
- Inspectors: the sidebar shows only Inspections, the guard sends them there, and their one-time code leads there.

## 19. Reports from users, and blocking accounts

**What it does:** buyers and stores can report a listing, a store, a review or a conversation. Admins work through the reports in a queue. Admins can also block an account: it can still read, but it can't add or change anything.

**You need to do:** run `supabase/migrations/20261120000000_reports_and_blocking.sql` in the Supabase SQL Editor. Nothing public breaks before it runs; reports just won't send.

**Reporting (for everyone signed in; visitors are asked to sign in first):**
- **Where:**
  - **Report this listing** on a dog's page
  - **Report <store>** under a store's reviews
  - **Report this review** on each real review (not your own, not the samples)
  - **Report this conversation** in My messages and in the store inbox
- **Why:**
  - scam or fraud
  - wrong information
  - abusive or offensive
  - animal welfare
  - something else (with details)
- **Limits:** the other side isn't told who reported them. The same thing can be reported once while the report is open, up to 20 reports a day. You can only report a conversation you're part of.
- **Afterwards:** "Thanks, it's with Dogeash". The reporter later gets the outcome in their bell.

**Admin › Reports (`/admin/reports`, in the sidebar with the open count):**
- **Open / Closed tabs.** Each report shows:
  - what it's about ("Rambo · KD-2026-003 · K9 Guardian Kennels") and that thing's current status
  - an **Act in Listings / Stores / Reviews** link
  - the reason, the details, and the reporter's name and email
  - how many open reports the same thing has
- **Conversations:** **Read the conversation (logged)** shows the messages. That's the only way an admin can read private messages, and every read goes in the audit log.
- **Resolve** (you acted) or **Dismiss** (nothing to do). Both need a note, which the reporter reads.
- Admins get a bell notification for each new report.

**Blocking (Admin › People, ⋯ on each row):**
- **Block account** needs a reason. The person can still sign in and browse. They **can't**:
  - message or book visits
  - review or report
  - list dogs or change a store
  - save dogs or searches
  - upload anything, or edit their profile
- A red banner on every page (site and store dashboard) tells them they're blocked, with your reason.
- **Unblock** restores everything. People shows a "blocked" badge (hover for the reason).
- Staff can't be blocked, and nor can you. Blocking doesn't suspend their stores; do that in Stores if needed.
- **How it works:** a "restrictive" access rule on every table and on uploads, applied on top of all the others. No secret key needed.
- Blocks, unblocks, resolutions and conversation reads are all in the audit log, with new Reports and People filters.

**Checked:**
- `npm run db:test`: 22 new checks, covering reporting, duplicates, visitors, conversations you're not in, the admin queue, the logged read, resolving, and blocking (read yes, write no, staff exempt, unblock, audit). All pass.
- The typecheck shows no new errors, and every changed page compiles. The Report links show on the dog and store pages.

**Code:**
- `supabase/migrations/20261120000000_reports_and_blocking.sql`: the `reports` and `blocked_accounts` tables, the restrictive rules, and `my_block()`, `admin_block_person()`, `admin_unblock_person()`, `admin_reports()`, `admin_open_reports()`, `admin_report_messages()`, `admin_resolve_report()`. `admin_people()` now includes blocks.
- `app/components/ReportButton.vue`, `app/utils/reports.ts`, `app/composables/useReports.ts`.
- `app/components/AccountBlockedBanner.vue` and `app/composables/useAccountBlock.ts` (loaded with the account).
- `app/pages/admin/reports.vue` and `app/composables/useAdminReports.ts`. The People page and `useAdminPeople` gained block and unblock.

## 20. Admin: a page for each store and each person

**What it does:** clicking a store or a person anywhere in the admin console opens one page with everything about them.

**You need to do:** run `supabase/migrations/20261121000000_admin_detail_pages.sql` (after section 19's). Nothing public depends on it.

**Store page (`/admin/stores/<STR-…>`):**
- **Header:** status, ID, place and opening date. **Change status** (the same actions as the Stores list), **Public page ↗** when verified, and **Application** when there is one.
- **Notes:** Dogeash's last note to the store. A red link appears if it or its dogs have open reports.
- **Main column:**
  - **Dogs:** photo, status, level and price.
  - **Reviews:** the average, and those without a reply.
  - **Kennel visits:** counts by status, plus the last 10.
  - **History:** admin actions on the store and its dogs.
- **Side column:**
  - **Team:** with emails and phones, a blocked mark, and each linked to their person page.
  - **Profile:** tagline, about, who runs it, the inspection record, and whether visits are paused.
  - **Application:** address, phone, days, which documents are in, and when it was sent.
  - **Inspections:** each one linked to its sheet.
  - **Counts:** conversations, and the size of the care team.

**Person page (`/admin/people/<id>`):**
- **Header:** name, email, phone, city, when they joined and last signed in, staff and blocked badges, and **Block account / Unblock**.
- **Activity:**
  - kennel visits, linked to the stores
  - conversations: counts and dates only, **never message text** (that's only readable through a report, and logged)
  - reviews written
  - reports made
- **Side column:** their stores and roles, home profile, how they like to be reached, and their shortlist size.
- **History:** admin actions about them, or by them if they're staff.

**Links in:**
- store names in Stores, Listings and inspection sheets, plus a **Store page** button on each application
- names in People
- store and person names in the audit log (on its page and on these pages)

**Also:**
- The audit list is now one shared component, used by the Audit log page and both detail pages.
- The Stores and People list pages moved to `stores/index.vue` and `people/index.vue` so the detail pages can sit beside them. Their addresses are unchanged.

**Checked:**
- `npm run db:test`: 7 new checks, including that a person's page never contains message text. All pass.
- The typecheck shows no new errors, every page compiles, and the routes resolve.
- I haven't seen the pages with data; they need your admin sign-in.

**Code:** the migration (`admin_store()` and `admin_person()`), `app/pages/admin/stores/[id].vue`, `app/pages/admin/people/[id].vue`, `app/composables/useAdminDetail.ts` and `app/components/admin/AuditList.vue`.

## 21. Admin: visit oversight

**What it does:** a **Visits** page (Monitor › Visits, with the count of unanswered requests) to watch kennel visit requests across every store and chase the slow ones.

**You need to do:** run `supabase/migrations/20261122000000_admin_visits.sql` (after section 20's).

**The page:**
- **Tabs:**
  - **Needs chasing:** requested over two days ago, with the day still ahead
  - **Missed:** the day passed with no answer
  - **Coming up**
  - **All:** the last 60 days and everything ahead
- **Each row:** when (and "at the buyer's home" if so), the store (opens its page), the buyer with their email (opens their page), the status, and when they asked.
- **Nudge** sends the store's owner and managers a bell notification: "Please answer <buyer>'s visit request … Confirm it, or decline with a note, from Bookings". Each nudge is in the audit log. Answered visits can't be nudged.
- **How stores answer** (last 90 days): requests, the median time from request to the store's decision, and missed requests. Slow stores (over 24 hours, or any missed) are tinted.

**Checked:** `npm run db:test` (5 new checks, all pass). The typecheck shows no new errors, and the page compiles.

**Code:** the migration (`admin_visits()` and `admin_nudge_visit()`), `app/pages/admin/visits.vue`, `app/composables/useAdminVisits.ts`, and the sidebar item.

## 22. Re-inspection every year

**What it does:** a store stays verified for **a year** after its last passed inspection or approval. Stores are reminded before it runs out, and admins see who's due and book the re-inspection.

**You need to do:**
1. Run `supabase/migrations/20261123000000_reinspection.sql` (after section 21's). Stores already verified get a year from their last status change.
2. Optional: for **daily** reminders, enable the **pg_cron** extension in Supabase (Database → Extensions) **before** running the migration. Without it, the migration skips the daily job safely, and reminders go out when an admin presses "Send reminders now". If you enable it later, let me know and I'll give you the one line that schedules the job.

**How it works:**
- Every verified store has a "verified until" date, set by the database:
  - becoming verified (by inspection or by approval) starts a fresh year
  - passing a new inspection while verified starts a fresh year
- **30 days before**, the store's owner and managers get a bell notification ("… runs out on 14 Nov"), once per year. Their dashboard shows a marigold banner with the date. Once it has run out, the banner turns red.
- **An expired store isn't hidden automatically.** It shows as overdue, and you decide: book a visit, or suspend it in Stores.
- A failed re-inspection sends the store back to draft (hidden), the same as a failed first inspection.

**Admin › Re-inspections (`/admin/reinspections`):**
- Three groups: **Overdue** (with how many days ago), **Due within 30 days** (with days left), and **Later**.
- Each store links to its store page. **Book re-inspection** opens the usual booking dialog. If one is already booked, it shows "Booked Tue 10 Nov, 10:00", linked to the sheet.
- **Send reminders now** sends any due reminders and says how many stores were reminded. It's in the audit log.

**Checked:** `npm run db:test` (8 new checks: a year on verifying, reminders once a year, admin list, the store's own date, a fresh year on re-approval, admins only). All pass. The typecheck shows no new errors, and the page and banner compile.

**Also fixed:** stores created already verified, as the seed creates them, now get a date too. Before this fix they'd have had none.

**Code:** the migration (`stores.verified_until`, the `extend_verification` rule, `send_reinspection_reminders()`, `admin_reinspections()`, `admin_send_reinspection_reminders()`, `my_store_verification()`, and the optional pg_cron job), `app/pages/admin/reinspections.vue`, `app/composables/useAdminReinspections.ts`, and the banner in `DashboardStoreStatus.vue`.

## 23. Announcements

**What it does:** admins send an announcement to **everyone**, **stores** (everyone on a store's team) or **buyers** (everyone else). It goes to each person's bell. For everyone, it can also show **as a strip across the top of the site** until a date, which visitors who aren't signed in see too.

**You need to do:** run `supabase/migrations/20261124000000_announcements.sql` (after section 22's). Nothing public breaks before it runs; the strip just stays hidden.

**Admin › Announcements (`/admin/announcements`):**
- **Write one:** who it's for, a title, the message, and an optional link ("More": a page like `/guide`, or an `https://` link; anything else is refused). For everyone, there's also **Also show across the top of the site until <date>**. **Send** asks first, showing exactly what will go out ("This can't be unsent").
- **Sent:** each announcement with its audience, how many people got it, who sent it, and whether its strip is still showing. **Take the strip down** ends it early.
- Every send and every strip taken down goes in the audit log, with a new Announcements filter.

**On the site:** a dark strip with a marigold megaphone above the header, with the title, message and "More". Anyone can close it, and it stays closed for that announcement in their browser. In the bell, announcements have a megaphone icon.

**Checked:** `npm run db:test` (8 new checks: stores-only and buyers-only reach the right people, admins only, the strip appears only when asked and until its date, taking it down, the list, bad links refused). All pass. The typecheck shows no new errors, everything compiles, and the home page loads.

**Code:** the migration (the `announcements` table, `admin_send_announcement()`, `admin_announcements()`, `admin_end_banner()`, `site_banner()`, and the "announcement" notification kind), `app/pages/admin/announcements.vue`, `app/composables/useAdminAnnouncements.ts`, and `app/components/SiteAnnouncement.vue` (in the main layout).

## 24. Listing review policy, and admin Settings

**What it does:** you decide which new dog listings Dogeash checks before buyers see them. Until now, every dog from a verified store went live at once, and "Pending review" was never used.

**You need to do:** run `supabase/migrations/20261125000000_listing_review.sql` (after section 23's). **All rules start off**, so nothing changes until you switch one on.

**Admin › Settings (`/admin/settings`):**
- **Listing review**, three switches that take effect at once:
  - **Review each store's first three listings:** a new store's first dogs wait for you.
  - **Review level 4 and 5 dogs:** the strongest protection dogs are checked first.
  - **Review every new listing:** nothing goes live until you've looked at it.
  It shows who last changed them and when, and each change is in the audit log.
- **Staff:** the admins and inspectors (linked to their person pages), with the SQL line for adding one. Staff are still only changed in the SQL Editor.

**What happens when a rule applies:**
- **The store:** its "Go live" lands on **Waiting for Dogeash review** (renamed from "Waiting for inspection"). Its toast says "… is with Dogeash for review", and while it waits, its only action is **Back to draft**.
- **Admins** get a bell notification ("Listing to review: Rambo"), and the dog shows under **Pending review** in Listings (and in the overview's Waiting list). There you **Approve and put live**, or **Send back to the store** with a reason.
- Putting a reserved dog back to available isn't held, and nor is anything staff do.

**Checked:** `npm run db:test` (9 new checks: off by default, admins only, each rule, admins told, approval, the audit log). All pass. The typecheck shows no new errors, and everything compiles.

**Code:**
- **Migration:** the `platform_settings` table (one row), `listing_needs_review()`, the rule that routes a "go live" to review, the admin notification, `admin_settings()` and `admin_save_settings()`.
- **Admin:** `app/pages/admin/settings.vue`.
- **Store side:** `useStoreDogs` keeps the status that actually saved (`lastStatus`). Toasts on the dog pages and in the ⋯ menu, the label, and the actions while pending are updated.

## 25. Exports (CSV) and longer history

**What it does:** most admin lists can be downloaded as a spreadsheet, and the overview shows **90 days** and **1 year** as well as 7 and 30.

**You need to do:** run `supabase/migrations/20261126000000_admin_history.sql` (after section 24's). The CSV buttons work without it; until it runs, 90 days and 1 year just show the last 60 days.

**CSV downloads:** a **CSV** button on these lists:
- Stores
- Listings
- People
- Visits
- Reviews
- Applications
- Reports
- Audit log

It downloads **exactly the rows on screen**, with the current tab, filter and search applied, as `dogeash-<list>-<date>.csv`. Columns are labelled in plain words (Store ID, Owner, Live dogs, Dogeash note …). Commas and quotes inside values are handled, and the file opens correctly in Excel and Google Sheets, naira signs and accents included. It's built in the browser from what's already loaded; nothing extra is fetched.

**Longer history on the overview:**
- **7 days / 30 days / 90 days / 1 year.** The headline numbers, their change against the period before, the sparklines and the activity chart all follow the period.
- 90 days and a year load a fuller day-by-day history the first time you pick them: up to two years, so a year can be compared with the year before.

**Checked:** `npm run db:test` (3 new checks: a year of days, the 7–730 limits, admins only). All pass. The typecheck shows no new errors, and every page compiles. I tested the CSV quoting.

**Code:** the migration (`admin_history(days)`), `app/utils/csv.ts`, `app/components/admin/Export.vue`, the export columns on each list, `useAdmin().loadHistory()`, and the periods in `pages/admin/index.vue`.

## 26. Admin search across everything

**What it does:** one search box for the whole admin console. Press **⌘K** (Mac) or **Ctrl+K** (Windows) on any admin page, or use **Search** at the top of the sidebar.

**You need to do:** run `supabase/migrations/20261127000000_admin_search.sql` (the last of this batch).

**How it works:**
- Type two letters or more. Results appear as you type, grouped and best matches first (up to 8 of each):
  - **Stores:** by name, ID or city
  - **Dogs:** by name, **file number** or breed, with their store and status
  - **People:** by name, **email** or **phone**
  - **Care providers:** by name, person, city or ID
- **↑ ↓** move, **Enter** opens, **Esc** closes. Clicking works too.
- Where results go:
  - a store or dog opens the store's page
  - a person opens their page
  - a provider opens the Care directory
- Admins only; inspectors don't get it.

**Checked:** `npm run db:test` (6 new checks: by store name, file number, email, provider; too-short searches; admins only). All pass. The typecheck shows no new errors, everything compiles, and ⌘K opens the dialog in the browser.

**Code:** the migration (`admin_search(q)`), `app/components/admin/Search.vue` (the dialog and the keyboard shortcut, in the admin layout), and the sidebar button.

---

**This batch (sections 19–26) in one go:** the migrations below, run **in this order**, after everything before them:
1. `20261120000000_reports_and_blocking.sql`
2. `20261121000000_admin_detail_pages.sql`
3. `20261122000000_admin_visits.sql`
4. `20261123000000_reinspection.sql` (enable **pg_cron** first if you want daily reminders)
5. `20261124000000_announcements.sql`
6. `20261125000000_listing_review.sql`
7. `20261126000000_admin_history.sql`
8. `20261127000000_admin_search.sql`

None of them change what the public site reads, so nothing breaks while you run them. `npm run db:test` now runs **320 checks**, all passing.

**Still waiting for a payment provider:** reservations and escrow, payouts to stores, and disputes with refunds.

**Status of sections 19–26:** run on 6 Nov and checked live:
- all four new tables exist, and visitors are refused
- all twelve admin functions exist and refuse anyone without admin rights
- the public `site_banner()` answers (no strip running)
- stores have their "verified until" date (STR-001: 3 Nov 2027)
- the site loads

Whether the daily reminder job was scheduled depends on pg_cron, which I can't see from outside. In the SQL Editor, `select jobname, schedule from cron.job;` shows it if it's there.

---

## 27. Admin: dark only, what the sidebar counts mean, phones fit

**Dark only.** Every admin page (all 18, including the one-time code page) is always dark, whatever the site's theme switch says. The marketplace keeps its own light/dark setting.

**The sidebar counts.** The number beside a section is what's waiting there. Hover it (or use a screen reader) and it says so:
- **Applications:** store applications waiting for a decision
- **Listings:** listings waiting for review
- **Visits:** visit requests unanswered for 2+ days
- **Reports:** open reports

The "1" on Applications was **Eastgate K9 Academy (STR-006)**, a sample store seeded as "in review" before the application form existed. The count included it but the Applications page didn't list it, because it had no form. Now the page lists it too, with a note: "No application form: send it back to ask for one, or approve it."
- Migration: `20261128000000_applications_without_form.sql` (only replaces `admin_applications()`). Run on 6 Nov; live, the function exists and refuses visitors.

**Phones: the blank space on the right is gone.** There were two causes:
1. **Every table's hidden "Actions" header label** (for screen readers) was placed against the whole page rather than its scrolling table, so it sat far to the right and stretched the page to about 730px. This affected Overview (stores table), Stores, People, Listings, Visits and Care. Fixed by anchoring each table's scroll box. The same fix went into the shortlist compare table and the guide's table.
2. **The activity chart** started at 640px wide before measuring itself. It now fits its box from the start.

Also, filter buttons (audit, reviews, reports, applications, inspections, and the overview's periods) now wrap onto a second line instead of running off narrow screens.

**Checked:**
- 14 admin pages at 320px and 375px wide, using sample data: page width equals screen width on every one.
- `npm run db:test`: new check that a store in review without a form is listed. All pass.
- Typecheck: no new errors.

---

## 28. Every dropdown is now the shadcn Select

All 14 browser-native dropdowns are replaced with shadcn's Select, through one shared component: `app/components/SelectMenu.vue`. You give it the options, it handles the rest: the button, the list, the tick on the current choice, the placeholder, and labels for screen readers.

**Where:**
- **Dog form:** breed and hip grade
- **Dog videos:** what each video shows
- **Store team:** each person's role. A change still only sticks once it's saved.
- **Admin overview:** the chart's measure
- **Admin:** "Book inspection" (day, time, inspector), care provider type, and the confirmed level per dog on an inspection sheet
- **Stores directory:** sort (desktop, and the phone filter sheet)
- **Care directory:** sort

**Sort options** for stores and care now live in one place each: the stores page and `useCareDirectory`.

**Checked:** typecheck (no new errors) and every changed file compiles. On the stores directory, the menu opens on a solid background and "Name, A to Z" re-sorts the list.

---

## 29. New loader: an outlined dog over the wordmark

The sign-out loader no longer uses the kennel-watch GIF. It's now:
- **Dogeash's dog** (`app/components/DogMark.vue`): a guard dog's head, front on, ears up, watchful brows. It's drawn in one stroke weight with a marigold nose that matches the square in the wordmark.
- **The animation:** each line traces itself in, one after another. Then the nose pops in, it holds, fades, and starts again (a 2.8s loop). With reduced motion, it's the still drawing.
- **Layout:** the dog in a round tile, the **dogeash** wordmark under it, a short rule, then what's happening ("Signing you out…") and a line of detail. It follows light and dark mode.

**Admin sign-out** uses the same loader, with its own line: "Your admin session has ended. You'll need a new one-time code next time." Signing out now also forgets staff access in the browser, so the next sign-in checks it again.

**Small fix found on the way:** five sign-out buttons (site header, account menu, account nav, dashboard menu, account settings) were passing the click event through to sign-out. They now call it cleanly.

**Code:**
- `DogMark.vue`: the mark. Use `<DogMark />` still, or `<DogMark animated />`. It's sized with `class`, and its colour comes from the text colour.
- `AppLoader.vue`: the screen.
- `AppLogo.vue`: gained `static` (the wordmark as plain text rather than a link home).
- Animation keyframes are in `main.css` (`animate-dog-trace`, `animate-dog-nose`).

**Still using the kennel-watch GIF:** the sign-in panel and the "Open a store" page. I didn't touch those.

**Checked:** in the browser, in light and dark, with the animation running. Typecheck shows no new errors.

---

## 30. After signing in: choose where to go

Signing in no longer sends people straight somewhere. It ends on a **"Welcome back, Name — where would you like to go?"** screen with big link cards (the same style as after sign-up), showing only what fits that account. Most likely is first, as the dark main card:

1. **Carry on where you were.** Shown when a gated action sent them to sign in (booking a visit, messaging a store, opening an admin page).
2. **Admin console** for admins, or **Your inspections** for inspectors. Both say the one-time code comes next.
3. **"<Store name> dashboard"** for anyone on a store's team, plus **Your store's page** once the store is live.
4. **Find a guard dog**, **Your shortlist**, **Your account**, for everyone.

There are never more than 5 cards and never the same page twice. A plain buyer sees: Find a guard dog, Your shortlist, Your account. The "Welcome back" toast still shows, including how many saved dogs moved into the account.

**Code:**
- `app/utils/signInNextSteps.ts` decides the list.
- `app/pages/sign-in.vue` has a third step (`next`) after the password or code. It checks staff access fresh at that point.

**Checked:** typecheck (no new errors); the sign-in page compiles and loads. The choices screen was previewed with a sample admin who owns a live store. I couldn't sign in for real, so try it with your accounts.

---

## 31. Buyer dashboard: My dogs, Reviews, real checklists

**Migration:** `20261129000000_buyer_dashboard.sql`. Run on 6 Nov; live, both new tables exist and refuse visitors.

**My dogs is real now** (no more sample Bruno).
- **Add a dog you own**, whether or not it came from Dogeash: photo, name, breed, sex, birthday, weight, microchip, protection level, where it came from, since when, and notes. Only the name is required.
- **Photos** go in a private bucket, in a folder of the owner's own. They open through hour-long links.
- **Each dog's page:**
  - **Health:** vaccinations, treatments and vet visits, with given and next-due dates.
  - **Training log.**
  - **Coming up:** everything with a due date, most urgent first, each with a "Done" button.
  - Every line can be added, changed or removed in one dialog.
  - Edit the details, or remove the dog (asks first).
- **Status is worked out from the dates:** overdue, due within 30 days, or up to date. It's never stale.
- **Counts:** the sidebar's "My dogs" shows how many things need attention, and the overview panel shows each dog's next item.
- **Database rules:** owners only. Records can only go on your own dogs, photos only in your own folder. Visitors are refused. There's a cap of 20 dogs and 300 lines per dog.
- **Pages:** `/account/dogs`, `/account/dogs/new`, `/account/dogs/<id>`, `/account/dogs/<id>/edit`.

**Reviews** (`/account/reviews`), no longer "Coming next":
- **Waiting for your review:** stores where your visit is marked done and you haven't reviewed yet.
- **Your written reviews,** with the store's reply. Edit or delete them here.

**"Ready to reserve" is real:**
- email confirmed
- phone added
- home profile filled in
- met the dogs at a kennel (a visit marked done)
- ID check (still coming soon)

Anything not done links to where to do it.

**Shortlist price drops are real.** The dog's price is saved when it's shortlisted; existing shortlist items took today's price. The overview flags a dog that's now cheaper. The made-up sample drops are gone.

**Navigation:** phones no longer show the "Soon" sections in the tab row. Reservations and Gear orders still show "Coming next", because they need payments.

**New shared pieces:**
- `ConfirmDialog.vue`: "Are you sure?" for anything that can't be undone.
- `useOwnedDogs`
- the `myDogUpdated` toast

**Checked:**
- `npm run db:test`: 14 new checks, all pass.
- Typecheck: no new errors.
- The record page, add-record dialog, overview and form checked in the browser with a sample account. Nothing is wider than a phone screen.

---

## 32. Visit cards: the date no longer stretches, and a cleaner layout

**The bug:** on Visits and bookings, the calendar leaf (weekday, date, month) stretched to the full height of the card, so its border ran to the bottom. The card is a row, and rows stretch their items to the tallest one by default. The leaf is now pinned to the top and sized to its content: the same small leaf on every card.

**The card, redesigned** (`VisitCard.vue`; the same card is used in the store dashboard):
- **Header:** the visit type on the left, the status on the right.
- **Detail lines with icons:** the store (or the buyer, on the store's side), day and time, where, and which dogs. On wider screens they sit in two columns.
- **Your note** shows as a quote. **The store's note** shows in a grey box.
- **Actions** (Cancel, View store, Review) sit along the bottom, under a line, across the whole card instead of squeezed under the text.
- **Past visits** get a grey date band instead of the whole card fading.
- **Wording fix:** a home visit now reads "At your home" for buyers. It used to say "At the buyer's home" to the buyer.

**Checked:** in the browser, desktop and phone, with sample visits. The leaf is the same 76px on every card and the month sits inside it. Typecheck shows no new errors, and the store-dashboard pages that use the card compile.

---

## 33. Store profile: switch steps freely, check on Save; and garbled characters repaired

### Editing the store profile
**Before:** when editing an already-set-up profile, clicking another step tried to save the open one first. If anything on it didn't pass the checks, you were stuck there with red errors. On top of that, the History step always counted as "changed", even when nothing was, because the comparison was sensitive to the order of keys. So the checks could fire with no real edits.

**Now (editing):**
- **Open any step, any time.** Nothing is checked when you move between steps.
- **Your changes are kept** across steps until you save. Each step with unsaved changes gets a small marigold dot in the step list, and the footer says "Unsaved changes" or "Unsaved changes in 2 steps".
- **Save changes** checks and saves everything at once, from whichever step you're on. If something needs fixing, it opens that step with the field marked in red: "Some fields in Your store need a look."
- Changed means a real change. Key order doesn't count, and "2014" equals 2014.

**First-time setup** is unchanged going forward: each step is checked and saved as you continue. Going **back** never blocks now.

**Checked** with a sample store in the browser:
1. Made the tagline too short, opened "About the kennel": it opened, with a dot on "Your store".
2. Pressed Save: back to "Your store", the tagline marked red, nothing saved.
3. Fixed it, moved steps, saved: the fix was saved from the other step.

Typecheck shows no new errors.

### Garbled characters in the database ("Mon‚ÄìSat")
**Cause:** when I copied migrations and the seed to your clipboard, the copy tool read UTF-8 text as Mac Roman. Every character outside plain ASCII arrived garbled: "–" became "‚Äì", "·" became "¬∑", "₦" became "‚Ç¶". This affected:
- the sample data: store hours, the dogs' files (all 18 sample dogs), and more
- the code of a few functions: price-drop notifications (₦), admin search results, listing-review notifications and report labels (·)

**Fix:** migration `20261130000000_fix_garbled_text.sql`. Run on 6 Nov; live, all stores and dogs read clean (0 garbled sequences left). It's written in plain ASCII, so copying can't garble it. It:
- adds `fix_garbled_text()`, which turns each garbled sequence back into its character and changes nothing else
- repairs every text and JSON column in every table
- re-creates every function whose code was garbled

It's safe to run twice. Tested: garbled data and function code come back right, normal text is untouched, and visitors can't call it.

**From now on** I copy with UTF-8 forced on (`LC_ALL=en_US.UTF-8 pbcopy`).

## 34. Optional fields marked; public pages from the dashboard (6 Nov)

### "(optional)" beside fields that can be left empty
`FieldShell` and `Fields` now take `optional`, which shows a muted "(optional)" beside the label (`OptionalTag.vue`). Required fields carry no tag. Where a hint used to start with "Optional:", the tag replaced it. Marked:
- **Store's dog form:** born, hips and elbows, vaccinations, microchip, titles, sire, dam, best suited to, traits, more photos, videos
- **Store profile:** area, state, opening hours, where you deliver, owner's role, short bio, credentials, what you offer, banner, logo
- **Buyer's "My dogs":** everything except the name (photo, breed, sex, born, weight, microchip, level, where from, since, notes)
- **Dog record dialog:** by, note; it also says "Give at least one of the two dates"
- **Application:** the note; **visit settings:** the pause note; **settings:** city; **report:** details (except for "Something else", where they're required)
- **Admin:** care provider's person, areas and credential; announcement link; inspection note

### Store dashboard → public store page
Two problems:
1. **The page showed old data.** The listing of live stores and dogs is read once per page load. Edit the profile, publish a dog, or approve a store in admin, then click through, and the public page still showed the old version (or "not found" for a dog just published). **Fix:** leaving `/dashboard` or `/admin` for the public site now re-reads it first (`middleware/catalog-fresh.global.ts`; the loading moved into `composables/useCatalog.ts`, which the start-up plugin also uses). Checked: the jump re-read 5 stores and 18 dogs, and the page opened.
2. **A store not live yet linked to "This gate is locked" (not found).** Drafts and stores in review have no public page. **Fix:** "View public store" (sidebar and store menu) and the "Store health" panel's links only show once the store is inspected; before that the menu says "Public once inspected".

Links opening in a new tab (admin, "View listing") were already fine: a new tab loads fresh.

## 35. Fewer toasts: none that repeat what the page shows (6 Nov)
A toast now only appears when nothing on the page says the same thing. Removed:
- **The "things to fix" toast** on sign-in, sign-up, forgot password, and settings (details and password). The fields already show their errors in red.
- **The welcome toasts** after signing in ("Welcome back"), creating an account, and opening a store. The page itself already says "Welcome back, Ada" above the choices.
  - Saved dogs moved into the account ("2 saved dogs from this browser are now in your account.") are now in the welcome text on the page instead (`savedDogsMovedText` in `utils/account.ts`).
  - If the draft store fails to save on "Open a store", a red note on the welcome screen says so (it used to be a toast).
- **The "Request sent" toast** from the booking dialog, which already shows its own "Request sent" screen.

Kept: toasts where the page doesn't change or the dialog closes, like a message sent, a dog saved, settings saved, undo on the shortlist and cart, and admin actions.

Checked in the browser: an empty sign-in and an empty sign-up show the field errors and no toast. The signed-in welcome wasn't tested (it needs your sign-in). Typecheck shows no new errors.

## 36. Payments with Paystack, part 1: reserving a dog (6 Nov)

### The money rules (your choices)
- **Deposit:** 10% of the price; it holds the dog for **5 days**.
- **Balance:** paid through Dogeash too. Dogeash holds everything until the buyer confirms the handover.
- **Commission:** 5%, taken from the store's payout. Buyers pay the listed price, nothing more.
- **Refunds (my defaults; tell me if you want them different):**
  - the store cancels → everything paid is refunded
  - the buyer cancels, or 5 days pass without the balance → the dog goes back on sale and the deposit **waits for Dogeash** to decide (refund it, or release it to the store)
  - money that arrives for a dog someone else already paid for (or for a lapsed checkout) is refunded automatically
- Once paid in full, the buyer can't cancel online. A problem at the handover goes through Dogeash, and the money stays held.

### How it works
1. **Dog page:** "Reserve with a ₦320,000 deposit" (marigold, top of the price panel). Signed out → the sign-in dialog. The dialog shows the price, deposit and balance, and what happens to the money, then "Pay ₦320,000 deposit".
2. **The site's server** (`server/api/payments/reserve`) asks the database to start the reservation as the signed-in buyer (the rules apply: listed dog, not your own store's, not blocked, nobody else paying). Then it opens **Paystack's hosted checkout** (card, transfer, USSD). The deposit is fixed by the database, not the browser.
3. **Back from Paystack** to `/account/reservations?reference=…`: the server checks the payment **with Paystack's API** and records it with the secret key. Only then is the dog marked reserved, and the buyer and the store's owners and managers are notified. **Paystack's webhook** (`/api/paystack/webhook`, signature-checked) does the same if the buyer closes the tab. Recording twice changes nothing.
4. **Reservations page** (`/account/reservations`, now in the nav):
   - the hold with its countdown, a progress line (deposit → balance → handover), and price, paid and due
   - "Pay the balance", "Cancel reservation", and, once paid in full, "I have Rambo: confirm the handover" (confirm dialog)
   - ended ones say what happens to the money ("Dogeash will contact you…", "₦320,000 is on its way back…")
5. **Handover confirmed:** the dog is marked sold and the store's payout (price less 5%) is recorded as due.
6. **Holds end** every 15 minutes (pg_cron), and also whenever someone starts a reservation or pays. An unfinished checkout holds the dog for 30 minutes so two buyers can't pay at once.
7. While a buyer has paid, the store **can't** put the dog back on sale, sell or withdraw it from the dashboard.

### Files
- **Migration** `20261201000000_payments.sql`:
  - tables: reservations, payments, refunds, payouts, store payout accounts
  - functions: `money_rules`, `start_reservation`, `start_balance_payment`, `cancel_reservation`, `confirm_handover`, `expire_reservations`, `record_payment`, `record_refund`
  - nobody writes the tables directly; buyers see only theirs, stores' owners and managers see their reservations, and only owners see payouts
- **Server:** `server/utils/paystack.ts` (API calls, webhook signature), `server/utils/payments.ts` (checkout, settle, refund), and `server/api/payments/{reserve,balance,verify}.post.ts`, `server/api/paystack/webhook.post.ts`
- **App:** `utils/reservations.ts`, `composables/useReservations.ts`, `ReserveDialog.vue`, `AccountReservationCard.vue`, `pages/account/reservations.vue`. `ConfirmDialog` gained a marigold `tone`.
- **Tests:** 40 new checks in `npm run db:test` (amounts, who can do what, double recording, guards, lapsed checkouts, late payments, refunds, expiry). All pass.

### What you do
1. **Run the migration** in the SQL Editor. It's ASCII-only and copied with UTF-8.
2. **Turn on pg_cron** (Database → Extensions → pg_cron), then run this once: `select cron.schedule('dogeash-expire-reservations', '*/15 * * * *', 'select public.expire_reservations()');` (the migration schedules it by itself if pg_cron was already on).
3. **Paystack:** create the account, then copy the **test secret key** (Settings → API Keys & Webhooks).
4. **In `.env.local`** add `PAYSTACK_SECRET_KEY=sk_test_…` and `SUPABASE_SECRET_KEY=…` (Supabase → Project Settings → API Keys → secret). Both are server-only. Restart `npm run dev`.
5. **Once the site is online**, set Paystack's webhook URL to `https://<your site>/api/paystack/webhook`. Locally, coming back from checkout records the payment, so the webhook isn't needed to test.
6. Test with Paystack's test card `4084 0840 8408 4081`, any future expiry, CVV 408.

### Not built yet (part 2)
- **Store side:** Payouts page with bank account (checked by Paystack), payouts sent by Paystack Transfers, a reservations list in the dashboard, and the store cancelling (with automatic refund).
- **Admin side:** payments, reservations waiting for a decision (refund or release), refunds and payouts.

Not tested end to end yet: it needs the migration and your test keys. Checked in the browser: the button and the sign-in dialog on a dog page, and the reservation cards on desktop and phone. Typecheck shows no new errors.

## 37. Payments, part 2: stores, payouts and Dogeash's decisions (7 Nov)

Part 1's keys and migration were checked live on 7 Nov:
- both keys work, and they're the right kind (Paystack test secret, Supabase secret)
- visitors are locked out of the payment tables and functions
- Paystack accepts the site's checkout request

### Store dashboard → Payouts (`/dashboard/payouts`, now built)
- **Who sees what:** a new `sales` permission lets owners **and managers** see reservations. Money and the bank account stay owner-only (`payouts`).
- **Top tiles (owners):** held by Dogeash, due to you, paid out.
- **Reservations:**
  - each one shows the dog, the buyer's name, and their **phone while there's a handover to arrange**, plus the state ("Waiting for the balance · 3 days left", "Arrange the handover…"), and price, paid and "You get" (price less 5%)
  - **Cancel and refund the buyer** asks for a reason, which the buyer sees; everything they paid goes back through Paystack straight away
- **Bank account (owners):** choose the bank (a new searchable `SearchSelect`, with Paystack's bank list) and type the 10-digit number. Paystack checks it with the bank and returns the account name. Dogeash keeps the bank, that name and the last 4 digits; Paystack keeps the full number as a transfer recipient. Saving sends any payouts already waiting.
- **Payouts list:** amount, due / sending / paid / "not sent yet".

### When money moves
- **Handover confirmed** (now through the server, `/api/payments/handover`): the payout (price less 5%) goes out **at once** by Paystack Transfer. With no bank account yet, it waits, and the owner is notified "Add your bank account to be paid".
- **Store cancels:** refunds go out at once.
- **Payment that can't be used:** the refund goes out at once (as in part 1).
- **Every refund and payout is claimed first**, so it's never sent twice. Paystack's webhook confirms it later (`refund.processed`, `transfer.success/failed/reversed`). The store is notified when a payout lands.
- If Paystack asks for an OTP on transfers, the payout is marked "failed" with a note to turn that off in Paystack's settings, then retry.

### Admin → Payments (`/admin/payments`, new in the sidebar)
- **Tiles:** held by Dogeash, commission earned, paid to stores (and refunded), needs attention.
- **Tabs:** Needs a decision, In progress, All, Refunds, Payouts. Export to CSV.
- **Needs a decision** (a buyer cancelled, or a hold ran out): **Refund** (back to the buyer) or **Release** (to the store, less 5%), with a note for the buyer. Both sides are told; it's in the audit log.
- **Retry** on any refund or payout that failed (or a payout that was waiting for a bank account).

### Files
- **Migration** `20261202000000_payments_part2.sql`:
  - functions: `store_reservations`, `store_cancel_reservation`, `admin_decide_deposit`, `admin_money`, and for the server only `claim_refund`, `claim_payout`, `record_transfer`, `record_refund_by_payment`
  - the "add your bank account" notification
- **Server:**
  - `server/utils/payments.ts`: `sendDueMoney`, `sendRefund`, `sendPayout`, `sendStorePayouts`
  - `server/api/payouts/{banks.get,account.post}.ts`, `server/api/payments/{handover,store-cancel}.post.ts`, `server/api/admin/{deposit,money-retry}.post.ts`
  - the webhook now handles transfers too
- **App:**
  - `composables/useStoreMoney.ts`, `composables/useAdminMoney.ts`, `utils/fetchError.ts` (shared)
  - `components/SearchSelect.vue`, `dashboard/DashboardPayoutAccount.vue`, `dashboard/DashboardStoreReservation.vue`
  - `pages/dashboard/payouts.vue`, `pages/admin/payments.vue`
- **Tests:** 25 new checks (store's view and cancelling, admin decisions and audit, claiming refunds and payouts once, bank account privacy, transfer confirmation, the money overview). All pass.

### What you do
1. **Run the migration** `20261202000000_payments_part2.sql` (copied, ASCII-only).
2. **Paystack settings:**
   - turn off **"Confirm transfers with OTP"** (Settings → Preferences), so payouts can go out by themselves
   - in **live mode**, Transfers need Paystack to enable them on the business
3. **Webhook URL** (once online): `https://<your site>/api/paystack/webhook` handles payments, refunds and transfers.

### Checked
- The bank list comes from Paystack through the site's server, and searching "guar" finds Guaranty Trust Bank.
- The store's reservation cards and the bank account card were checked in the browser with sample data.
- Typecheck shows no new errors.

**Not yet tried:**
- signed-in flows (paying, cancelling, saving a bank account) and the admin page in the browser: they need your accounts
- Paystack's test-mode check of a real account number, which may be limited

### Live test, 7 Nov
- **Deposit:** RSV-A3AB3349 (Rambo), ₦320,000 by bank transfer. Recorded, Rambo reserved, buyer notified. (No store notice: K9 Guardian is a sample store with no team.)
- **Cancel:** you cancelled as the buyer. Rambo went back on sale, and the deposit waited for a decision.
- **Refund decision:** Admin → Payments → Refund recorded the decision and the audit entry, notified the buyer, and sent the refund to Paystack (refund 19042033, ₦320,000). Paystack has it as **pending**; Dogeash shows "sending".
- **Gap found and fixed:** a refund or payout was only marked done by Paystack's webhook, which can't reach a laptop (or may be missed online). New `POST /api/payments/sync` (`syncSendingMoney` in `server/utils/payments.ts`) asks Paystack directly about anything still "sending". It runs when Admin → Payments opens, and on a buyer's Reservations page or a store's Payouts page when something is on its way.

## 38. Care providers: their own dashboard (7 Nov)

### How a provider gets in
- **Dogeash invites them.** Admin → Care directory → ⋯ → **Invite to manage**, with their email. There's a new "Managed by" column (names, or "invited: email").
- The invitation waits in their account (a dark card on the account overview, plus a bell notification if they already have an account). **Accept** takes them to the dashboard.
- Listings stay Dogeash-checked: the **name, type, city, credential and badge are Dogeash's**; the provider edits the rest.

### Provider dashboard (`/provider`; from the account menu, and offered after sign-in)
- **Bookings tab:**
  - **To answer:** Confirm, or "Can't make it" (a reason is required, and the buyer reads it)
  - **Coming up:** Mark done (with an optional note: "Next booster in a year"), and **Add to {dog}'s record**
  - **Earlier:** past confirmed ones to mark done, and how many record lines were added
  - each card shows the buyer, their **phone while the booking is coming up**, the dog, and the buyer's note
- **Your listing tab:**
  - person in charge, price from, areas, opening hours, About
  - "Taking bookings" and "I visit dogs at home" switches
  - the **days and times** buyers can book
  - Dogeash's facts shown on the side, read-only
- The public provider page now shows **About** and the hours.

### Buyers
- **"Book appointment" now really sends** (it was a preview), on the provider's own days and times.
- Buyers with dogs in My dogs **pick the dog**, and a checkbox (on by default) lets the provider **add this visit to the dog's record**. The provider sees only the lines they add.
- **Visits and bookings** now has a "Care appointments" section: cancel, see the provider's answer and note, and "See Bruno's record" once done.
- **Notifications** go both ways: the provider gets new requests and cancellations; the buyer gets confirmed, declined, done, and "Kuje Veterinary Clinic added to Bruno's record". There's a new "care" bell icon.

### Rules the database enforces
- Bookings must be from tomorrow, at most 2 months ahead, on the provider's days and times, home visits only if offered, the listing taking bookings, the dog the buyer's own, and at most 10 waiting per buyer.
- Only the provider's people answer; buyers can only cancel.
- Record lines need the owner's permission **for that booking**, the booking confirmed, at most 10 per booking, and are signed with the provider's name. The owner can still edit or delete them, but can't pass a line off as the provider's or the reverse.

### Files
- **Migration** `20261203000000_care_provider_dashboard.sql` (ASCII, copied):
  - new listing columns: about, hours, weekdays, slots, taking_bookings
  - new tables: care_provider_members, care_provider_invites, care_bookings
  - owned_dog_records gains provider_id and care_booking_id
  - functions: `admin_invite_provider`, `admin_provider_managers`, `my_provider_invites`, `accept_provider_invite`, `provider_save_profile`, `set_care_booking_status`, `provider_bookings`, `provider_add_record`, `provider_booking_records`
- **App:**
  - composables: `useCareBookings.ts`, `useProviderInvites.ts`, `useProviderDashboard.ts`
  - components: `care/CareBookingCard.vue` (both sides), `account/AccountProviderInvites.vue`
  - pages and middleware: `pages/provider.vue`, `provider/index.vue`, `provider/listing.vue`, `middleware/provider-member.ts`
  - `BookingDialog` gained `ownedDogs`, `confirmText` and record sharing; `AccountDogRecordDialog` gained `hideBy`
  - the session loads `providers` beside `stores`
- **Tests:** 25 new checks. All pass.

### Important: run the migration now
The site reads the new listing columns. **Until the migration runs, the catalogue query fails and the site falls back to sample data.**

### To try it
1. Admin → Care directory → Kuje Veterinary Clinic → ⋯ → Invite to manage, with a second account's email.
2. Sign in as that account and accept.
3. As a buyer, book Kuje from its page for one of My dogs, with sharing on.
4. As the provider: Confirm, then Add to the dog's record.
5. As the buyer: see the line on the dog's record.

### Checked
- The care booking cards (provider and buyer sides) in the browser.
- The signed-out "Sign in to book" prompt.
- Typecheck shows no new errors.
- The signed-in flows aren't tried yet: they need your accounts.

## 39. Invitation emails with Resend (7 Nov)

**Why Brevo is there:** on 3 Nov you chose Brevo for Supabase's own emails (sign-up codes, password resets) because you had **no domain**, and Brevo only needs one verified sender address. That stays as it is. Resend is for the **site's own emails**, starting with invitations.

### What happens now
When an owner invites someone to the store team (Team page), or Dogeash invites someone to manage a care listing (Admin → Care directory), the site's server emails them:
- "Join K9 Guardian Kennels on Dogeash" (with the role and what it covers), or "Manage Kuje Veterinary Clinic on Dogeash"
- **No account with that email:** the button is **Create your account** → sign-up with the email already filled in → back to the account, where the invitation waits.
- **Already has an account:** the button is **Sign in to accept** → sign-in with the email filled in → the account.
- The bell notification and the invitation card in the account work as before. The email is extra.
- Only the invitation's maker (the store owner, or Dogeash) can trigger the email, and only within 15 minutes of making it, so it can't be used to send mail at will.
- **No Resend key yet:** nothing is sent, and the toast says the invitation waits in their account (admin's says email isn't set up).

### Files
- `server/utils/email.ts`: `sendEmail()` through Resend's API, and a plain branded HTML layout (logo, lines, marigold button, the link as text, small print)
- `server/api/invites/email.post.ts`: checks who's asking, picks the sign-up or sign-in link, writes the email
- migration `20261204000000_invite_emails.sql`: `account_exists(email)`, server only (nobody else can fish for accounts)
- `useStoreTeam.invite` and `useAdminCare.invite` send the email after creating the invitation
- sign-in and sign-up fill in `?email=`
- `nuxt.config.ts` runtimeConfig, `.env.example`
- tests: 3 new checks; all pass

### Checked
- The email's design (previewed in the browser; the "·" needed a charset, fixed).
- Sign-up and sign-in arrive with the email filled in.
- Typecheck shows no new errors.
- No real email sent yet: that needs your Resend key and domain.

### What you do
1. **Run the migration** `20261204000000_invite_emails.sql` (copied).
2. **Resend:**
   - create an account at resend.com
   - **add and verify your domain** (DNS records at wherever the domain is registered). **Without a verified domain, Resend only delivers to your own Resend account's email**, so real invitees won't get anything.
   - create an API key
3. **In `.env.local`:** `RESEND_API_KEY=re_…` and `EMAIL_FROM="Dogeash <hello@yourdomain.com>"`, then restart `npm run dev`.
4. **Optional, later:** once the domain is verified, Resend can also replace Brevo as Supabase's mailer (Authentication → SMTP: host `smtp.resend.com`, port 465, user `resend`, password = the API key), so all emails come from your domain.

### Update, 7 Nov: Brevo for now
You don't have a domain yet, so the site's own emails go through **Brevo** too, from the sender address already verified there. Resend stays built in for later.
- `server/utils/email.ts` sends through Brevo's API when `BREVO_API_KEY` is set, and through Resend when `RESEND_API_KEY` is set (Resend wins if both are). The emails and links are identical either way.
- **What you do:**
  1. Run the migration `20261204000000_invite_emails.sql`, if you haven't.
  2. In Brevo, open **Settings → SMTP & API → API Keys** and create an **API key** (starts `xkeysib-`). It isn't the SMTP key Supabase uses.
  3. In `.env.local`, add `BREVO_API_KEY=xkeysib-…` and `EMAIL_FROM="Dogeash <your verified sender>"`, then restart `npm run dev`.
- **Keep in mind:** a Gmail sender sent through Brevo often lands in spam or is refused by other providers. That's fine for testing; for real users, the domain fixes it.
- **Later, with a domain:** verify it in Resend, set `RESEND_API_KEY` and an `EMAIL_FROM` on the domain, and remove `BREVO_API_KEY`.

## 40. No blank page on refresh (7 Nov)
**Where it was blank:** the admin pages render only in the browser (`ssr: false`). On a refresh or a fresh visit there was nothing on screen until the app had loaded and checked the session, the staff role and the one-time code. Every other page is rendered by the server, so it arrives already drawn.

**Fix:** `app/spa-loading-template.html` is Nuxt's loading screen for browser-only pages, built to match the existing loader:
- the dog traces itself in over the wordmark, with "Opening the admin console…"
- it's always dark in the admin (and follows Day/Night elsewhere)
- it's still for reduced motion
- it's plain HTML and CSS, because none of the site's styles have loaded at that point

`nuxt.config.ts` sets `spaLoadingTemplateLocation: 'body'`, so it **stays until the page is actually ready** (after the access checks), not just until the app starts.

**Checked:** a refresh on `/admin` while signed out shows the loader, then goes to sign-in, with no blank moment. It took about 3.5 s on the dev server (production is faster). Normal pages don't include it.

## 41. Placeholders while lists load (8 Nov)
Pages arrive drawn from the server, but some lists load just after: your reservations, care bookings, reviews, My dogs; the store's dogs, inbox, visits, reviews, team, payouts; the provider's bookings; every admin table. Before, some of them first said "No reservations" or "Nothing booked yet", or a bare "Loading…", then switched to your real items.

**Now:** each of those shows grey placeholders shaped like what's coming until its data has arrived. Only then does it show your items, or the "nothing here" message if there really is nothing.
- **New `ListSkeleton.vue`, one component in four shapes:**
  - `card`: reservations, bookings, reviews, provider bookings
  - `tile`: My dogs
  - `row`: payouts, team, inbox, the overview's panels
  - `table`: the admin tables and the store's dog list
- It uses the site's shimmer, works in Day and Night, and screen readers hear "Loading…".
- **Load tracking added where it was missing:** the store inbox, store reviews, care bookings, your reviews, the admin store list, the care directory and the audit log.
- **Also gated on loading:** the store's Payouts tiles (no "₦0" flash), the review average and count, and the inbox's "0 unread" line.
- Lists the server already loads with the page (your messages, kennel visits, saved dogs, notifications) needed nothing.

**Checked:** all 37 changed files compile (Vue's compiler) and the type check is clean. The four shapes were checked in the browser in Day and Night. Not seen in real use with your account, because they appear only for a moment while signed in.

## 42. Provider form: managers' emails and listing (8 Nov)

### Why the invitation email didn't arrive
The invite to `ju***5@gmail.com` (Kuje, 7 Nov 16:45) never reached Brevo: its log has only sign-up codes. The cause: **`.env.local` was last fixed at 16:41, but the dev server only reads it when it starts.** It was still running with the old `EMAIL_FROM` (the address ending "2@gmail.com", not a Brevo sender), so Brevo refused it, and the admin message only said "email isn't set up".

**Fixed:**
- **Editing `.env.local` now restarts the dev server** (`watch` in `nuxt.config.ts`).
- The real reason comes back from the server and is **shown in the form** ("invited, but the email wasn't sent (reason)", with **Try again**), and logged on the server.
- **Email it again** beside every waiting invitation. That's how to send the Kuje one now: Care directory → Kuje → ⋯ → Edit or Invite to manage → "Email it again".

### Adding a provider
The Add / Edit provider form now has:
- **Who manages it:** type one or more emails, pressing Enter (or a comma) after each. Each becomes a chip; anything that isn't an email is dropped with a message. When editing, it lists who already manages it and who's invited but hasn't accepted, each with "Email it again".
- **Listed / Hidden switch:** "Listed: buyers can find and book it" or "Hidden: only Dogeash and its managers see it". It's on by default; keep it off while the managers set up, then list it. The button says **Add and list** or **Add, hidden for now**.
- On save: the business is saved, everyone added is invited and emailed, and the form closes with "Invitations emailed to 2 people". If any email fails, the form stays open saying which and why.
- "Invite to manage" in the ⋯ menu now opens this form (the separate invite dialog is gone). Hidden providers are marked **hidden** in the table.

### Hidden listings in the database
- Migration `20261205000000_care_listing.sql` (ASCII, copied): `care_providers.listed` (existing ones stay listed).
- Visitors and buyers read listed providers only; a provider's managers and Dogeash read theirs even while hidden.
- `admin_save_provider` takes `listed`.
- The catalogue asks for listed ones explicitly.
- A buyer's earlier bookings still show if a provider is later hidden.

**Run the migration now:** the catalogue asks for the new `listed` column, so until it runs, the site falls back to sample data.

### Checked
- 7 new database checks (hidden from visitors and buyers, seen by Dogeash and by its invited manager, listing it, edits keep it listed). All pass.
- In the browser: email chips, the bad-email message, and the "email wasn't sent" panel with its reason.
- Typecheck shows no new errors.
- **Update:** "Email it again" and "Try again" now show a toast either way: "Invitation emailed" (with the address), or "The email to … wasn't sent: <reason>". Saving the form with invitations does the same: "Invitations emailed to 2 people", or which addresses weren't emailed.

## 43. Invitation links open a tailored sign-up (8 Nov)
The invitation email's link now carries the invitation (`/sign-up?invite=<id>&kind=provider|store`, or `/sign-in?…` if the email already has an account), so the page is built around it:
- **Sign-up:**
  - the heading reads "You're invited to manage **Kuje Veterinary Clinic**" (or "Join **K9 Guardian Kennels**")
  - a dark card replaces "What brings you here?": "Care provider · Vet, Abuja" (or "Store team · Manager") and what it means
  - a "Not you?" link goes to the ordinary sign-up
  - the side panel speaks to providers or store teams
  - the **email is filled in and fixed** to the invited address, because the invitation is matched to it
  - the button reads "Create account and manage Kuje Veterinary Clinic"
- **Accepted for them:** after the code is confirmed, the invitation is accepted automatically. The welcome says "You now manage Kuje Veterinary Clinic", with **Open your dashboard** (`/provider`, or `/dashboard` for a store team) as the first choice.
- **Sign-in:** "Sign in to **accept**", with the same card and the email filled in. Once signed in, it's accepted and the dashboard leads the choices.
- **If accepting fails** (withdrawn, or a different email used), a clear note says so, and the invitation can still be accepted from the account.
- The service type and listing come from what Dogeash entered; the invitee doesn't choose them. Self-signup for uninvited providers is left for later (as a reviewed application).

**Files:**
- migration `20261206000000_invite_links.sql`: `invite_preview(kind, id)`, readable by anyone with the link (the id is random and only emailed to that person)
- `composables/useInviteLink.ts`: reads it with the page on the server, and holds the words, panel and accepting
- `components/auth/AuthInviteCard.vue`
- sign-up and sign-in pages, and the email route's link

**Checked:** 3 new database checks pass, the typecheck is clean, and both pages load normally with no link or a bad link. The tailored page isn't seen yet: it needs the migration.
- **Live on 8 Nov:** your first run of `20261206000000_invite_links.sql` worked; the "already exists" error came from running it a second time. Checked with the real Kuje invitation: sign-up and sign-in show the provider heading, card and panel from the first paint (the layout now picks the panel from the link), the email is fixed, and the button says "Create account and manage Kuje Veterinary Clinic". The store help note is hidden on invitations.

## 44. Providers can't book themselves (8 Nov)
Your test showed the Kuje invitation works end to end: your second account accepted it and manages Kuje. But that account could then book Kuje too (Microchip scan, 11 Nov 15:00, which it confirmed itself).

**Now:**
- **The database refuses it:** someone who manages a listing can't book it ("You manage this listing, so you can't book it"). A **hidden** (unlisted) listing can't be booked either. Migration `20261207000000_no_self_booking.sql` (ASCII, copied).
- **On the site:** wherever "Book appointment" or "Book" appears for a listing you manage (its page, the care directory, a store's care team), it's **"Your listing"** instead, linking to your provider dashboard.
- **On your own provider page:** a dark note says "This is your listing. Buyers see it like this…", with **Edit your listing** and **Bookings**.
- **Tests:** 3 new checks (a provider can't book their own listing, a buyer still can, a hidden listing can't be booked). All pass.
- Visitors still see "Book appointment" as before (checked).

**Removed (8 Nov):** the self-booking from your test (Microchip scan, 11 Nov 15:00); no dog record lines were tied to it.

## 45. Clear selected tabs; short lists that open full details (8 Nov)

### Selected tab
The "outline" toggle (every admin tab bar, and Sex on My dogs) showed the selected tab as a faint tint. Selected is now **solid**: white with dark text in the admin (Night), ink with light text in Day, and it stays solid on hover. One change in `components/ui/toggle/index.ts`.

### Lists show a few facts; a click opens everything
New **`DetailDialog.vue`**:
- a title and subtitle, and labelled groups of facts (two to a line, never an empty half-cell; long text full width; links to the store, the person or the public page)
- an optional picture or extra content
- a bottom bar, pinned while the details scroll, with **Close** always there and the item's actions beside it
- on phones, the actions share one row in equal widths, with Close underneath; wider, it's one line with Close on the left; buttons are compact (36px)

**Admin:**
- **Payments:** reservations show dog, ref, store, paid and status. The dialog has the buyer and email, price, deposit, hold, why it ended and the deposit decision, with **Refund** / **Release**. Refunds and payouts show dog, amount and status; the dialog has why, failures, the bank-account state and **Retry**.
- **Listings:** dog (photo, file number, store), status, price. The dialog has the photo, breed, level, city, dates, the store and its status, Dogeash's note, the actions (take down, approve …) and the public page.
- **Visits:** when, store, status. The dialog has where, service, asked, last change, the store's note, buyer and email, and **Nudge**.
- **Care directory:** provider, type, city, managed by. The dialog has the whole listing (listed or hidden, credential, badge, about, areas, price, hours, booking days and times), managers, invitations and stores, with **Edit or invite managers** and **Remove**.
- **Reviews:** stars, store, two lines of the review, author. The dialog has the full text, the store's reply, the author's email and the public page, with **Remove review**.
- **Reports:** kind, reason, what it's about, two lines of details. The dialog has everything, the reported conversation (read on request, logged) and **Resolve** / **Dismiss** / **Act in …**. Resolve and Dismiss stay on the card too.
- **Unchanged:** People and Stores already open full detail pages. Applications keeps its full cards, because they're the working space for documents and inspections.

**Elsewhere:** the "Earlier" reservations on a buyer's **Reservations** page and on a store's **Payouts** page are now one-line rows (`SummaryRow.vue`: dog, store or buyer, status, amount). The full card opens in the dialog.

**Checked:**
- In the browser, on phone and desktop: the selected tab, a row opening the dialog, the bottom bar on both sizes, and no empty cells.
- Every changed file compiles, and the typecheck is clean.
- Not tried in your admin with real data.
- **Bottom bar, refined after your feedback:**
  - It's **one compact row on every screen**: about 48px tall, Close (small) on the left, the actions on the right. On phones the actions share the space and a long label wraps rather than being cut.
  - Labels are shorter where the title already says it: **Refund** / **Release**, **Edit**, **Open**.
  - **Each dialog has one main action in marigold**, and the rest are outline (or red for removing and taking down):
    - Payments: Release is marigold, Refund is outline
    - Listings: Approve or Put back live is marigold, Take down is red, Send back is outline
    - Care directory: Edit is marigold, Remove is red
    - Visits: Nudge is marigold
    - Reports: Resolve is marigold, Dismiss and Open are plain

## 46. The dog mark is the logo, the icons and the share image (8 Nov)
- **Logo** (`AppLogo.vue`): the dog mark, in its full stroke, sits beside the "dogeash" wordmark everywhere the logo appears: the site header, the store dashboard, the sign-in and sign-up pages. It follows Day/Night (ink strokes, marigold nose), with a slightly heavier stroke so the face reads at header size. The loader keeps its large animated dog and shows the wordmark alone (`:mark="false"`).
- **One drawing for everything:** the mark's paths moved to `app/utils/dogMarkPaths.mjs`, used by `DogMark.vue` and the icon script. `DogMark` gained `weight` (stroke width).
- **Icons and share image**, made by `npm run render:icons` (`scripts/render-icons.mjs`, which uses the resvg renderer already in the project) into `public/`:
  - `favicon.svg` and `favicon.ico` (16, 32, 48): the mark on a dark rounded tile, heavier at 16px so it still reads
  - `apple-touch-icon.png` (180), `icon-192.png`, `icon-512.png`, and `icon-maskable-512.png` (the mark inside Android's safe circle)
  - `og-image.png` (1200 × 630): the mark, the wordmark with its marigold square, "Trained guard dogs from kennels we inspect in person.", and the hazard stripe
- **PWA:** `public/site.webmanifest` (name, standalone, dark theme, the three icons).
- **Head tags** (`nuxt.config.ts` and `app.vue`): the icons, the manifest, theme-color for Day and Night, app name tags, and Open Graph and Twitter share tags (the share image, its size, its alt text, a large card).
- **`SITE_URL`** (optional, in `.env.example`): once the site is online, set it, for example `https://dogeash.ng`, so share previews get the image's full address. WhatsApp and Facebook need that.

**Checked:**
- All 8 files are served with the right types, and the head tags are present.
- The logo checked in Day and Night, in the header and on sign-in.
- The icons and share image looked at after generating.
- Typecheck shows no new errors.

## 47. Fourteen fixes and features in one batch (9 Nov)
**Migration:** `supabase/migrations/20261209000000_nov9_batch.sql`. Run it in the SQL Editor. Until it runs, the site can't read the new columns and shows sample data.

1. **Logo.** The dog mark replaces the "o" in "dogeash" in the header and dashboard (`AppLogo` / `AppLogoMark`, `variant="inline"`). The mark stands beside the word on sign-in and sign-up (`lockup`). The loader shows just the word. `npm run render:icons` also writes `public/logo.svg`, `logo.png`, `logo-on-dark.svg` and `logo-on-dark.png`.
2. **"Ready to reserve" steps now open their pages.** `AccountReadiness` used `<component :is="'NuxtLink'">`, which never resolved. Each step is now a real link, rendered by `AccountReadinessStep`.
3. **Dates.**
   - A booster or next date can't be before the done date, and a done date can't be in the future (`owned_dog_records`).
   - A dog can't join you before it was born (`owned_dogs`).
   - Checked in the forms (`AccountDogRecordDialog`, `AccountDogForm`, with min/max on the inputs) and in the database. Providers adding records get the same messages (`recordError`).
4. **Care.**
   - The new intro on `/care`.
   - Providers choose the services they offer (up to 12, from any kind of care) and how many clients one time takes. Both are set in **Your listing** (`provider_save_services`).
   - Cards show the services and the schedule (`scheduleLine`).
   - The booking dialog offers only the provider's services and crosses out full times (`care_full_slots`).
   - The database refuses:
     - a service the provider doesn't offer
     - a full time
     - a buyer booked with two providers at the same time
     - the same provider again for the same dog while a booking is waiting or confirmed (item 11)
5. **Shortlist.**
   - The item is redesigned (bigger photo, facts on separate lines, the Dogeash ID).
   - A reserved dog shows "Another buyer has put a deposit… Keep it here?" with Remove.
   - Reserved dogs can't be asked about or visited.
   - A dog marked **sold** leaves every shortlist (trigger `dogs_zz_sold_leaves_shortlists`), and the catalogue already hides sold dogs.
6. **Kennel visit times.**
   - A requested or confirmed visit takes its time, so other buyers see it crossed out (`store_full_slots`). If the store declines it or anyone cancels it, the time is free again.
   - Stores can raise **Visitors per time** in Settings (`stores.visit_capacity`, 1 by default).
   - A buyer can't have two visits at the same time.
7. **Dog page details** (`components/dog/DogFacts.vue`). A grid with dividing lines, and an ⓘ on every property that explains it (a popover, so a tap works on phones).
8. **Dogeash ID instead of "K9 file".**
   - The top tab of dog cards and pages shows the **store name** and Available/Reserved.
   - The ID (`DOGEASH-2026-003`, from `dogeashId()`) is the first property on the page. It's also used in the dashboard, the inbox, reserve, contact, compare and the toasts.
   - The "K9 file" wording is gone from the site. URLs still use the old number.
9. **Dark is the default** (`colorMode.preference: 'dark'`). The loader and theme-color match. Day watch is still in the toggle.
10. **Pinned dogs.**
    - Stores pin up to 3 live dogs from a dog's ⋯ menu in Dashboard › Dogs (`dogs.pinned_at`). The database refuses a 4th, and sold or withdrawn dogs lose their pin.
    - The store page shows the 3 pinned dogs (or the first available ones), then a **"n more dogs · Show more"** card.
    - New page `/stores/[slug]/dogs` lists every dog, with filters (availability, level, sex, breed) and an order. The store page moved to `pages/stores/[slug]/index.vue`.
11. *(See 4.)*
12. **Providers' photos and contact.**
    - A profile photo and up to 8 workplace photos, in the new public `care-media` bucket under the provider's own folder.
    - The workplace address, "working with dogs since", and up to 8 history milestones.
    - Phone, WhatsApp and email go in `care_provider_contacts`, which only signed-in people can read. Everything is edited in **Your listing** (`ProviderDetailsForm`) and saved by `provider_save_details`.
    - Shared uploaders: `PhotoPicker` and `PhotoGrid`. The dog photo fields now use them too.
13. **Provider page** (`/care/[slug]`).
    - The photo, "n years with dogs", a Workplace photo grid, a History timeline, and the schedule in the booking box.
    - A **Contact** card: the address for everyone; phone, WhatsApp (wa.me link) and email when signed in, otherwise "Sign in to see…".
    - Directory cards show the photo.
14. **Phone reminders (paid plan).** The options are in PLAN.md, Phase 7. Termii first; then Africa's Talking, Sendchamp, Twilio, Infobip and the WhatsApp Cloud API. Sending would run from a server route, scheduled with `pg_cron` + `pg_net`, with each send logged for billing.

**Checked:**
- `npm run db:test`: all rules hold. New checks cover dates, care services, full times and clashes, visit capacity and freeing, sold dogs leaving shortlists, pins (3 max, dropped on withdraw, members only), provider details (own folder, contacts for signed-in people only) and care-media uploads.
- Typecheck: no new errors.
- In the browser, dark by default: the dog page details and info popover (desktop and 375px), store page (3 dogs + Show more), the store dogs page filters, and the provider page contact card.

## 48. Dog page actions in a bottom bar on phones (9 Nov)
- On phones and tablets (below `lg`), a dog's page puts the actions in a bar fixed to the bottom of the screen: **Reserve with a ₦… deposit** across the full width, with **Contact store** and **Book a visit** side by side under it. The price box keeps the price and drops those buttons. Desktop is unchanged.
- The bar isn't shown to the store's own people, who still see their listing actions. The page has extra bottom padding so the bar doesn't cover the end of the page.
- Checked at 375px: the bar shows; Contact and Book a visit open their dialogs (the account prompt when signed out); no sideways scroll.

## 49. Care bookings: several services, dates up to three months, change until answered (10 Nov)
**Migration:** `supabase/migrations/20261210000000_care_booking_changes.sql`. Run it **after** `20261209000000_nov9_batch.sql`.

- **Several services in one appointment.** The care booking dialog lets the buyer choose one or more of the provider's services (up to 5). They're saved in `care_bookings.services`, with `service` kept as the first, so older screens still work. The provider's notification and booking list show them all. The database refuses any service the provider doesn't offer.
- **Dates further out.** Under the next six working days, "Another date, up to 3 months ahead" opens a calendar (shadcn `Calendar`, the same one Daily Chow uses). It runs from tomorrow to 90 days ahead, and days the provider doesn't work are greyed out. A picked date joins the day chips, already chosen. The database allows up to 92 days, replacing "next two months". Kennel visits get the same calendar.
- **Changing a booking.** In Account › Visits and bookings, a care booking that's still **Awaiting reply** has **Change**: the same dialog, filled in with the booking (services, day, time, place), with "Save the change". `edit_care_booking` checks it by the same rules as a new booking (not clashing with itself) and tells the provider. Once the provider confirms or declines, it can't be changed; confirmed bookings say so, and Cancel is still there.
- One set of rules for new and changed bookings: `check_care_booking()`. Also `clean_services()` (trims and removes repeats).
- `BookingDialog` gained `multipleServices`, `maxDays`, `initial`, `submitLabel`, `triggerSize` and `plainTrigger`, and sends `services`. New `care/CareBookingChange.vue`.

**Checked:**
- db:test: all rules hold. New checks cover several services, a service the provider doesn't offer, about 80 days ahead OK, 95 refused, changing while waiting, a change keeping the same rules, others can't change it, and no changes after it's confirmed.
- Typecheck: no new errors.
- In the browser, on a temporary preview page (since removed): choosing two services, opening the calendar, going to January, picking 14 Jan (it joined the chips), choosing a time, and the summary showing "Services: Health check, Microchip scan". Change mode opened with the booking's services, day and time filled in. The real signed-in flow wasn't clicked through: it needs an account and the migration run.

## 50. Three weeks ahead, Done only from the day, "tell me when a time frees up" (10 Nov)
**Migration:** `supabase/migrations/20261211000000_care_three_weeks_waitlist.sql`. Run it **after** `20261210000000_care_booking_changes.sql`.

- **Past dates:** checked. The calendar starts tomorrow; today and earlier are greyed out, and you can't page back to an earlier month. The dialog also refuses a day that isn't after today. When you change a booking whose day has already passed, the day isn't kept, and **Change** only shows on bookings still ahead. The database counts "today" on Lagos time. `todayIso()` now uses the device's own date, not UTC, which used to say "yesterday" just after midnight in Lagos.
- **Three weeks** instead of three months: in the calendar (`maxDays: 21`, "Another date, up to 3 weeks ahead") and in the database ("Choose a day in the next three weeks").
- **Fully booked days** are crossed out in the day chips and greyed out in the calendar. When every working day in the next three weeks is full, the dialog says "Fully booked for the next 3 weeks", hides the day, time and Request button, and offers **Tell me when a time frees up** (`join_care_waitlist`, table `care_waitlist`). When a booking in the next three weeks is cancelled, declined or moved, everyone waiting for that provider gets a bell notification ("A time opened up with …", linking to the provider), once, and leaves the list.
- **Mark done only on the appointment day or after.** Coming-up bookings say "You can mark it done on the day." until then, and the database refuses an earlier Done. Past days are still allowed, so a provider can close an appointment they forgot to mark; otherwise it stays confirmed and blocks the buyer from booking that provider again for the dog.
- Not done: same-day booking. Times are fixed start times, so finishing early frees a start time that has already passed. Times free up for others through cancellations, declines and moves.

**Checked:**
- db:test: all rules hold. New checks: three weeks OK and further refused; a future appointment can't be marked done but can on its day; joining the waiting list (twice is fine, and others can't see it); a cancellation telling the waiting buyer and taking them off the list. The older "marks it done" test now moves its booking to today first.
- Typecheck: no new errors.
- In the browser, on a temporary preview page (since removed): with one day full, today and earlier, weekends and the full day were greyed and the back arrow was disabled; with every day full, the "fully booked" box appeared and "Tell me when a time frees up" switched to "We'll let you know".

## 51. Kennel visits and care appointments on separate pages (10 Nov)
- **`/account/visits`: Kennel visits.** Coming up (cancel, view store) and Earlier (review the store after a done visit).
- **`/account/care`: Care appointments.** Coming up (Change while awaiting reply, Cancel, "confirmed, so it can't be changed"), Earlier (link to the dog's record when done), and an empty state with **Find care**.
- **Account nav** has two entries instead of "Visits and bookings", each with its own count of what's coming up.
- **`/account/bookings`** (the old address, in older notifications and links) now forwards to `/account/visits`. Care notifications that still point there open `/account/care` instead (mapped in `useNotifications`), so older notifications land on the right page without a migration.
- After booking, the dialog's button goes to the matching page: "See my visits" or "See my appointments". The home "next visit" chip, the overview and the reviews page link to `/account/visits`.

**Checked:** typecheck (no new errors); both pages compile in the dev server; `/account/bookings` forwards to `/account/visits`. The pages weren't viewed signed in.

## 52. A dog's care team, and booking care from the dog's page (10 Nov)
**Migration:** `supabase/migrations/20261212000000_dog_care_team.sql`. Run it **after** `20261211000000_care_three_weeks_waitlist.sql`.

- **Care team** (`owned_dog_providers`): an owner picks Dogeash care providers for one of their dogs, up to 8, with each one's consent to add visits to the dog's record (`share_record`, on by default). Only the owner sees or changes it. Providers can't add their own listing, and it's listed providers only.
- **Adding a dog** (`/account/dogs/new`): an optional **Care team** section. Choose providers (search by name, service or city, filter by kind) and tick whether they may add to the record; they're saved with the dog.
- **Dog's page:**
  - A **Care team** panel: each provider with its services and schedule, a **Book** button already set to this dog with the saved consent, a switch "May add visits to …'s record", and a way to take them off. **Add** opens the picker.
  - **Book care** (it used to be a preview that sent nothing) opens "Book care for Rex": the care team first, then every care provider on Dogeash with what they offer and when, with search and kind filters. **Book** opens that provider's real booking with the dog already chosen; **Add to team** puts them on the team.
- **New shared pieces:** `useCareTeam` (loaded on its own, so My dogs still works before the migration), `useProviderSearch`, `care/CareProviderRow.vue`, `AccountCareTeamPicker`, `AccountDogCareTeam`, `AccountDogBookCare`. `BookingDialog` and `CareBookingDialog` gained a preset dog and its share setting (`presetDog`/`presetShare`, `dogId`/`share`).

**Checked:**
- db:test: all rules hold. New checks: the owner adds a provider; twice refused; not to someone else's dog; others can't see it; a provider can't add their own listing; the owner switches sharing off and removes a provider.
- Typecheck: no new errors.
- In the browser, on a temporary preview page (since removed): the Book care list with every provider's services and schedule; searching "groom" left one provider; Book opened that provider's booking (the sign-in prompt when signed out). Not tried signed in.

## 53. Shortlist: actions under the text (10 Nov)
- **Store header** (`ShortlistStoreGroup`): the store's name, place and reply time first; **Book a kennel visit** (first) and **Ask a question** on their own row underneath, lined up with the text, instead of squeezed beside it on wide screens.
- **Each dog** (`ShortlistItem`): the photo on the left; on the right the name and status, breed · sex · age, the Dogeash ID and the level, then a divider and a row underneath with the price on the left and **Compare** and **Remove** on the right. The remove button now says "Remove" rather than being a bare ×.
- **Checked** in the browser at 1440px and 375px with four dogs from two stores; no sideways scroll on phones. Typecheck: no new errors.

## 54. Money fields show commas as you type (10 Nov)
- **Every naira field** shows the amount grouped as you type: **3,200,000**, with ₦ still beside it. The form keeps the plain whole number (3200000), so validation and saving are unchanged. The caret stays after the same digit. Backspace or Delete on a comma removes the digit beside it, so it never needs two presses.
- **Shared:** `utils/amountInput.ts` (`groupAmount`, `formatAmountInput`). `FieldInput` gained `money`, and field builders pass `money: true`.
- **Used in:** the dog form's Price (store dashboard), Price from in the admin's provider form, and Price from on the provider's Your listing. Placeholders now read "3,200,000" and "15,000", and the dog form's hint no longer says "no commas".
- **Checked** on a temporary page (since removed) for both kinds of field: typing 3200000 showed 3,200,000 with the form value 3200000; Backspace at the comma in 15,000 gave 1,000; typing 9 there gave 19,000; deleting from the end of 2,500,000 gave 25,000. Typecheck: no new errors.

## 55. Provider dashboard has its own look, and providers switch between provider and buyer (10 Nov)
- **Own layout** (`layouts/provider.vue`): no site header or footer. Like the store dashboard, it has a fixed sidebar (a sheet on phones) and a slim top bar, in the provider's colours.
  - **Sidebar** (`provider/ProviderNav.vue`): the logo with a marigold **Care** tag; the listing (photo or icon, kind, taking bookings or paused); **Your practice**: Bookings (with the waiting count) and Your listing; and Public page. At the foot: who's signed in, **Switch to buyer account**, Sign out, and the theme.
  - **Top bar**: the listing name above the page title (Bookings, Your listing), **Edit your listing**, and the provider's own avatar menu.
  - `pages/provider.vue` is now just the route parent (the tabs and heading moved into the layout); the child pages set `title`.
- **Provider or buyer** (`useAccountMode`, remembered on the device in the `dogeash-mode` cookie; providers start as providers and opening the dashboard sets provider mode):
  - **In the dashboard**, the avatar menu (`provider/ProviderMenu.vue`) lists only Bookings, Your listing and Public page, then **Switch to buyer account**, then Sign out. None of the buyer pages.
  - **On the site in provider mode**, the header's avatar menu shows **Switch to provider dashboard** (with the waiting requests) and **Switch to buyer account**, without the buyer pages.
  - **In buyer mode**, the header menu shows the normal buyer pages (My Dogeash, My dogs, Shortlist…) plus **Switch to provider dashboard**. Switching to buyer opens `/account`; switching back opens `/provider`.
  - The switch is one card, `provider/ProviderSwitchCard.vue`, with a `compact` form for the sidebar.
- **Checked:** typecheck (no new errors); the layout, sidebar and both switch cards on a temporary page (since removed). Not seen signed in as a provider: that needs a provider account.

## 56. Provider bookings: this month by default, filters, list or table, details, CSV (10 Nov)
- **Period**: This month by default; also Next month, Last month, Last 3 months and Everything. The heading names it ("November 2026"), with four counts for it: bookings, to answer, confirmed, done. Requests waiting outside the period show as a marigold nudge ("1 more request to answer outside November 2026 · Show"), which switches to everything that's waiting.
- **Filters and order**: a search (buyer, dog, service, phone), status chips (To answer, Confirmed, Done, Declined or cancelled), and an order (date earliest or latest first, to answer first, buyer A to Z).
- **List or table**: a List | Table switch, remembered on the device (`dogeash-provider-view` cookie).
  - The list keeps the booking cards with their actions and a **Details** button.
  - In the table (`provider/ProviderBookingsTable.vue`), the whole row opens the details (keyboard too).
- **Details dialog** (`provider/ProviderBookingDetail.vue`, on the shared `DetailDialog`): the appointment, the buyer (with phone), the dog (whether its record is shared, lines added) and both notes, with the actions along the bottom.
- **Download CSV**: the bookings shown, with date, time, services, status, buyer, phone, dog, where, both notes, record lines and requested date (`bookingCsv`, using `utils/csv.ts`).
- **Shared**: `utils/providerBookings.ts` (periods, filter and sort, CSV columns, `canMarkDone`/`canAddToRecord`) and `provider/ProviderBookingActions.vue`. The actions are the same in the card and the dialog.
- **Limit**: `provider_bookings` returns appointments from 90 days ago onwards, so "Everything" reaches back 3 months. Say if older history is needed.
- **Checked**: typecheck (no new errors). On a temporary page (since removed) with six sample bookings in the provider layout: this month's counts; the outside-the-month nudge; the table; a row opening the details with Mark done and Add to record; status filters and search. The real page signed in as a provider wasn't tried.

## 57. Provider bookings: one status at a time, and a cleaner panel (10 Nov)
- **Status**: tabs (All, To answer, Confirmed, Done, Declined or cancelled), so only one can be chosen. Each has its count for the period; the To answer count is marigold when there's any. A marigold underline marks the chosen tab. `filterBookings` takes a single `status`; `inPeriod`/`inStatus` give the counts.
- **One panel** instead of a loose header, stats and toolbar:
  - the period name with the period select and **CSV** on the top row
  - the status tabs across the middle (they scroll sideways on phones)
  - search, order and List | Table on a shaded row underneath
  - The separate count tiles are gone, since the tabs carry the numbers. The "requests outside this month" nudge sits just under the panel.
- **Checked** on a temporary page (since removed) with sample bookings: only one tab is ever on; Done showed its one booking; at 375px there's no sideways page scroll. Typecheck: no new errors.

## 58. Provider page shows everything from Your listing, photos save at once, and "Our team" (10 Nov)
**Migration:** `supabase/migrations/20261213000000_provider_team.sql`. Run it **after** `20261212000000_dog_care_team.sql`. The catalogue now reads `care_providers.team`; until every migration up to this one has run, the site shows sample data.

- **Why the uploaded photo didn't show:** leaving the provider dashboard didn't re-read the catalogue the public pages use (only the store dashboard and admin did), so the provider's page kept what it had when the site first loaded. Now:
  - `/provider` counts as a back office in `catalog-fresh`.
  - Every load of the provider dashboard also updates that listing in the catalogue.
  - Photos save the moment they're added or removed ("Saved. Buyers see it on your page now."), so forgetting to press Save can't lose them (`savePhotos`).
- **Our team** (`care_providers.team`, `provider_save_team`): up to 12 people, each with a name, role and photo (own folder only). Edited in a new **Your team** section on Your listing (`provider/ProviderTeamForm.vue`). Shown on the provider's page as cards with a round photo (or initials), name and role.
- **Every section on the provider's page**: About, Workplace, Our team and History always show. When empty, a dashed note says so ("No photos of the workplace yet."). The provider looking at their own page also gets a link to add it in Your listing (`care/EmptyNote.vue`). With no team, it says who runs the practice, from "Person in charge".
- **Checked:** db:test (new: saving a team, own-folder photos only, others can't, 12 max); typecheck (no new errors); the provider page in the browser with the empty-section notes. Not tried signed in as a provider.

## 59. Gear: slim cards, and a page for each product (10 Nov)
- **Cards** (`gear/GearCard.vue`) show only what's needed to choose: the photo, kind, name, price, sizes on offer and the supplier. The whole card opens the product's page. The description, size picker and Add to cart moved to that page.
- **Product page** `/gear/[id]` (e.g. `/gear/gr-101`):
  - The photo (sticky on wide screens), kind and product code, name, description and price.
  - **Size** as cards showing who each fits ("L · 30–45 kg"), and a **Quantity** stepper (up to 10).
  - **Add to cart** with the total, then **Go to cart**.
  - Delivery to your gate (₦5,000, free from ₦100,000), swapping a wrong size within 7 days (opened food and health products excepted), and who supplies it (link to their page).
  - Underneath: **Why it works**, **Specifications**, **In the box** (with care tips), and **You may also need**. On phones, the price and Add to cart stay in a bar at the bottom.
- **Data:** `gearInfo` in `utils/gear.ts` (features, specifications, box contents, care for each sample product) with `infoFor()` and `gearPath()`. `findGear` ignores case. `useCart().add` takes a quantity. The returns and delivery wording is example copy until suppliers and payments are live.
- **Checked** in the browser: the slimmer cards, opening a product, choosing size L, adding 2 at once (the cart showed 2 × Patrol harness, ₦76,000; the test items were removed afterwards), and the details sections. Typecheck: no new errors.
