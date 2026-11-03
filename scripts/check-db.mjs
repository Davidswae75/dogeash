// Is the Supabase project set up? Counts what a public visitor can see, using the publishable key
// from .env.local. Never prints the keys. Run with `npm run db:check`.
import { existsSync } from 'node:fs'

if (existsSync('.env.local')) process.loadEnvFile('.env.local')
const url = process.env.SUPABASE_URL
const key = process.env.SUPABASE_KEY
if (!url || !key) {
  console.log('No Supabase keys found in .env.local')
  process.exit(1)
}

for (const table of ['stores', 'dogs']) {
  const res = await fetch(`${url}/rest/v1/${table}?select=id`, { headers: { apikey: key } })
  const body = await res.json()
  console.log(`${table}: ${Array.isArray(body) ? `${body.length} visible to the public` : `missing (${body.code})`}`)
}
