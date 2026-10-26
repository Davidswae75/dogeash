<script setup lang="ts">
import type { HTMLAttributes, InputHTMLAttributes } from 'vue'
import { useField } from 'vee-validate'
import { cn } from '~/lib/utils'

// One validated text input, bound to the surrounding vee-validate form by `name`.
// Its error slides in under the field with a small shake. Rendered by <Fields>.
export interface FieldInputProps {
  name: string
  attrs?: InputHTMLAttributes
  inputClass?: HTMLAttributes['class']
  prefix?: string
  defaultValue?: string | number
}

const props = defineProps<FieldInputProps>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()

const name = toRef(props, 'name')
const { value, errorMessage, handleBlur, handleChange } = useField<string>(name, undefined, {
  initialValue: props.defaultValue as string | undefined,
})

const id = computed(() => props.attrs?.id ?? `field-${props.name.replace(/\./g, '-')}`)
const errorId = computed(() => `${id.value}-error`)

function onInput(e: Event) {
  const v = (e.target as HTMLInputElement).value
  handleChange(e)
  emit('update:modelValue', v)
}
</script>

<template>
  <div class="w-full">
    <div class="relative flex w-full">
      <span
        v-if="props.prefix"
        class="grid h-12 place-items-center rounded-l-md border-2 border-r-0 border-line-strong bg-surface-sunk px-3.5 font-mono text-sm font-semibold"
      >{{ props.prefix }}</span>
      <input
        v-bind="props.attrs"
        :id="id"
        :name="props.name"
        :value="value"
        :aria-invalid="!!errorMessage"
        :aria-describedby="errorMessage ? errorId : undefined"
        :class="cn(
          'h-12 w-full min-w-0 rounded-md border-2 border-line-strong bg-surface px-4 text-base text-ink caret-marigold-ink outline-none transition-colors placeholder:text-ink-muted',
          'focus:border-ink aria-invalid:border-danger',
          props.prefix && 'rounded-l-none',
          $slots['append-icon'] && 'pr-12',
          props.inputClass,
        )"
        @input="onInput"
        @blur="handleBlur"
      >
      <div v-if="$slots['append-icon']" class="absolute top-1/2 right-2 -translate-y-1/2">
        <slot name="append-icon" />
      </div>
    </div>
    <Transition
      enter-active-class="transition-[opacity,transform,max-height] duration-250 ease-calm"
      enter-from-class="max-h-0 -translate-y-1 opacity-0"
      enter-to-class="max-h-12"
      leave-active-class="transition-[opacity,max-height] duration-200"
      leave-from-class="max-h-12"
      leave-to-class="max-h-0 opacity-0"
    >
      <p v-if="errorMessage" :id="errorId" :key="errorMessage" class="animate-field-shake m-0 overflow-hidden pt-1.5 text-sm font-semibold text-danger" role="alert">
        {{ errorMessage }}
      </p>
    </Transition>
  </div>
</template>
