<script setup lang="ts">
// Label, hint and error around a form control that isn't a text input (chips, selects, a textarea),
// so they read the same as the fields <Fields> builds. `for` points the label at the control.
// `optional` says so beside the label, for a field that can be left empty.
const props = defineProps<{ label: string, for?: string, hint?: string, error?: string, optional?: boolean }>()
</script>

<template>
  <div class="flex flex-col gap-2">
    <label v-if="props.for" :for="props.for" class="text-sm font-bold text-ink">{{ props.label }}<OptionalTag v-if="props.optional" /></label>
    <span v-else class="text-sm font-bold text-ink">{{ props.label }}<OptionalTag v-if="props.optional" /></span>
    <slot />
    <span v-if="props.hint" class="text-[13px] text-ink-muted">{{ props.hint }}</span>
    <p v-if="props.error" :key="props.error" class="animate-field-shake m-0 text-sm font-semibold text-danger" role="alert">{{ props.error }}</p>
  </div>
</template>
