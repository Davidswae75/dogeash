# ThemeToggle (Day watch / Night watch)

Light and dark mode, named the way a security business would: Day watch and Night watch.

- **Header**: a pill button, "Night watch" with a moon in day mode, "Day watch" with a sun at night.
- **Settings and phone menu**: Day / Night / Auto segmented control; the selected option is `night` with `on-night` text.
- Default is Auto (the device setting). The choice is saved and applied before the page paints.
- Nuxt: `@nuxtjs/color-mode` with `dataValue: 'theme'`, `preference: 'system'`.
