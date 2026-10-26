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
- [2026-10-26] After adding a new layout file, the running dev server may not generate its Tailwind classes (page renders unstyled grid). Touch `app/assets/css/main.css` to force a rebuild instead of debugging the markup.

## Decision Log

<!-- Significant technical decisions with rationale. Why X was chosen over Y. -->
