---
description: learned preferences, project conventions, and Do-Not-Repeat rules
budget_tokens: 2000
---
# Cerebrum

> OpenWolf's learning memory. Updated automatically as the AI learns from interactions.
> Do not edit manually unless correcting an error.
> Last updated: 2026-10-26

## User Preferences

<!-- How the user likes things done. Code style, tools, patterns, communication. -->
- Forms: build fields with `<Fields :fields="[...]">` (app/components/Fields.vue, ported from the Daily Chow project) inside a vee-validate `useForm` with a Zod schema via `toTypedSchema`; don't hand-write each Label + Input. Slots: `<name>:append-icon`, `<name>:second-label`.
- Auth pages (sign-in, sign-up) use the `KennelWatch` animation (`npm run render:kennel`); the patrol chase stays on Home. Both are drawn from `scripts/k9-art.mjs`.

## Key Learnings

- **Project:** dogeash
- **Description:** Look at the [Nuxt documentation](https://nuxt.com/docs/getting-started/introduction) to learn more.

## Do-Not-Repeat

<!-- Mistakes made and corrected. Each entry prevents the same mistake recurring. -->
<!-- Format: [YYYY-MM-DD] Description of what went wrong and what to do instead. -->
- [2026-10-26] A new component file can be missed by the running dev server's watcher (renders as an unknown <Tag>, not in .nuxt/components.d.ts). Move the file out and back in to make Nuxt register it.
- [2026-10-26] After adding a new layout file, the running dev server may not generate its Tailwind classes (page renders unstyled grid). Touch `app/assets/css/main.css` to force a rebuild instead of debugging the markup.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
- [2026-10-27] Toasts: call `useNotify()` helpers (shortlistSaved, shortlistRemoved, compareFull, bookingRequested, signedIn, accountCreated, formErrors), add a new helper for a new action. Never call vue-toastification's `useToast()` directly, so type, icon and wording stay consistent.
- [2026-10-27] Who is signed in: `useSession()` (sample account in the `dogeash-session` cookie, so SSR renders the right header). Per-person saved lists: `useAccountList(name)` stores `{ guest: [...], <accountId>: [...] }`; `signIn()` merges the guest's lists into the account. Don't use `useLocalStorage` directly for anything that belongs to a person.
- [2026-10-27] Wording: Dogeash is a store-enlistment marketplace. Never "sell with us", "seller" or "list a dog" for stores; say "open a store", "store", "apply to open a store". Store sign-up is `/sign-up?as=store` (intent copy in `app/utils/signUpIntents.ts`).
- [2026-10-27] Actions that need an account go through `useAccountGate({ key, action, reason }, run)` and call `guard()`; never redirect to sign-in directly. `BookingDialog` takes a `gate` prop; `KennelVisitDialog`, `CareBookingDialog` and `ContactStoreDialog` gate themselves. Redirects after auth use `safeRedirect()`.
- [2026-10-27] Sidebars in sheets: make the whole column scroll (`overflow-y-auto` on the root, sections `shrink-0`, footer `mt-auto`). A `flex-1 overflow-y-auto` nav between a header and footer collapses to zero height in short windows and the links vanish.
- [2026-10-31] Section tabs: don't pick the active tab with an IntersectionObserver band alone. Short sections at the page bottom can't reach the band, so the wrong tab lights up. Use last section past a line, last section at page bottom, and hold the clicked tab until scrolling settles (`useSectionSpy`, used by the store page and guide). In-page `#` links are smooth everywhere via `plugins/smoothAnchors.client.ts`; `#main` skip links stay instant.
- [2026-10-31] `sr-only` (absolute) inside an `overflow-x-auto` wrapper escapes it unless the wrapper is `relative`. It widens the page on phones, and the dialog/sheet scroll lock then adds that difference as body padding, crushing the page into a narrow column. Scrollers holding tables need `relative`.
