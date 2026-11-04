<script setup lang="ts">
import { Ellipsis, ExternalLink, Pencil, Trash2 } from '@lucide/vue'
import type { StoreDog } from '~/utils/dogs'
import type { ListingStatus } from '~/utils/k9'
import { listingActions } from '~/utils/dogs'

// The ⋯ menu on a dog: edit, see it as buyers do, move it on (live, reserved, sold, withdrawn), delete a draft
const props = defineProps<{ dog: StoreDog, verified: boolean, canDelete: boolean }>()
const emit = defineEmits<{ status: [to: ListingStatus], remove: [] }>()
</script>

<template>
  <DropdownMenu>
    <DropdownMenuTrigger as-child>
      <button type="button" class="grid size-8 cursor-pointer place-items-center rounded-full border-0 bg-transparent text-ink-muted hover:bg-surface-sunk hover:text-ink" :aria-label="`Actions for ${props.dog.name}`">
        <Ellipsis class="size-4" aria-hidden="true" />
      </button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" class="w-48 rounded-lg border-line bg-surface p-1 shadow-[0_18px_40px_-20px_rgb(0_0_0/.45)]">
      <DropdownMenuItem as-child>
        <NuxtLink :to="`/dashboard/dogs/${props.dog.fileNo.toLowerCase()}`"><Pencil aria-hidden="true" />Edit</NuxtLink>
      </DropdownMenuItem>
      <DropdownMenuItem v-if="props.dog.status === 'available' || props.dog.status === 'reserved'" as-child>
        <NuxtLink :to="`/dogs/${props.dog.fileNo.toLowerCase()}`" target="_blank"><ExternalLink aria-hidden="true" />View listing</NuxtLink>
      </DropdownMenuItem>
      <template v-if="listingActions(props.dog.status, props.verified).length">
        <DropdownMenuSeparator />
        <DropdownMenuItem v-for="a in listingActions(props.dog.status, props.verified)" :key="a.to" @select="emit('status', a.to)">{{ a.label }}</DropdownMenuItem>
      </template>
      <template v-if="props.dog.status === 'draft' && props.canDelete">
        <DropdownMenuSeparator />
        <DropdownMenuItem class="text-danger" @select="emit('remove')"><Trash2 aria-hidden="true" />Delete draft</DropdownMenuItem>
      </template>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
