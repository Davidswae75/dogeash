<script setup lang="ts">
import { Heart, LogIn, UserPlus } from '@lucide/vue'

// "Sign in to book a visit with …": shown when a signed-out visitor tries something that needs an account.
// One instance lives in each layout; buttons open it through useAccountGate().
const gate = useAccountGateDialog()
const route = useRoute()
const { count } = useShortlist()

const open = computed({
  get: () => !!gate.value,
  set: (v) => { if (!v) gate.value = null },
})
const links = computed(() => gate.value ? accountGateLinks(gate.value, route.fullPath) : undefined)

// Leaving for sign-in closes the dialog
function go() {
  gate.value = null
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="gap-0 overflow-hidden border-line bg-surface p-0 sm:max-w-[440px]">
      <div class="h-1.5 hazard-thin" aria-hidden="true" />
      <div v-if="gate && links" class="flex flex-col gap-5 p-6 sm:p-7">
        <DialogHeader class="gap-2 text-left">
          <span class="font-mono text-[10.5px] font-semibold tracking-[.12em] text-ink-muted uppercase">Account needed</span>
          <DialogTitle class="font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">
            Sign in to {{ gate.action }}
          </DialogTitle>
          <DialogDescription class="text-[15px] leading-6 text-ink-muted">{{ gate.reason }}</DialogDescription>
        </DialogHeader>

        <ClientOnly>
          <p v-if="count" class="m-0 flex items-center gap-2.5 rounded-md bg-marigold-soft px-3.5 py-2.5 text-sm">
            <Heart class="size-4 shrink-0 fill-current text-marigold-ink" aria-hidden="true" />
            Your {{ count }} saved {{ count === 1 ? 'dog comes' : 'dogs come' }} with you.
          </p>
        </ClientOnly>

        <div class="flex flex-col gap-2.5">
          <Button as-child variant="marigold" class="h-11 w-full">
            <NuxtLink :to="links.signIn" @click="go"><LogIn aria-hidden="true" />Sign in</NuxtLink>
          </Button>
          <Button as-child variant="outline" class="h-11 w-full">
            <NuxtLink :to="links.signUp" @click="go"><UserPlus aria-hidden="true" />Create a free account</NuxtLink>
          </Button>
        </div>

        <p class="m-0 text-center text-[13px] leading-5 text-ink-muted">
          You'll come straight back here. Browsing, saving and comparing dogs never need an account.
        </p>
      </div>
    </DialogContent>
  </Dialog>
</template>
