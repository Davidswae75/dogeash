import { createError, defineEventHandler, getRequestURL, readBody } from 'h3'
import { serverSupabaseClient, serverSupabaseServiceRole } from '#supabase/server'
import type { Database } from '~/types/database.types'
import { sendEmail } from '../../utils/email'
import { careTypes } from '~/utils/care'
import { storeRoles } from '~/utils/storeRoles'

// Email an invitation just made: to join a store's team (made by the store's owner) or to manage a care
// listing (made by Dogeash). The link goes to sign-up with the email filled in, or to sign-in if that email
// already has an account; either way the invitation is waiting in their account afterwards.
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
  const link = `${origin}/${hasAccount ? 'sign-in' : 'sign-up'}?email=${encodeURIComponent(invite.email)}&redirect=${encodeURIComponent('/account')}`
  const button = { label: hasAccount ? 'Sign in to accept' : 'Create your account', url: link }
  const how = hasAccount
    ? `Sign in with ${invite.email} and the invitation is at the top of your account.`
    : `Create a free account with ${invite.email} (it takes a minute), and the invitation is waiting at the top of your account.`

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
  return { sent: result.sent, hasAccount: !!hasAccount }
})
