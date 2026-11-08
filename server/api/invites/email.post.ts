import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { sendEmail } from '../../utils/email'
import { careTypes } from '~/utils/care'
import { storeRoles } from '~/utils/storeRoles'

// Email an invitation just made: to join a store's team (made by the store's owner) or to manage a care
// listing (made by Dogeash). The link goes to sign-up, or to sign-in if that email already has an account,
// with the invitation's id: the page shows what they're accepting, fills in the email and accepts it for them.
// Only whoever could see the invitation (the owner, or Dogeash) can send it, and only within 15 minutes of making it.
export default defineEventHandler(async (event) => {
  const { kind, id } = await readBody<{ kind?: 'store' | 'provider', id?: string }>(event)
  if (!id || (kind !== 'store' && kind !== 'provider')) throw createError({ statusCode: 400, statusMessage: 'Which invitation?' })

  const client = await serverSupabaseClient<Database>(event)
  const { data: me } = await client.auth.getUser()
  const table = kind === 'store' ? 'store_invites' : 'care_provider_invites'
  // The access rules show an invitation only to its maker's side and to the invited person
  const { data: invite } = await client.from(table).select('id, email, created_at').eq('id', id).maybeSingle()
  if (!invite || !me.user || invite.email === me.user.email?.toLowerCase()) throw createError({ statusCode: 404, statusMessage: 'No such invitation' })
  if (Date.now() - new Date(invite.created_at).getTime() > 15 * 60_000) throw createError({ statusCode: 400, statusMessage: 'That invitation was made a while ago. Withdraw it and invite them again to send a fresh email.' })

  const service = serverSupabaseServiceRole<Database>(event)
  const { data: hasAccount } = await service.rpc('account_exists', { check_email: invite.email })
  const origin = getRequestURL(event, { xForwardedHost: true, xForwardedProto: true }).origin
  // The link names the invitation, so the page can say what they're accepting and accept it for them
  const link = `${origin}/${hasAccount ? 'sign-in' : 'sign-up'}?invite=${encodeURIComponent(invite.id)}&kind=${kind}`
  const button = { label: hasAccount ? 'Sign in to accept' : 'Create your account', url: link }
  const how = hasAccount
    ? `Sign in with ${invite.email} and it's accepted for you.`
    : `Create a free account with ${invite.email} (it takes a minute) and it's accepted for you.`

  let message
  if (kind === 'store') {
    const { data } = await service.from('store_invites').select('role, stores (name, city), invited_by').eq('id', id).single()
    const { data: inviter } = data?.invited_by ? await service.from('profiles').select('full_name').eq('id', data.invited_by).maybeSingle() : { data: null }
    const store = data?.stores as unknown as { name: string, city: string } | null
    const role = storeRoles[data!.role]
    message = {
      to: invite.email,
      subject: `Join ${store?.name ?? 'a store'} on Dogeash`,
      lines: [
        `${inviter?.full_name || 'The owner'} invited you to join ${store?.name ?? 'their store'}${store?.city ? ` in ${store.city}` : ''} on Dogeash, as ${role.label.toLowerCase()}.`,
        `As ${role.label.toLowerCase()} you'll work on: ${role.hint.toLowerCase()}.`,
        how,
      ],
      button,
      note: 'Not expecting this? Ignore it. Nothing happens unless you accept.',
    }
  }
  else {
    const { data } = await service.from('care_provider_invites').select('care_providers (name, type, city)').eq('id', id).single()
    const p = data?.care_providers as unknown as { name: string, type: keyof typeof careTypes, city: string } | null
    message = {
      to: invite.email,
      subject: `Manage ${p?.name ?? 'your listing'} on Dogeash`,
      lines: [
        `Dogeash invited you to manage ${p?.name ?? 'a care listing'}${p ? ` (${careTypes[p.type].label.toLowerCase()}, ${p.city})` : ''}.`,
        'Dog owners find and book you on Dogeash. You\'ll answer their bookings, keep your listing up to date, and, when an owner allows it, add what you did to their dog\'s record.',
        how,
      ],
      button,
      note: 'Not expecting this? Ignore it. Nothing happens unless you accept.',
    }
  }

  const result = await sendEmail(event, message)
  if (!result.sent) console.warn(`[invite email] not sent to ${invite.email}: ${result.error}`)
  return { sent: result.sent, error: result.error ?? null, hasAccount: !!hasAccount }
})
