<script setup lang="ts">
import { ArrowLeft, ArrowRight, Check } from '@lucide/vue'
import type { InboxAction, InboxItem } from '~/utils/inbox'
import { cn } from '~/lib/utils'

// One inbox item: a conversation with a reply box, or a booking, payment or review with what to do about it
const props = defineProps<{ item: InboxItem }>()
const emit = defineEmits<{ back: [], reply: [text: string], act: [action: InboxAction] }>()
const { store } = useStoreContext()

const dog = computed(() => props.item.dogFileNo ? findDog(props.item.dogFileNo) : undefined)
</script>

<template>
  <section class="flex min-w-0 flex-col overflow-hidden rounded-xl bg-surface ring-1 ring-line">
    <header class="flex items-start gap-3 border-b border-line p-4">
      <button type="button" class="grid size-9 shrink-0 cursor-pointer place-items-center rounded-full border-[1.5px] border-line-strong bg-transparent text-ink lg:hidden" aria-label="Back to inbox" @click="emit('back')">
        <ArrowLeft class="size-4" aria-hidden="true" />
      </button>
      <span :class="cn('hidden size-10 shrink-0 place-items-center rounded-md sm:grid', inboxKinds[props.item.kind].tile)">
        <component :is="inboxKinds[props.item.kind].icon" class="size-[18px]" aria-hidden="true" />
      </span>
      <div class="flex min-w-0 flex-1 flex-col gap-0.5">
        <span class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ inboxKinds[props.item.kind].label }} · {{ props.item.at }}</span>
        <h2 class="m-0 font-display text-lg leading-6 font-extrabold font-stretch-expanded">{{ props.item.subject }}</h2>
        <span class="text-[13px] text-ink-muted">{{ props.item.from }}<template v-if="props.item.city"> · {{ props.item.city }}</template></span>
      </div>
      <NuxtLink v-if="dog" :to="`/dogs/${dog.fileNo.toLowerCase()}`" class="hidden shrink-0 items-center gap-2 rounded-lg p-1.5 pr-3 text-ink no-underline ring-1 ring-line hover:ring-ink sm:flex">
        <img v-if="dog.photo" :src="dog.photo" alt="" class="size-9 rounded-md object-cover">
        <span class="flex flex-col">
          <strong class="text-[13px] leading-4">{{ dog.name }}</strong>
          <span class="font-mono text-[10px] text-ink-muted">{{ dog.fileNo }}</span>
        </span>
      </NuxtLink>
    </header>

    <!-- A conversation -->
    <template v-if="props.item.thread">
      <ol class="m-0 flex flex-1 list-none flex-col gap-3 overflow-y-auto p-4">
        <li v-for="(m, i) in props.item.thread" :key="i" :class="cn('flex max-w-[85%] flex-col gap-1', m.from === 'store' ? 'self-end items-end' : 'self-start')">
          <span class="font-mono text-[10px] text-ink-muted">{{ m.from === 'store' ? (m.name === store.name ? 'You' : m.name) : m.name }} · {{ m.at }}</span>
          <p :class="cn('m-0 rounded-2xl px-3.5 py-2.5 text-sm leading-[21px]', m.from === 'store' ? 'rounded-br-md bg-night text-on-night' : 'rounded-bl-md bg-surface-sunk text-ink')">{{ m.text }}</p>
        </li>
      </ol>
      <DashboardInboxReply :item="props.item" @send="emit('reply', $event)" />
    </template>

    <!-- A booking, payment, review or update -->
    <div v-else class="flex flex-col gap-4 p-4">
      <p class="m-0 text-[15px] leading-6">{{ props.item.preview }}</p>
      <dl v-if="props.item.details" class="m-0 grid grid-cols-1 gap-px overflow-hidden rounded-lg bg-line ring-1 ring-line sm:grid-cols-2">
        <div v-for="d in props.item.details" :key="d.label" class="flex flex-col gap-0.5 bg-surface px-3.5 py-2.5">
          <dt class="font-mono text-[10px] font-semibold tracking-[.12em] text-ink-muted uppercase">{{ d.label }}</dt>
          <dd class="m-0 text-sm font-semibold">{{ d.value }}</dd>
        </div>
      </dl>
      <p v-if="props.item.status === 'done'" class="m-0 flex items-center gap-2 rounded-md bg-ash-soft px-3 py-2 text-sm font-semibold">
        <Check class="size-4" aria-hidden="true" />Done
      </p>
      <div v-else-if="props.item.actions" class="flex flex-wrap gap-2">
        <template v-for="a in props.item.actions" :key="a.label">
          <Button v-if="a.to" as-child :variant="a.primary ? 'marigold' : 'outline'" size="sm">
            <NuxtLink :to="a.to">{{ a.label }} <ArrowRight aria-hidden="true" /></NuxtLink>
          </Button>
          <Button v-else :variant="a.primary ? 'marigold' : 'outline'" size="sm" @click="emit('act', a)">{{ a.label }}</Button>
        </template>
      </div>
    </div>
  </section>
</template>
