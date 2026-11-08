<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { definePageMeta, useSeoMeta, useSupabaseClient } from '#imports' // nuxt, @nuxtjs/supabase
import { useAdminInspections } from '~/composables/useAdminInspections'
import { useNotify } from '~/composables/useNotify'
import { adminTime } from '~/utils/admin'

// Admin › Settings: how Dogeash runs. Which new listings Dogeash reviews before buyers see them (all off:
// verified stores' dogs go live straight away), and who the staff are (changed only in the SQL editor).
definePageMeta({ layout: 'admin', colorMode: 'dark', middleware: 'admin' })
useSeoMeta({ title: 'Settings · Dogeash admin', robots: 'noindex' })

const supabase = useSupabaseClient()
const { staff, loadStaff } = useAdminInspections()
const settings = ref<{ review_first_listings: boolean, review_high_levels: boolean, review_all_listings: boolean, updated_at: string, updated_by: string | null } | null>(null)
const busy = ref(false)
onMounted(async () => {
  const [{ data }] = await Promise.all([supabase.rpc('admin_settings'), loadStaff()])
  settings.value = data as unknown as typeof settings.value
})

const rules = [
  { key: 'review_first_listings', label: 'Review each store\'s first three listings', hint: 'New stores\' first dogs wait for Dogeash before buyers see them.' },
  { key: 'review_high_levels', label: 'Review level 4 and 5 dogs', hint: 'The strongest protection dogs are checked before they go live.' },
  { key: 'review_all_listings', label: 'Review every new listing', hint: 'Nothing goes live until Dogeash has looked at it. Slowest for stores.' },
] as const

async function toggle(key: typeof rules[number]['key'], value: boolean) {
  busy.value = true
  const { error } = await supabase.rpc('admin_save_settings', { s: { [key]: value } })
  busy.value = false
  if (error) return useNotify().failed('That didn\'t save. Try again.')
  settings.value = { ...settings.value!, [key]: value, updated_at: new Date().toISOString() }
  useNotify().adminDone('Settings saved', value ? 'Matching listings now wait for review in Listings.' : 'Matching listings go live straight away again.')
}
</script>

<template>
  <AdminPage title="Settings" description="How Dogeash runs. Changes apply straight away and are in the audit log.">
    <AdminCard title="Listing review" description="When a rule applies, a store's &quot;go live&quot; waits as &quot;pending review&quot;; you approve it or send it back in Listings, and admins are told each time." flush>
      <ul v-if="settings" class="m-0 flex list-none flex-col p-0">
        <li v-for="r in rules" :key="r.key" class="flex items-start gap-4 border-t border-line px-5 py-3.5">
          <Switch :model-value="settings[r.key]" :disabled="busy" :aria-label="r.label" class="mt-0.5" @update:model-value="v => toggle(r.key, !!v)" />
          <span class="flex flex-col leading-tight">
            <span class="text-[14px] font-semibold">{{ r.label }}</span>
            <span class="text-[12.5px] text-ink-muted">{{ r.hint }}</span>
          </span>
        </li>
      </ul>
      <ListSkeleton v-else variant="table" :rows="3" />
      <p v-if="settings" class="m-0 border-t border-line px-5 py-2.5 text-[11.5px] text-ink-muted">Last changed {{ adminTime(settings.updated_at) }}<template v-if="settings.updated_by"> by {{ settings.updated_by }}</template>.</p>
    </AdminCard>

    <AdminCard :title="`Staff (${staff.length})`" description="Added and removed only in the Supabase SQL editor, never from the site." flush>
      <ul class="m-0 flex list-none flex-col p-0">
        <li v-for="s in staff" :key="s.id" class="border-t border-line">
          <NuxtLink :to="`/admin/people/${s.id}`" class="flex items-center gap-3 px-5 py-2.5 text-[13px] text-ink no-underline hover:bg-surface-sunk/60">
            <span class="flex-1 font-semibold">{{ s.name }}</span>
            <span class="rounded-full bg-surface-sunk px-2 py-0.5 font-mono text-[10.5px] uppercase">{{ s.role }}</span>
          </NuxtLink>
        </li>
      </ul>
      <p class="m-0 border-t border-line px-5 py-2.5 font-mono text-[11px] text-ink-muted">insert into public.staff (user_id, role) select id, 'inspector' from auth.users where email = '…';</p>
    </AdminCard>
  </AdminPage>
</template>
