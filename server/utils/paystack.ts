import { createHmac, timingSafeEqual } from 'node:crypto'
import type { H3Event } from 'h3'
import { createError } from 'h3'
import { useRuntimeConfig } from '#imports' // nitro

// Paystack's API, called only from the server with the secret key (PAYSTACK_SECRET_KEY).
// Amounts go to Paystack in kobo; Dogeash keeps naira everywhere else.
const API = 'https://api.paystack.co'

export const toKobo = (naira: number) => Math.round(naira * 100)
export const toNaira = (kobo: number) => Math.floor(kobo / 100)

function secretKey(event: H3Event) {
  const key = useRuntimeConfig(event).paystackSecretKey as string
  if (!key) throw createError({ statusCode: 503, statusMessage: 'Payments aren\'t set up yet. Add PAYSTACK_SECRET_KEY to the server.' })
  return key
}

// One call to Paystack. Returns its `data`, or throws with Paystack's own message.
export async function paystack<T = Record<string, any>>(event: H3Event, path: string, body?: Record<string, unknown>): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: body ? 'POST' : 'GET',
    headers: { 'Authorization': `Bearer ${secretKey(event)}`, 'Content-Type': 'application/json' },
    body: body ? JSON.stringify(body) : undefined,
  })
  const json = await res.json().catch(() => null) as { status?: boolean, message?: string, data?: T } | null
  if (!res.ok || !json?.status) {
    throw createError({ statusCode: 502, statusMessage: json?.message || `Paystack didn't answer (${res.status})` })
  }
  return json.data as T
}

// Webhooks are signed with the secret key: an HMAC-SHA512 of the raw body, in x-paystack-signature
export function validSignature(event: H3Event, rawBody: string, signature: string | undefined) {
  if (!signature) return false
  const expected = createHmac('sha512', secretKey(event)).update(rawBody).digest('hex')
  const a = Buffer.from(expected)
  const b = Buffer.from(signature)
  return a.length === b.length && timingSafeEqual(a, b)
}
