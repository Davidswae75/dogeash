# Dogeash project plan

Dogeash is a marketplace for trained guard dogs in Nigeria. Verified kennels list protection dogs for homes, compounds, estates and businesses, and buyers find, check and reserve them. It is not a pet shop: every page gets to the point (what the dog will do, what it has been checked for, who is selling, what it costs).

This file is the build guide and checklist. Work through it phase by phase, tick items as they land, and add new tasks under the phase they belong to.

## How to use this file

- `[ ]` not started · `[~]` in progress or needs review · `[x]` done
- Add new tasks under the right phase. If one doesn't fit, put it in **Inbox** at the bottom and sort it later.
- Keep each item small enough to finish in one sitting. Split anything bigger.
- When a decision is made, move it from **Open decisions** to **Decisions made**, with the date.
- This file replaced the old `TODO.md`; all of its items are folded in below.

## Ground rules

- **Stack**: Nuxt 4 (`app/` folder), Vue single-file components, TypeScript, Tailwind CSS v4 with the Dogeash tokens, shadcn-vue for primitives. No standalone HTML pages.
- **Design**: follow the design system (`design/ash-marigold/`, published at https://claude.ai/artifact/8sq7Fx7tJeSxjAgqTLVyV7).
  - Colours: white, ash, charcoal and marigold.
  - Fonts: Archivo, Public Sans, IBM Plex Mono.
  - Dogeash patterns: the K9 file, the protection scale, the patrol map, the hazard stripe.
  - Day watch and Night watch (light and dark mode).
- **Tokens**: colours, spacing and radii come from `app/assets/css/tokens.css`. Never hard-code a colour.
- **Validation**: Zod schemas in `app/utils/k9.ts` are the single source of truth for dog data. Forms and the API both use them.
- **Voice**: direct and factual. No puns, no emoji, never "attack dog".
- **Accessibility**: keyboard focus on everything, 4.5:1 text contrast in both themes, reduced motion respected.
- **Every page** works at phone width (375px) and laptop width (1440px), in both themes.

---

## Phase 0 · Foundations

- [x] Design system: colours, type, components, layouts
- [x] Nuxt project with tokens, fonts, Tailwind and shadcn-vue
- [x] Day watch / Night watch with `@nuxtjs/color-mode`
- [x] Default layout: header, footer, skip link
- [x] Core components: K9 card, protection scale, property picker, patrol map, sticker, big numbers, search bar, store card
- [x] Approved sizing and centred page column
- [ ] First git commit (the repo has no commits yet)
- [ ] Push to a remote (GitHub) and protect `main`
- [ ] Replace the starter `README.md` with how to install, run and build Dogeash
- [ ] Add linting and formatting (ESLint + Nuxt config) and a typecheck script
- [ ] Decide what to do with the unused UI kit pieces in `app/components/ui/` (keep or remove)

## Phase 1 · Public site (browsing only, sample data)

The goal: someone can land, understand Dogeash, browse dogs and read a full K9 file, all without an account.

### Pages
- [~] Home (`/`): built; review content and the 3D dog
- [~] Browse (`/dogs`): built; review filters against the design
- [~] Dog profile (`/dogs/[id]`): built; show temperament, health, training and incident history
- [ ] Protection levels (`/protection-levels`): the five levels explained, with example dogs per level
- [x] Stores directory (`/stores`): search, filters (city, breeds, protection levels, services, trust), sort, how we check stores
- [x] Store page (`/stores/[slug]`): dogs for sale with filters, about and services, history, owner, inspection record, vets and trainers, reviews
  - [ ] Store cover and kennel photos (image briefs, like the guide)
  - [ ] "Contact store" and "Book a kennel visit" buttons do nothing yet (need accounts and messaging)
- [ ] Buyer's guide (`/guide`): choosing a level, costs, care, what handover involves
- [ ] Sell with us (`/sell`): pitch to kennels and how verification works
- [ ] Sign in / sign up pages (UI only until Phase 2)
- [ ] 404 and error pages in the Dogeash style
- [ ] About, contact, FAQ

### Discovery
- [ ] 2-minute match quiz: property, household, experience → suggested level and dogs
- [ ] Search by breed, level and city, wired to the browse filters
- [ ] Filters for the new fields: children, other pets, night patrol, price range
- [ ] Sort: newest, price, level
- [ ] Empty states and loading skeletons on every list

### Content and data
- [ ] Move the sample dogs in `dogs.ts` to full `k9.ts` profiles
- [ ] Real photos per dog (4:3), with alt text
- [ ] Tour tips and help panels for first-time visitors (up to 3 tips, dismissible)

### Quality
- [ ] SEO: titles, descriptions, Open Graph images per page
- [ ] Phone and laptop check of every page in both themes
- [ ] Accessibility pass (keyboard, screen reader labels, contrast)
- [ ] Performance pass (image sizes, the patrol GIF and 3D dog weight)

## Phase 2 · Backend and accounts

- [ ] **Decide** the stack: Supabase, or Nuxt server routes + Postgres (see Open decisions)
- [ ] Database schema for dogs, sellers, inspections, users, reservations
- [ ] Separate database `id` (uuid) from the public `fileNo` (done in the model; carry into the schema)
- [ ] Image and video storage for dog photos and training videos
- [ ] Accounts and sign-in (email + phone OTP)
- [~] One sign-in page (`/sign-in`) for everyone: buyers, store owners and staff, care providers, inspectors and admins
  - UI built (`app/layouts/auth.vue`): email + password, phone or email one-time code, validation, resend timer; ends on a preview of where buyers and stores land
  - [ ] Connect to real accounts, then remove the preview step
  - [x] Sign-in fields built with `<Fields>` + vee-validate + Zod schemas (`app/utils/auth.ts`)
  - [x] Sign-up page (`/sign-up`): what brings you here, name, email, phone, password with strength meter, terms; phone code step; welcome with next steps (preview, nothing saved)
  - [ ] Forgot-password page (use `<Fields>` and the `KennelWatch` animation, like sign-in)
  - [ ] Terms of use and privacy policy pages (linked from sign-up)
  - [ ] Line under the form: "Selling on Dogeash? Sign in here with the account you used to apply."
  - [ ] After sign-in, send each person where they belong: buyers back to where they were, stores to the dashboard, providers to their bookings, staff to admin
- [ ] Roles: buyer, store member, care provider, inspector, admin (one account can hold several)
- [ ] Account menu switch between "Buying" and "My store" for people who do both
- [ ] Route guards: dashboard and admin pages need the right role; everyone else is sent to sign-in or their profile
- [ ] Required one-time code (SMS or authenticator app) for store and provider accounts; optional for buyers
- [ ] API routes validated with the `k9.ts` Zod schemas
- [ ] Replace sample data with the database on every page
- [ ] Seed script with the sample kennels and dogs for development

## Phase 3 · Stores (sellers)

Sellers are called **stores** everywhere buyers can see them. A store is a kennel; its owner is the seller.


- [ ] Store application (from "List a dog" and "Sell with us"): creates the account and starts verification (ID, CAC registration, bank account, kennel address), then books the inspection
- [ ] Pending stores can sign in and prepare their profile and dogs; nothing goes public until the inspection passes
- [x] Store dashboard layout (`app/layouts/dashboard.vue`): sidebar with Overview, Dogs, Enquiries, Bookings, Care team, Store profile, Payouts, Team, Settings; store switcher menu; top bar with search, notifications, theme and "Add a dog"; phone menu sheet
- [~] Dashboard overview (`/dashboard`): weekly numbers with trends, needs your attention, coming up, your dogs table, store profile checklist (example figures)
- [ ] Dashboard sections: Dogs, Enquiries, Bookings, Care team, Store profile, Payouts, Team, Settings (each shows a "Coming next" page for now)
- [ ] Store staff: invite members with roles (Owner: everything incl. payouts · Manager: dogs, enquiries, bookings · Handler: their own dogs)
- [ ] Store dashboard: edit store profile (about, history, owner, services, hours, delivery areas)
- [ ] Store dashboard: manage the care team (add or remove linked vets and trainers)
- [ ] Add a dog: multi-step form using `dogSubmissionSchema` + vee-validate
- [ ] Edit, withdraw and mark sold
- [ ] Listing statuses: draft → pending review → available → reserved → sold / withdrawn
- [ ] Puppy and litter listings (separate shape, no training section)
- [ ] Stud and breeding listings
- [ ] Seller enquiries inbox

## Phase 4 · Inspections and trust

- [ ] Inspection scheduling for kennels
- [ ] Inspector tool: on-site checklist, photos, protection level confirmation
- [ ] Verified kennel stamp driven by real inspection records
- [ ] Change history for inspections and prices
- [ ] Bite and incident reporting (model done; needs forms and display)
- [ ] Listing moderation queue for admins
- [ ] Fake-listing detection (duplicate photos, unverified sellers)

## Phase 5 · Buyers

- [ ] Buyer profile: property type, handler experience, children, other pets (used for matching)
- [ ] Save dogs to a shortlist
- [ ] Alerts when a matching dog is listed
- [ ] Buyer–seller messaging
- [ ] Book a kennel visit or viewing
- [ ] Match quiz results saved to the profile

## Phase 5b · Care network and bookings

Vets, trainers, groomers and cleaners, kennel builders, equipment suppliers and boarding. Each provider exists once. Stores link to the providers they work with, and anyone can find providers in a public directory. Buyers can book appointments with them from either place.

### Providers
- [~] Provider model: name, type, city and areas covered, services and prices, contact, opening hours, verification status (sample data in `app/utils/care.ts`; contact and hours still to add)
- [x] Store ↔ provider link with the relationship in words ("Our vet", "Our handover trainer", "Equipment we use")
- [ ] Stores add their own providers (goes to review); providers can also apply directly
- [ ] Verification: vets checked against the veterinary council register; "Verified" badge only on providers Dogeash has checked
- [x] Store page panel: "Vets and trainers" with a booking button per provider
- [ ] K9 file shows the vet who signed the vaccinations and the trainer who trained the dog, where known
- [ ] Public directory (`/care`): filter by service and city, each provider has its own page listing the kennels they work with
- [ ] After purchase: suggest providers near the buyer's address ("Vets within 10 km of you")

### Bookings
- [ ] Provider availability: working hours, appointment length per service, days off
- [ ] Book from a provider's page in the directory
- [~] Book from a store page (preview dialog built: service, day, time, home or premises, dog name; requests are not sent yet)
- [ ] Book from a K9 file (the store's own vet or trainer)
- [ ] Booking types: vet check-up, vaccination, training session, grooming or cleaning, kennel build quote, equipment fitting, boarding stay
- [ ] Choose a home visit or a visit to the provider, where the provider offers both
- [ ] Link a booking to the buyer's dog, so the provider sees its K9 file
- [ ] Confirmation, reschedule and cancel, with reminders by SMS and email
- [ ] Provider dashboard: upcoming appointments, accept or decline, mark done, notes
- [ ] Booking history on the buyer's profile and on the dog's record (vaccinations, training sessions)
- [ ] Pay a deposit or the full fee online, or pay on the day (see Open decisions)
- [ ] Reviews only from buyers who completed a booking
- [ ] Featured placement in the directory (paid, later; store links are never paid)

## Phase 6 · Transactions

- [ ] **Decide** the payment provider: Paystack or Flutterwave
- [ ] Reserve a dog with an escrow deposit
- [ ] Full payment, platform fee and seller payouts
- [ ] Refunds and cancellations
- [ ] Health guarantee terms per listing
- [ ] Price history and currency handling
- [ ] Delivery and handover tracking (date, trainer, commands taught)
- [ ] Owner history and microchip registration transfer
- [ ] Follow-up support log (the 30 days of trainer support)
- [ ] Import permits: veterinary papers, quarantine dates

## Phase 7 · Community

- [ ] Seller reviews after handover
- [ ] Disputes: how they are raised and resolved
- [ ] Notifications by email and SMS (reservation, visit, handover)

## Phase 8 · Legal and compliance

- [ ] Terms of sale
- [ ] Liability waiver for level 4–5 dogs
- [ ] Privacy policy and data handling under the NDPA (Nigeria Data Protection Act)
- [ ] Cookie notice (only if non-essential cookies are used)

## Phase 9 · Launch

- [ ] Hosting and deployment (decide: Vercel, Netlify, or a VPS)
- [ ] Domain and email
- [ ] Error monitoring and uptime checks
- [ ] Privacy-friendly analytics
- [ ] Database backups
- [ ] Onboard the first verified kennels (beta)
- [ ] Real figures for the big numbers on Home (replace the example figures)
- [ ] Launch checklist: every page, both themes, phone and laptop, payments in live mode

---

## Dog model backlog (`app/utils/k9.ts`)

- [x] `toDogCard()` returns `null` for sold, withdrawn, draft and in-review dogs
- [x] `toDogCard()` no longer shows Borderline / Not tested hips as Fair
- [x] Database `id` separate from the public `fileNo`
- [x] Bite and incident history (`incidents`, `hasUnpromptedBite()`)
- [ ] Female data: heat cycles, spayed, litters
- [ ] Teach the 3D dog the `ears` and `tail` shapes

## Open decisions

- [ ] Backend: Supabase, or Nuxt server routes + Postgres?
- [ ] Payments: Paystack or Flutterwave?
- [ ] Hosting: Vercel, Netlify or a VPS?
- [ ] Sign-in: email, phone OTP, or both?
- [ ] Platform fee: percentage, flat fee, or seller subscription?
- [ ] Who inspects kennels: Dogeash staff, or approved third-party inspectors?
- [ ] Launch cities: Abuja and Lagos first, or nationwide?
- [ ] Bookings: pay online at booking, a deposit only, or pay the provider on the day?
- [ ] Bookings: does Dogeash take a fee per booking, charge providers a subscription, or keep bookings free?
- [ ] Bookings: cancellation window and no-show policy
- [ ] Calendars: build availability in Dogeash, or sync with Google Calendar?

## Decisions made

- 2026-10-23 · Design direction: ash and marigold, with the hazard stripe, night patrol map, sticker, big numbers, mega headings and photo reveal from the bold edition
- 2026-10-23 · Light and dark mode named Day watch and Night watch; default follows the device
- 2026-10-24 · Tailwind CSS v4 + shadcn-vue for components
- 2026-10-26 · Sellers are called stores in the product and the code (`storeId`, `app/utils/stores.ts`, `/stores`)
- 2026-10-26 · Full footer on Home only; every other page gets a one-row quick-links footer (`definePageMeta({ footer: 'full' })` to opt in)
- 2026-10-26 · One sign-in page for buyers, stores, providers and staff; stores land on a separate dashboard layout

## Inbox

New tasks that haven't been sorted into a phase yet.

- [ ]



# Dogeash roadmap

## Dog model (`app/utils/k9.ts`)
- [x] Fix `toDogCard()` status: sold, withdrawn, draft and in-review dogs now return `null`
- [x] Fix `toDogCard()` hips: Borderline / Not tested are no longer shown as Fair
- [x] Database `id` (uuid) separate from the public `fileNo`
- [x] Bite and incident history (`incidents`, `hasUnpromptedBite()`)
- [ ] Owner history and microchip registration transfer
- [ ] Female data: heat cycles, spayed, litters
- [ ] Puppy and litter listings (separate shape, no training section)
- [ ] Stud and breeding listings
- [ ] Health guarantee terms
- [ ] Import permits (veterinary papers, quarantine dates)
- [ ] Change history for inspections and prices
- [ ] Price history and currency
- [ ] Teach the 3D dog the `ears` and `tail` shapes
- [ ] Move the sample dogs in `dogs.ts` to full profiles
- [ ] Show temperament, health, training and incidents on the dog page

## Backend
- [ ] Choose a stack (Supabase, or Nuxt server + Postgres)
- [ ] Accounts and roles: buyer, seller, inspector, admin

## Sellers and buyers
- [ ] Seller verification: ID, CAC, bank account, address
- [ ] Buyer profile: property, handler experience, children (for matching)
- [ ] Seller form for adding a dog (`dogSubmissionSchema` + vee-validate)
- [ ] Inspection scheduling and an inspector tool

## Transactions
- [ ] Reservations with escrow deposits (Paystack / Flutterwave)
- [ ] Refunds, seller payouts, platform fee
- [ ] Delivery and handover tracking, follow-up support log

## Community and trust
- [ ] Buyer–seller messaging and viewing bookings
- [ ] Seller reviews after handover
- [ ] Disputes and how they're resolved
- [ ] Saved dogs, alerts, search filters for the new fields
- [ ] Listing moderation and fake-listing detection

## Legal
- [ ] Terms of sale
- [ ] Liability waiver for level 4–5 dogs
- [ ] Data privacy under the NDPA
