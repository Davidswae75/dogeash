<script setup lang="ts">
import { Megaphone } from '@lucide/vue'
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, onMounted, ref } from 'vue'
import { z } from 'zod'
import { definePageMeta, useSeoMeta } from '#imports' // nuxt
import type { FieldConfig } from '~/components/Fields.vue'
import type { Audience } from '~/composables/useAdminAnnouncements'
import { useAdminAnnouncements } from '~/composables/useAdminAnnouncements'
import { useNotify } from '~/composables/useNotify'
import { adminTime } from '~/utils/admin'

// Admin › Announcements: write to everyone, to stores or to buyers. It goes to each person's bell; for
// everyone, it can also show as a strip across the top of the site (visitors too) until a date.
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Announcements · Dogeash admin', robots: 'noindex' })

const { sent, loaded, load, send, endBanner } = useAdminAnnouncements()
onMounted(load)

const audiences: { value: Audience, label: string, hint: string }[] = [
  { value: 'everyone', label: 'Everyone', hint: 'Every account' },
  { value: 'stores', label: 'Stores', hint: 'Everyone on a store\'s team' },
  { value: 'buyers', label: 'Buyers', hint: 'Accounts with no store' },
]
const schema = z.object({
  title: z.string().trim().min(3, 'A short title').max(80),
  body: z.string().trim().min(3, 'Write the message').max(1000),
  link: z.string().trim().max(300).refine(v => !v || v.startsWith('/') || v.startsWith('https://'), 'A page on Dogeash (/dogs) or an https:// link').default(''),
})
const { handleSubmit, defineField, errors, resetForm } = useForm({ validationSchema: toTypedSchema(schema) })
const [body] = defineField('body')
const fields: FieldConfig[] = [
  { fieldType: 'input', name: 'title', label: 'Title', attrs: { placeholder: 'Maintenance on Sunday', maxlength: 80 } } as FieldConfig,
  { fieldType: 'input', name: 'link', label: 'Link', optional: true, hint: 'Where "More" goes: a page on Dogeash like /dogs, or an https:// link.', attrs: { placeholder: '/guide' } } as FieldConfig,
]
const audience = ref<Audience>('everyone')
const audienceModel = computed({ get: () => audience.value, set: (v: string) => { if (v) audience.value = v as Audience } })
const asBanner = ref(false)
const bannerDate = ref(new Date(Date.now() + 3 * 864e5).toISOString().slice(0, 10))

const draft = ref<{ title: string, body: string, link: string }>()
const confirmOpen = ref(false)
const ask = handleSubmit((v) => {
  draft.value = v
  confirmOpen.value = true
})
async function run() {
  const result = await send({ audience: audience.value, ...draft.value!, bannerUntil: asBanner.value && audience.value === 'everyone' ? `${bannerDate.value}T23:59:00+01:00` : null })
  if (typeof result === 'string') return result
  useNotify().adminDone('Announcement sent', `${result} ${result === 1 ? 'person has' : 'people have'} it in their bell.`)
  resetForm()
  asBanner.value = false
  return null
}
const showing = (until: string | null) => !!until && new Date(until).getTime() > Date.now()
</script>

<template>
  <AdminPage title="Announcements" description="Tell everyone, every store, or every buyer something. It lands in their bell; for everyone, it can also show across the top of the site.">
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
      <AdminCard title="Write one">
        <form class="flex flex-col gap-4" novalidate @submit.prevent="ask">
          <FieldShell label="Who it's for">
            <ToggleGroup v-model="audienceModel" type="single" variant="outline" size="sm" aria-label="Who it's for" class="w-fit">
              <ToggleGroupItem v-for="a in audiences" :key="a.value" :value="a.value" class="px-3 text-xs" :title="a.hint">{{ a.label }}</ToggleGroupItem>
            </ToggleGroup>
            <span class="text-xs text-ink-muted">{{ audiences.find(a => a.value === audience)?.hint }}</span>
          </FieldShell>
          <Fields :fields="fields.slice(0, 1)" />
          <FieldShell label="Message" for="announcement-body" :error="errors.body">
            <Textarea id="announcement-body" v-model="body" rows="4" maxlength="1000" class="border-2 border-line-strong" />
          </FieldShell>
          <Fields :fields="fields.slice(1)" />
          <label v-if="audience === 'everyone'" class="flex flex-wrap items-center gap-3 text-sm">
            <Switch v-model="asBanner" />Also show across the top of the site until
            <Input v-model="bannerDate" type="date" :disabled="!asBanner" :min="new Date().toISOString().slice(0, 10)" class="h-9 w-40" aria-label="Show the strip until" />
          </label>
          <Button type="submit" variant="marigold" class="w-fit"><Megaphone aria-hidden="true" />Send</Button>
        </form>
      </AdminCard>

      <AdminCard :title="`Sent (${sent.length})`" flush>
        <ul v-if="sent.length" class="m-0 flex list-none flex-col p-0">
          <li v-for="a in sent" :key="a.id" class="flex flex-col gap-1 border-t border-line px-5 py-3 text-[13px]">
            <span class="flex flex-wrap items-center gap-2">
              <strong class="font-semibold">{{ a.title }}</strong>
              <span class="rounded-full bg-surface-sunk px-2 py-0.5 font-mono text-[10.5px] uppercase">{{ a.audience }}</span>
              <span v-if="showing(a.banner_until)" class="rounded-full bg-marigold px-2 py-0.5 font-mono text-[10.5px] font-semibold text-on-marigold uppercase">on the site</span>
              <span class="ml-auto font-mono text-[11px] text-ink-muted">{{ adminTime(a.created_at) }}</span>
            </span>
            <span class="text-ink-muted">{{ a.body }}</span>
            <span class="flex items-center gap-3 text-[12px] text-ink-muted">
              {{ a.recipients }} {{ a.recipients === 1 ? 'person' : 'people' }} · by {{ a.sent_by ?? '—' }}<template v-if="a.banner_until"> · strip {{ showing(a.banner_until) ? 'until' : 'ended' }} {{ adminTime(a.banner_until) }}</template>
              <Button v-if="showing(a.banner_until)" variant="ghost" size="sm" class="h-7" @click="endBanner(a)">Take the strip down</Button>
            </span>
          </li>
        </ul>
        <p v-else class="m-0 border-t border-line px-5 py-4 text-[13px] text-ink-muted">{{ loaded ? 'None sent yet.' : 'Loading…' }}</p>
      </AdminCard>
    </div>

    <AdminConfirm
      v-if="draft"
      v-model:open="confirmOpen"
      :title="`Send to ${audiences.find(a => a.value === audience)?.label.toLowerCase()}?`"
      :description="`“${draft.title}”: ${draft.body}${asBanner && audience === 'everyone' ? ` It also shows across the top of the site until ${bannerDate}.` : ''} This can't be unsent.`"
      confirm-label="Send now"
      no-note
      :run="() => run()"
    />
  </AdminPage>
</template>
