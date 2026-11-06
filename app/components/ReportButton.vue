<script setup lang="ts">
import { Check, Flag } from '@lucide/vue'
import type { HTMLAttributes } from 'vue'
import { ref } from 'vue'
import { navigateTo, useRoute } from '#imports' // nuxt
import type { ReportKind, ReportReason } from '~/utils/reports'
import { useReports } from '~/composables/useReports'
import { useSession } from '~/composables/useSession'
import { cn } from '~/lib/utils'
import { reportReasons } from '~/utils/reports'

// "Report" on a listing, store, review or conversation: why, a few words, and it goes to Dogeash.
// Visitors are asked to sign in first (and come back here). The reporter hears back in their bell.
const props = defineProps<{ kind: ReportKind, targetId: string, what: string, class?: HTMLAttributes['class'] }>()

const { signedIn } = useSession()
const route = useRoute()
const { send } = useReports()
const open = ref(false)
const reason = ref<ReportReason | ''>('')
const details = ref('')
const busy = ref(false)
const error = ref('')
const sent = ref(false)

function start() {
  if (!signedIn.value) return navigateTo({ path: '/sign-in', query: { redirect: route.fullPath } })
  reason.value = ''
  details.value = ''
  error.value = ''
  sent.value = false
  open.value = true
}
async function submit() {
  if (!reason.value) return (error.value = 'Choose what\'s wrong.')
  if (reason.value === 'other' && details.value.trim().length < 5) return (error.value = 'Tell us a little about it.')
  busy.value = true
  error.value = (await send(props.kind, props.targetId, reason.value, details.value)) ?? ''
  busy.value = false
  if (!error.value) sent.value = true
}
const reasonModel = { get: () => reason.value, set: (v: string) => { if (v) reason.value = v as ReportReason } }
</script>

<template>
  <button type="button" :class="cn('inline-flex cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-[13px] font-semibold text-ink-muted hover:text-ink', props.class)" @click="start">
    <Flag class="size-3.5" aria-hidden="true" />Report {{ props.what }}
  </button>

  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-[460px]">
      <template v-if="!sent">
        <DialogHeader>
          <DialogTitle>Report {{ props.what }}</DialogTitle>
          <DialogDescription>Dogeash reviews every report. The other side isn't told who reported them.</DialogDescription>
        </DialogHeader>
        <form class="flex flex-col gap-4" novalidate @submit.prevent="submit">
          <ToggleGroup :model-value="reasonModel.get()" type="single" aria-label="What's wrong" class="flex w-full flex-col items-stretch gap-1.5" @update:model-value="v => reasonModel.set(String(v ?? ''))">
            <ToggleGroupItem v-for="r in reportReasons" :key="r.value" :value="r.value" class="h-auto justify-start rounded-lg! px-3 py-2 text-left ring-1 ring-line data-[state=on]:ring-2 data-[state=on]:ring-ink">
              <span class="flex flex-col items-start leading-tight"><span class="text-sm font-semibold">{{ r.label }}</span><span class="text-xs font-normal text-ink-muted">{{ r.hint }}</span></span>
            </ToggleGroupItem>
          </ToggleGroup>
          <FieldShell label="Details" for="report-details" :optional="reason !== 'other'" :hint="reason === 'other' ? 'Required for Something else.' : 'It helps Dogeash look into it.'">
            <Textarea id="report-details" v-model="details" rows="3" maxlength="1000" class="border-line-strong" />
          </FieldShell>
          <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
          <DialogFooter>
            <Button type="button" variant="ghost" :disabled="busy" @click="open = false">Cancel</Button>
            <Button type="submit" :loading="busy">Send report</Button>
          </DialogFooter>
        </form>
      </template>
      <div v-else class="flex flex-col items-center gap-3 py-4 text-center">
        <span class="grid size-12 place-items-center rounded-full bg-marigold-soft"><Check class="size-6" aria-hidden="true" /></span>
        <DialogTitle>Thanks, it's with Dogeash</DialogTitle>
        <DialogDescription>We'll look into it and tell you what we did, in your notifications.</DialogDescription>
        <Button class="mt-2" @click="open = false">Done</Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
