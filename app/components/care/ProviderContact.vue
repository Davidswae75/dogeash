<script setup lang="ts">
import { Mail, MapPin, MessageCircle, Phone } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useRoute, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import { useSession } from '~/composables/useSession'
import type { CareContacts, CareProvider } from '~/utils/care'

// How to reach a provider: the workplace address for everyone; phone, WhatsApp and email for signed-in people
// (care_provider_contacts is readable only when signed in, so the numbers aren't on the open page).
const props = defineProps<{ provider: CareProvider }>()
const { signedIn } = useSession()
const route = useRoute()
const supabase = useSupabaseClient()

const contacts = ref<CareContacts | null>(null)
watch(signedIn, async (yes) => {
  if (!yes) return (contacts.value = null)
  const { data } = await supabase.from('care_provider_contacts').select('phone, whatsapp, email, care_providers!inner (public_id)').eq('care_providers.public_id', props.provider.id).maybeSingle()
  contacts.value = data ? { phone: data.phone, whatsapp: data.whatsapp, email: data.email } : { phone: '', whatsapp: '', email: '' }
}, { immediate: true })

// WhatsApp links want the number in international form: 0803… becomes 234803…
const waNumber = (n: string) => n.replace(/[^\d]/g, '').replace(/^0/, '234')
const row = 'flex items-start gap-3 text-[15px] leading-6'
const icon = 'mt-0.5 size-4 shrink-0 text-ink-muted'
</script>

<template>
  <section class="flex flex-col gap-4 rounded-xl bg-surface p-5 ring-1 ring-line" aria-labelledby="contact-title">
    <h2 id="contact-title" class="m-0 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded">Contact</h2>
    <p v-if="props.provider.address" :class="row"><MapPin :class="icon" aria-hidden="true" /><span>{{ props.provider.address }}</span></p>
    <template v-if="signedIn">
      <template v-if="contacts && (contacts.phone || contacts.whatsapp || contacts.email)">
        <a v-if="contacts.phone" :href="`tel:${contacts.phone.replace(/\s/g, '')}`" :class="[row, 'text-ink no-underline hover:underline']"><Phone :class="icon" aria-hidden="true" />{{ contacts.phone }}</a>
        <a v-if="contacts.whatsapp" :href="`https://wa.me/${waNumber(contacts.whatsapp)}`" target="_blank" rel="noopener" :class="[row, 'text-ink no-underline hover:underline']"><MessageCircle :class="icon" aria-hidden="true" />WhatsApp {{ contacts.whatsapp }}</a>
        <a v-if="contacts.email" :href="`mailto:${contacts.email}`" :class="[row, 'break-all text-ink no-underline hover:underline']"><Mail :class="icon" aria-hidden="true" />{{ contacts.email }}</a>
      </template>
      <p v-else-if="contacts" class="m-0 text-sm text-ink-muted">No phone or email yet. Book through Dogeash and the provider confirms with you.</p>
    </template>
    <p v-else class="m-0 text-sm leading-5 text-ink-muted">
      <NuxtLink :to="{ path: '/sign-in', query: { redirect: route.fullPath } }" class="font-bold text-ink">Sign in</NuxtLink> to see their phone, WhatsApp and email.
    </p>
  </section>
</template>
