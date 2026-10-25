<script setup lang="ts">
// Ten honest statements; the score says whether to start looking or wait
const answers = ref<boolean[]>(guideReadiness.map(() => false))
const score = computed(() => answers.value.filter(Boolean).length)

const verdict = computed(() => {
  if (score.value >= 9) return { title: 'You are ready to look', body: 'Your home and routine suit a guard dog. Start with the protection level that fits your household.', tone: 'bg-marigold text-on-marigold' }
  if (score.value >= 6) return { title: 'Nearly there', body: 'Sort out the unticked points first. Most of them are cheaper to fix before the dog arrives than after.', tone: 'bg-ash text-on-ash' }
  return { title: 'Not yet', body: 'A guard dog would struggle in your home right now. Cameras, an alarm or a guard may suit you better for the moment.', tone: 'bg-night text-on-night' }
})
</script>

<template>
  <div class="grid gap-6 lg:grid-cols-[1fr_320px] lg:items-start">
    <ul class="m-0 flex list-none flex-col p-0">
      <li v-for="(question, i) in guideReadiness" :key="question" class="border-b border-line last:border-b-0">
        <label :for="`ready-${i}`" class="flex cursor-pointer items-start gap-3.5 py-3.5">
          <Checkbox :id="`ready-${i}`" v-model="answers[i]" class="mt-0.5 size-5 rounded-[5px] border-2 border-ink" />
          <span class="text-[15px] leading-[22px]">{{ question }}</span>
        </label>
      </li>
    </ul>
    <div :class="['flex flex-col gap-3 rounded-lg p-6 transition-colors lg:sticky lg:top-24', verdict.tone]" aria-live="polite">
      <span class="text-xs leading-4 font-bold tracking-[.08em] uppercase">Your score</span>
      <span class="mega text-[64px] leading-none tabular-nums">{{ score }}<span class="text-[28px]">/{{ guideReadiness.length }}</span></span>
      <div class="flex gap-1" aria-hidden="true">
        <i v-for="n in guideReadiness.length" :key="n" :class="['h-2 flex-1 rounded-[2px]', n <= score ? 'bg-current' : 'bg-current opacity-20']" />
      </div>
      <strong class="font-display text-xl leading-6 font-extrabold font-stretch-expanded">{{ verdict.title }}</strong>
      <p class="m-0 text-sm leading-[22px]">{{ verdict.body }}</p>
    </div>
  </div>
</template>
