Dogeash is a marketplace for trained guard dogs: verified kennels list protection dogs for homes, compounds, estates and businesses. It is not a pet shop. Buyers are adults making a security decision, so every page gets to the point: what the dog will do, what it has been checked for, who is selling, and what it costs. The look is high-contrast black, white, ash and hi-vis marigold in big blocks, with a few ideas that belong only to Dogeash: the K9 file, the protection scale, the patrol map and Day/Night watch.

## Signature details

A few loud details on a calm base. Use them only where listed.

- **Hazard stripe**: diagonal marigold and charcoal stripes from security tape. A 14px band under the header on Home, and a 4px edge under every K9 file tab. Nowhere else.
- **Mega headings**: Archivo at 125% width, weight 900 (`.dg-mega`) for the hero and section headings on Home. At most one word per heading in outline (`.dg-outline`) or on a marigold block.
- **Night patrol map and sticker**: the hero uses the patrol map's night version (charcoal ground, marigold route) with one slowly turning "Verified kennels only" sticker (`.dg-sticker`). One sticker per page at most.
- **Big numbers**: three 104px figures with thick black top rules (`.dg-stats`), for facts buyers care about: kennels inspected, dogs vet-checked, days of trainer support.
- **Photo reveal**: hovering or keyboard-focusing a K9 file slides a marigold "Open K9 file →" bar up over the photo.
- **Reduced motion**: when a visitor's device asks for less motion, the sticker stops, the patrol dog stops, content appears without rising, and the photo bar appears without sliding.

## Signature ideas

- **K9 file**: every dog is presented as a working-dog record with a file number (`DG-0412`), status, facts in mono and a verified kennel stamp. See DogCard.
- **Protection scale**: five plain-language levels from Alert companion to Estate and executive, shown as five bars on every dog. See ProtectionScale.
- **Patrol map**: the illustration style. Plan views of a compound with a dog walking a dashed marigold route. See Illustration.
- **Patrol line**: the same dashed marigold line links the How it works steps and circles the cover.
- **What are you protecting?**: the property picker is the main way in, ahead of breed.
- **Day watch / Night watch**: light and dark mode, named for security work. See ThemeToggle.

## Voice

- Direct, factual, calm. Short sentences. Facts before feelings.
- Lead with protection level, training, health, seller and price, in that order.
- Use the trade's terms: protection level, IGP, PSA, perimeter, handover, K9 file, kennel inspection.
- Never cute: no puns, no "fur babies", no emoji, no exclamation marks. Never aggressive: never "attack dog", no snarling imagery.
- Buttons are verbs: "Find my guard dog", "Contact seller", "Book a visit", "View K9 file →".
- Guidance answers the buyer's real question in one line ("Not sure which level?").

## Colour

- Black, white, ash and hi-vis marigold: the colours of security signage and safety vests. High contrast so the page catches the eye at once, and nothing soft or pastel.
- **Damped white** (`canvas`, `surface`) is the ground: a soft off-white, never pure white, so the page is easy on the eyes.
- **Ash** (`ash`, `ash-soft`) is the signature grey, and it is in the name: dogeASH. Use it for big blocks such as the property section, level cards and "Best suited to".
- **Marigold** is the eye-catcher, in big confident shapes: the patrol map ground, the highlighted word in the hero headline, the search button, level 4, the logo square. Text on it is `on-marigold` (black); as text use `marigold-ink`.
- **Charcoal** (`night`) for K9 file tabs, the promise strip, the price panel and tour tips. Text on it is `on-night`.
- `action` is black by day and marigold by night: primary buttons, links, scale bars.
- `verified` blue only for the kennel stamp and verified badges, always with the word.
- Rhythm down a page: white, ash, charcoal, marigold. Never two ash blocks in a row.

## Type

- `display` is Archivo, set expanded (115–120% width) and heavy (700–900). It reads like signage on a gate or a vehicle, and black on white makes it hit hard: strong without shouting. Use `display-xl` once on Home, `display-l` for page titles and dog names, `title` for section headings.
- `sans` is Public Sans for all reading text, labels and buttons.
- `mono` is IBM Plex Mono (`spec`) for K9 file numbers, weights, grades, microchips and the patrol-map labels.

## Layout

- Home is a stack of rounded blocks (`radius-xl`) 20px from the window edge and 20px apart. Inner pages use a 1200px `container`.
- Grids: K9 files 3 / 2 / 1 columns; property tiles 4, then 2×2; levels 5 in a row, scrolling sideways on phones.
- Every listing page states the search in words ("Guard dogs for a compound") with the count.
- Templates: Home, Browse, Dog profile (the full K9 file), Seller store, Protection levels, Buyer's guide, seller dashboard.

## Day watch and night watch

- Day watch (light) is the default look; Night watch (dark) turns the canvas near-black, ash becomes a dark graphite, and marigold takes over as the action colour.
- People choose Day, Night or Auto (device setting, the default). The choice is saved and applied before the page paints.
- Build only from tokens so both themes work everywhere.

## Shape and depth

- Corners: `radius-sm` badges and stamps, `radius-md` buttons, `radius-lg` cards and tiles, `radius-xl` colour blocks, `radius-pill` chips, search and the theme switch.
- Cards rest flat with a border; on hover they lift 3px with a soft shadow. Blocks never have shadows.
- Focus: 2px solid `focus` ring, 2px offset.

## Illustration and imagery

- Photos: the actual dog, natural light, at a real home or kennel, 4:3. Calm and alert, never snarling. No stock, no watermarks over the dog.
- Every adult dog has two videos: obedience and protection work.
- Illustration: patrol maps only (plan views, geometric, token colours). No cartoon dogs.
- Inline animated SVG instead of GIF; Lottie only for longer onboarding stories, in the same palette.

## Motion

- Purposeful and calm: blocks and cards rise in once on load (`dg-rise`, 14px, 420ms, 80ms stagger).
- The patrol map loops slowly: the route marches, the dog marker laps every 18 seconds with a radar pulse.
- Hover lifts and toggles take 150–200ms. Under reduced motion everything is still.

## Guidance

- First-time buyers get a way in on every key page: the property picker, "Not sure which level?" links to the 2-minute match, up to three tour tips on first visit, a buyer's guide.
- Empty states show the patrol map and one suggestion. Loading shows K9 file skeletons. Actions confirm with a short toast.
- Everything can be dismissed and stays dismissed.

## Iconography

- 2px-stroke line icons with round caps (Lucide style), 18–30px, `currentColor`. Property icons: house, walled compound, estate, office block. Shield-check for verified.
- Logotype: "dogeash" in `display` 900 at 120% width with a small marigold square. No mark yet.

## Building it in Nuxt

- Tokens in `app/assets/css/tokens.css`: light on `:root`, dark under `[data-theme="dark"]`.
- Fonts with `@nuxt/fonts`: Archivo (variable width and weight), Public Sans, IBM Plex Mono.
- `@nuxtjs/color-mode` with `dataValue: 'theme'`, `preference: 'system'` for Day/Night watch.
- Layouts: `app/layouts/default.vue` (header, footer), `app/layouts/dashboard.vue` (sellers).
- Components: `K9Card.vue`, `ProtectionScale.vue`, `PropertyPicker.vue`, `PatrolMap.vue`, `SellerCard.vue`, `SearchFilters.vue`, `ThemeToggle.vue`, `AppButton.vue`, `AppBadge.vue`, `GuideHint.vue`, `EmptyState.vue`.

## Implementation

Components are Vue single-file components styled with Tailwind CSS v4 and shadcn-vue. There are no HTML previews; run `npm run dev` to see them in the app.

- Tokens: `app/assets/css/tokens.css` (CSS variables for Day and Night watch), exposed to Tailwind in `app/assets/css/main.css` (`bg-marigold`, `text-ink-muted`, `rounded-xl`, `font-display` ...). shadcn's semantic names (`primary`, `muted`, `border`, `ring`) point at the same tokens.
- shadcn-vue primitives: `app/components/ui` (Button, Badge, Input, Skeleton, Avatar, Toggle, ToggleGroup), with Dogeash variants.
- Signature utilities in `main.css`: `mega`, `text-outline`, `hazard`, `hazard-thin`, `animate-rise`, `rise-stagger`, `animate-march`, `animate-spin-slow`.

| Design component | Vue |
| --- | --- |
| Button | `ui/button` (variants: default, marigold, outline, ghost, night) |
| Badge | `ui/badge` (verified, level, new, neutral), `VerifiedStamp`, `StatusDot` |
| DogCard | `K9Card`, `K9FileTab`, `FactRow` |
| ProtectionScale | `ProtectionScale`, `ProtectionLevels` |
| PropertyPicker | `PropertyPicker` |
| SearchFilters | `SearchBar`, `FilterChips` |
| SellerCard | `SellerCard` |
| SiteHeader | `SiteHeader`, `AppLogo`, `SiteFooter` |
| ThemeToggle | `ThemeToggle` (quick, segmented) |
| Illustration | `PatrolMap` (day, night) |
| HowItWorks | `HowItWorks` |
| GuideHint | `TourHint`, `TourBeacon`, `HelpPanel`, `AppToast` |
| EmptyState | `EmptyState` |
| Skeleton | `K9CardSkeleton` |
| Cover | `BrandCover` |
| HomeLayout | `pages/index.vue` |
| BrowseLayout | `pages/dogs/index.vue` |
| DogProfileLayout | `pages/dogs/[id].vue` |
