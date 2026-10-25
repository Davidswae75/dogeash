<script setup lang="ts">
const props = withDefaults(defineProps<{ variant?: 'marigold' | 'default' }>(), { variant: 'marigold' })
const query = defineModel<string>({ default: '' })
const emit = defineEmits<{ search: [query: string] }>()
const inputId = useId()
</script>

<template>
  <form
    role="search"
    class="flex items-center gap-2 rounded-full border-2 border-ink bg-surface py-[5px] pr-[5px] pl-5 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-focus"
    @submit.prevent="emit('search', query)"
  >
    <label :for="inputId" class="sr-only">Search guard dogs</label>
    <AppIcon name="search" class="shrink-0 text-ink-muted" />
    <Input
      :id="inputId"
      v-model="query"
      type="search"
      placeholder="Breed, protection level or city"
      class="h-auto flex-1 border-0 bg-transparent! p-0 text-base font-medium shadow-none focus-visible:ring-0 md:text-base"
    />
    <Button type="submit" :variant="props.variant" class="h-11 rounded-full">Search</Button>
  </form>
</template>
