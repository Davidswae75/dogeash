// https://nuxt.com/docs/api/configuration/nuxt-config
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import tailwindcss from '@tailwindcss/vite'
import { defineNuxtConfig } from 'nuxt/config'

// Nuxt only reads .env by itself; local keys live in .env.local, the one env file (template: .env.example)
if (existsSync('.env.local')) process.loadEnvFile('.env.local')

export default defineNuxtConfig({
  // Renamed pages keep their old links working; admin pages skip server rendering
  routeRules: {
    '/sell': { redirect: { to: '/open-a-store', statusCode: 301 } },
    '/dashboard/enquiries': { redirect: { to: '/dashboard/inbox?type=message', statusCode: 301 } },
    // The admin dashboard renders in the browser only: its checks need the signed-in session and its one-time code
    '/admin': { ssr: false },
    '/admin/**': { ssr: false },
  },

  compatibilityDate: '2025-07-15',

  // Keys are read from .env.local when the dev server starts, so editing it restarts the server
  // (otherwise it keeps the old values, as when a fixed EMAIL_FROM wasn't picked up)
  watch: [resolve('.env.local')],

  // Pages that render in the browser only (the admin) show app/spa-loading-template.html while they start up,
  // and keep it until the page is ready (session read, access checked), so a refresh never shows a blank page
  spaLoadingTemplate: true,
  experimental: {
    spaLoadingTemplateLocation: 'body',
  },
  devtools: { enabled: true },

  modules: ['@nuxtjs/color-mode', 'shadcn-nuxt', '@nuxtjs/supabase'],

  // Every file imports what it uses, so you can see where each name comes from: 'vue', the file
  // in ~/utils or ~/composables, or '#imports' (Nuxt and its modules, origin noted in a comment).
  // A missing import is an error rather than a silent auto-import. Components still auto-import.
  imports: { autoImport: false },

  // Server only, never sent to the browser. Payments (server/api/payments) need PAYSTACK_SECRET_KEY, and
  // SUPABASE_SECRET_KEY to record what Paystack confirmed. Set both in .env.local, and on the host.
  // Emails the site sends itself (invitations): BREVO_API_KEY for now (RESEND_API_KEY once there's a domain), and EMAIL_FROM.
  runtimeConfig: {
    paystackSecretKey: process.env.PAYSTACK_SECRET_KEY ?? '',
    public: {
      // The site's own address (https://…), for links that must be absolute, like the share image. Optional.
      siteUrl: process.env.SITE_URL ?? '',
    },
    brevoApiKey: process.env.BREVO_API_KEY ?? '',
    resendApiKey: process.env.RESEND_API_KEY ?? '',
    emailFrom: process.env.EMAIL_FROM ?? '',
  },

  // Accounts and data. Needs SUPABASE_URL and SUPABASE_KEY from .env.local, or set on the host before the build.
  // Browsing stays open to everyone; pages opt in to needing an account (useAccountGate, route middleware).
  supabase: { redirect: false },

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
        // The browser bar and installed app follow Day or Night (the device setting)
        { name: 'theme-color', content: '#f2f1ed', media: '(prefers-color-scheme: light)' },
        { name: 'theme-color', content: '#0f0f10', media: '(prefers-color-scheme: dark)' },
        { name: 'application-name', content: 'Dogeash' },
        { name: 'apple-mobile-web-app-title', content: 'Dogeash' },
        { name: 'mobile-web-app-capable', content: 'yes' },
        { name: 'apple-mobile-web-app-status-bar-style', content: 'black-translucent' },
      ],
      // The dog mark everywhere the site is shown as an icon (made by `npm run render:icons`)
      link: [
        { rel: 'icon', href: '/favicon.ico', sizes: '48x48' },
        { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' },
        { rel: 'apple-touch-icon', href: '/apple-touch-icon.png' },
        { rel: 'manifest', href: '/site.webmanifest' },
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
