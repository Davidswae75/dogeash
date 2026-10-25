<script setup lang="ts">
import type { Seller } from '~/utils/sellers'

// Kennel summary: initials avatar, inspection date, verified badge, three facts
const props = withDefaults(defineProps<{ seller: Seller, compact?: boolean }>(), { compact: false })
</script>

<template>
  <div class="flex flex-col gap-4 rounded-lg border border-line bg-surface p-6">
    <div class="flex items-center gap-3.5">
      <Avatar class="size-12 rounded-[14px]">
        <AvatarFallback class="rounded-[14px] bg-night font-display text-[17px] font-extrabold text-on-night">{{ props.seller.initials }}</AvatarFallback>
      </Avatar>
      <div>
        <div class="font-display text-[19px] leading-6 font-bold [font-stretch:110%]">{{ props.seller.name }}</div>
        <div class="text-sm leading-[22px] text-ink-muted">
          <template v-if="props.compact">{{ props.seller.rating }} · {{ props.seller.reviews }} reviews</template>
          <template v-else>{{ props.seller.city }} · Inspected {{ props.seller.inspected }}</template>
        </div>
      </div>
      <Badge v-if="props.seller.verified" variant="verified" class="ml-auto">
        <AppIcon name="shield" :size="14" />Verified
      </Badge>
    </div>

    <template v-if="!props.compact">
      <FactRow
        :facts="[
          { label: 'Rating', value: `${props.seller.rating} · ${props.seller.reviews}` },
          { label: 'Dogs', value: props.seller.dogs },
          { label: 'Replies', value: props.seller.replies },
        ]"
      />
      <div class="flex gap-2">
        <Button size="sm">Contact seller</Button>
        <Button variant="outline" size="sm">Visit store</Button>
      </div>
    </template>
  </div>
</template>
