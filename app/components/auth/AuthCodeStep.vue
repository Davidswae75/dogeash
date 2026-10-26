<script setup lang="ts">
import { ArrowLeft } from '@lucide/vue'

// The 6-digit code step for sign-in and sign-up. Verifies on the sixth digit; resend unlocks after 30 seconds.
const props = withDefaults(defineProps<{ destination: string, submitLabel?: string, title?: string }>(), {
  submitLabel: 'Verify',
  title: 'Enter your',
})
const emit = defineEmits<{ verified: [], back: [] }>()

const code = ref('')
const error = ref('')
const resendIn = ref(30)
let timer: ReturnType<typeof setInterval> | undefined

function startTimer() {
  resendIn.value = 30
  clearInterval(timer)
  timer = setInterval(() => {
    resendIn.value -= 1
    if (resendIn.value <= 0) clearInterval(timer)
  }, 1000)
}
onMounted(startTimer)
onBeforeUnmount(() => clearInterval(timer))

function verify() {
  if (code.value.length !== 6) return (error.value = 'Enter all 6 digits from the code we sent.')
  error.value = ''
  emit('verified')
}

watch(code, () => { error.value = '' })
</script>

<template>
  <div class="flex flex-col gap-7">
    <button type="button" class="inline-flex w-fit cursor-pointer items-center gap-1.5 border-0 bg-transparent p-0 text-sm font-semibold text-ink-muted hover:text-ink" @click="emit('back')">
      <ArrowLeft class="size-4" aria-hidden="true" />Back
    </button>
    <AuthHeading :title="props.title" outline="code">
      We sent a 6-digit code to <strong class="text-ink">{{ props.destination }}</strong>. It expires in 10 minutes.
    </AuthHeading>
    <form class="flex flex-col gap-5" method="post" novalidate @submit.prevent="verify">
      <InputOTP id="code" v-model="code" :maxlength="6" autocomplete="one-time-code" inputmode="numeric" aria-label="6-digit code" @complete="verify">
        <InputOTPGroup class="w-full">
          <InputOTPSlot v-for="i in 6" :key="i" :index="i - 1" class="h-14 flex-1 border-2 border-line-strong bg-surface font-mono text-xl font-semibold first:rounded-l-md last:rounded-r-md data-[active=true]:border-ink data-[active=true]:ring-0" />
        </InputOTPGroup>
      </InputOTP>
      <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
      <Button type="submit" class="h-12 w-full">{{ props.submitLabel }}</Button>
      <p class="m-0 text-sm text-ink-muted">
        Didn't get it?
        <button v-if="resendIn <= 0" type="button" class="cursor-pointer border-0 bg-transparent p-0 font-bold text-ink underline underline-offset-4" @click="startTimer">Send a new code</button>
        <span v-else class="font-mono">Send again in {{ resendIn }}s</span>
      </p>
    </form>
  </div>
</template>
