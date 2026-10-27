// https://nuxt.com/docs/api/configuration/nuxt-config
import tailwindcss from '@tailwindcss/vite'

export default defineNuxtConfig({
  // Renamed pages keep their old links working
  routeRules: {
    '/sell': { redirect: { to: '/open-a-store', statusCode: 301 } },
    '/dashboard/enquiries': { redirect: { to: '/dashboard/inbox?type=message', statusCode: 301 } },
  },

  compatibilityDate: '2025-07-15',
  devtools: { enabled: true },

  modules: ['@nuxtjs/color-mode', 'shadcn-nuxt'],

  // Listen on the LAN so `npm run dev` prints a Network URL for testing on a phone
  devServer: {
    host: '0.0.0.0',
  },

  css: ['~/assets/css/main.css'],

  vite: {
    plugins: [tailwindcss()],
  },

  // shadcn-vue primitives live in app/components/ui and are used unprefixed (<Button>, <Badge>)
  shadcn: {
    prefix: '',
    componentDir: './app/components/ui',
  },

  // Day watch / Night watch: sets data-theme="light" | "dark" on <html> before paint
  colorMode: {
    preference: 'system',
    fallback: 'light',
    dataValue: 'theme',
    classSuffix: '',
    storageKey: 'dogeash-watch',
  },

  // Static build: these pages are linked but not built yet (PLAN.md Phase 1); remove each one once its page exists
  nitro: {
    prerender: {
      ignore: ['/protection-levels', '/sell', '/forgot-password', '/terms', '/privacy'],
    },
  },

  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      title: 'Dogeash',
      meta: [
        { name: 'description', content: 'Trained guard dogs for homes, compounds and estates, from kennels we inspect in person.' },
      ],
      link: [
        { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
        { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
        {
          rel: 'stylesheet',
          href: 'https://fonts.googleapis.com/css2?family=Archivo:wdth,wght@62..125,500..900&family=Public+Sans:wght@400;500;600;700&family=IBM+Plex+Mono:wght@500;600&display=swap',
        },
      ],
    },
  },
})
