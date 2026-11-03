<script setup lang="ts">
import { LogOut } from '@lucide/vue'
import { useSeoMeta } from '#imports'
import { useSession } from '~/composables/useSession'

// Settings: your details, password, how we reach you, and signing out. Each part saves on its own.
useSeoMeta({ title: 'Settings · My Dogeash' })
const { user, signOut } = useSession()
</script>

<template>
  <div class="flex flex-col gap-6">
    <AccountHeading :kicker="`Settings · ${user?.ref ?? ''}`" title="Your" outline="settings" />
    <div class="grid grid-cols-[minmax(0,1fr)] gap-5 xl:grid-cols-2">
      <AccountSettingsDetails />
      <div class="flex min-w-0 flex-col gap-5">
        <AccountSettingsContact />
        <AccountSettingsPassword />
      </div>
    </div>
    <section class="flex flex-col gap-3 rounded-xl border-[1.5px] border-dashed border-line-strong p-5 sm:flex-row sm:items-center">
      <div class="flex flex-1 flex-col gap-1">
        <strong class="text-[15px]">Signed in as {{ user?.email }}</strong>
        <span class="text-[13px] text-ink-muted">To close your account and remove your data, contact Dogeash support. Self-service deletion is coming.</span>
      </div>
      <Button variant="outline" class="w-fit" @click="signOut"><LogOut aria-hidden="true" />Sign out</Button>
    </section>
  </div>
</template>
