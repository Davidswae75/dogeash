<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import type { FieldInputProps } from './FieldInput.vue'

// Build a form's fields from a list instead of writing each one out.
// Each field validates through the surrounding vee-validate form (useForm) by its `name`.
// Optional `form` object is kept in sync too, for nested names like "owner.name".
// Slots per field: `<name>:append-icon` inside the input, `<name>:second-label` beside the label.
export interface SecondLabel {
  label: string
  to?: string
  action?: () => void
  class?: HTMLAttributes['class']
}

export type FieldConfig = {
  fieldType: 'input'
  label: string
  labelClass?: HTMLAttributes['class']
  hint?: string
  secondLabel?: SecondLabel
} & FieldInputProps

export interface FieldsProps {
  fields: FieldConfig[]
  form?: Record<string, any>
  class?: HTMLAttributes['class']
}

const props = defineProps<FieldsProps>()

const inputId = (f: FieldConfig) => f.attrs?.id ?? `field-${f.name.replace(/\./g, '-')}`
</script>

<template>
  <div :class="['flex flex-col gap-5', props.class]">
    <div v-for="f in props.fields" :key="f.name" class="flex flex-col gap-2">
      <div class="flex items-end justify-between gap-3">
        <label :for="inputId(f)" :class="['text-sm font-bold text-ink', f.labelClass]">{{ f.label }}</label>
        <slot :name="`${f.name}:second-label`">
          <template v-if="f.secondLabel">
            <NuxtLink
              v-if="f.secondLabel.to"
              :to="f.secondLabel.to"
              :class="['text-sm font-semibold text-ink-muted no-underline hover:text-ink hover:underline', f.secondLabel.class]"
            >{{ f.secondLabel.label }}</NuxtLink>
            <button
              v-else
              type="button"
              :class="['cursor-pointer border-0 bg-transparent p-0 text-sm font-semibold text-ink-muted hover:text-ink hover:underline', f.secondLabel.class]"
              @click="f.secondLabel.action?.()"
            >{{ f.secondLabel.label }}</button>
          </template>
        </slot>
      </div>

      <FieldInput
        v-if="f.fieldType === 'input'"
        :name="f.name"
        :attrs="f.attrs"
        :input-class="f.inputClass"
        :prefix="f.prefix"
        :default-value="props.form ? getNestedValue<string | number>(props.form, f.name) : f.defaultValue"
        @update:model-value="(v) => props.form && setNestedValue(props.form, f.name, v)"
      >
        <template v-if="$slots[`${f.name}:append-icon`]" #append-icon>
          <slot :name="`${f.name}:append-icon`" />
        </template>
      </FieldInput>

      <span v-if="f.hint" class="text-[13px] text-ink-muted">{{ f.hint }}</span>
    </div>
  </div>
</template>
