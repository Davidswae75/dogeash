<script setup lang="ts">
import { Mail, MessageCircle, Smartphone } from '@lucide/vue'
import { ref } from 'vue'
import { useNotify } from '~/composables/useNotify'
import { useProfile } from '~/composables/useProfile'
import { useSession } from '~/composables/useSession'

// Settings: how Dogeash tells you about replies, visits and price drops. Each switch saves at once.
// Sign-in codes and receipts always go by email, whatever is chosen here.
const { user } = useSession()
const { save } = useProfile()
const notify = useNotify()

const channels = [
  { key: 'email', column: 'notify_email', label: 'Email', text: 'Replies from stores, visit confirmations and price drops.', icon: Mail },
  { key: 'sms', column: 'notify_sms', label: 'Text message', text: 'Visit reminders on the day. Starts once texts are connected.', icon: Smartphone },
  { key: 'whatsapp', column: 'notify_whatsapp', label: 'WhatsApp', text: 'Replies and reminders on WhatsApp. Starts once it\'s connected.', icon: MessageCircle },
] as const
const saving = ref<string | null>(null)

async function toggle(channel: typeof channels[number], on: boolean) {
  saving.value = channel.key
  const error = await save({ [channel.column]: on })
  saving.value = null
  if (error) notify.error({ kicker: 'Settings', title: 'Not saved', text: error })
}
</script>

<template>
  <SectionPanel title="How we reach you">
    <ul class="m-0 flex list-none flex-col p-0">
      <li v-for="c in channels" :key="c.key" class="flex items-center gap-3.5 rounded-lg p-3">
        <span class="grid size-10 shrink-0 place-items-center rounded-md bg-surface-sunk ring-1 ring-line">
          <component :is="c.icon" class="size-[18px]" aria-hidden="true" />
        </span>
        <label :for="`notify-${c.key}`" class="flex min-w-0 flex-1 cursor-pointer flex-col gap-0.5">
          <span class="text-sm font-semibold">{{ c.label }}</span>
          <span class="text-[13px] leading-[18px] text-ink-muted">{{ c.text }}</span>
        </label>
        <Switch
          :id="`notify-${c.key}`"
          :model-value="user?.notify[c.key] ?? false"
          :disabled="saving === c.key"
          @update:model-value="toggle(c, $event)"
        />
      </li>
    </ul>
    <p class="m-0 px-3 pb-3 text-xs text-ink-muted">Sign-in codes and receipts always come by email.</p>
  </SectionPanel>
</template>
