import { computed } from 'vue'
import { useRuntimeConfig, useState, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import type { Reservation, ReservationRow } from '~/utils/reservations'
import { isActive, reservationColumns, toReservation } from '~/utils/reservations'
import { useSession } from './useSession'

// The buyer's reservations (Supabase: reservations, payments, refunds). Paying goes through the site's
// server (server/api/payments), which opens Paystack's checkout; everything else is a database function.
// Every action returns an error message, or null when it worked.
export function useReservations() {
  const supabase = useSupabaseClient()
  const storageUrl = useRuntimeConfig().public.supabase.url as string
  const { user } = useSession()
  const mine = useState<Reservation[]>('buyer-reservations', () => [])
  const loaded = useState('buyer-reservations-loaded', () => false)

  const active = computed(() => mine.value.filter(isActive).filter(r => r.status !== 'pending'))
  const earlier = computed(() => mine.value.filter(r => !isActive(r)))
  // Unfinished checkouts only matter while they still hold the dog
  const unfinished = computed(() => mine.value.filter(r => r.status === 'pending' && new Date(r.expiresAt).getTime() > Date.now()))

  async function load() {
    if (!user.value) return (mine.value = [])
    const { data } = await supabase.from('reservations').select(reservationColumns).order('created_at', { ascending: false })
    mine.value = ((data ?? []) as unknown as ReservationRow[]).map(r => toReservation(r, storageUrl))
    loaded.value = true
  }

  // Paystack's checkout: the browser leaves for Paystack and comes back to /account/reservations
  async function goToCheckout(path: '/api/payments/reserve' | '/api/payments/balance', body: Record<string, string>): Promise<string | null> {
    try {
      const { url } = await $fetch<{ url: string }>(path, { method: 'POST', body })
      window.location.assign(url)
      return null
    }
    catch (e) {
      return fetchError(e)
    }
  }
  const reserve = (fileNo: string) => goToCheckout('/api/payments/reserve', { fileNo })
  const payBalance = (reservationId: string) => goToCheckout('/api/payments/balance', { reservationId })

  // Back from Paystack: the server checks the payment with Paystack and records it
  async function verify(reference: string): Promise<{ outcome: string } | { error: string }> {
    try {
      const result = await $fetch<{ outcome: string }>('/api/payments/verify', { method: 'POST', body: { reference } })
      await load()
      return result
    }
    catch (e) {
      return { error: fetchError(e) }
    }
  }

  async function cancel(id: string, reason = ''): Promise<string | null> {
    const { error } = await supabase.rpc('cancel_reservation', { reservation: id, reason })
    if (error) return error.message
    await load()
    return null
  }

  async function confirmHandover(id: string): Promise<string | null> {
    const { error } = await supabase.rpc('confirm_handover', { reservation: id })
    if (error) return error.message
    await load()
    return null
  }

  // The buyer's own reservation on a dog, if it's still in play (for the dog page's button)
  const forDog = (fileNo: string) => computed(() => mine.value.find(r => r.dogFileNo === fileNo && isActive(r) && r.status !== 'pending'))

  return { mine, loaded, active, earlier, unfinished, load, reserve, payBalance, verify, cancel, confirmHandover, forDog }
}

// The server's message when it refused (the database's words), or a plain fallback
function fetchError(e: unknown) {
  const err = e as { data?: { message?: string, statusMessage?: string }, statusMessage?: string }
  return err.data?.message || err.data?.statusMessage || err.statusMessage || 'That didn\'t work. Check your connection and try again.'
}
