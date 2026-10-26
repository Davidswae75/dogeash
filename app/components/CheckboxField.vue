<script setup lang="ts">
import { useField } from 'vee-validate'

// A validated checkbox bound to the surrounding vee-validate form by `name`. The label goes in the slot.
const props = defineProps<{ name: string }>()

const { value, errorMessage } = useField<boolean>(() => props.name, undefined, { type: 'checkbox', checkedValue: true, uncheckedValue: false })
const id = computed(() => `field-${props.name.replace(/\./g, '-')}`)
</script>

<template>
  <div class="flex flex-col gap-1.5">
    <label :for="id" class="flex cursor-pointer items-start gap-3 text-sm leading-[21px]">
      <Checkbox
        :id="id"
        :model-value="value"
        :aria-invalid="!!errorMessage"
        :aria-describedby="errorMessage ? `${id}-error` : undefined"
        class="mt-0.5 size-5 rounded-[5px] border-2 border-ink"
        @update:model-value="(v) => (value = v === true)"
      />
      <span><slot /></span>
    </label>
    <p v-if="errorMessage" :id="`${id}-error`" class="animate-field-shake m-0 pl-8 text-sm font-semibold text-danger" role="alert">{{ errorMessage }}</p>
  </div>
</template>
