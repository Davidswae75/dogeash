<script setup lang="ts">
// Steps joined by the dashed marigold patrol line. Defaults to the buyer's journey; pass `steps` for others.
export interface HowItWorksStep { title: string, text: string }

const buyerSteps: HowItWorksStep[] = [
  { title: "Tell us what you're protecting", text: 'Home, compound, estate or business, and who lives there. We match the protection level.' },
  { title: 'Meet verified dogs', text: "Read each dog's K9 file, then visit the store. Every kennel is inspected by us." },
  { title: 'Handover at your gate', text: 'The trainer delivers the dog and teaches your household the commands on site.' },
]

const props = defineProps<{ steps?: HowItWorksStep[] }>()
const list = computed(() => props.steps ?? buyerSteps)
</script>

<template>
  <ol :style="{ '--steps': list.length }" class="relative m-0 grid list-none grid-cols-1 gap-8 p-0 md:grid-cols-[repeat(var(--steps),minmax(0,1fr))] md:before:absolute md:before:inset-x-7 md:before:top-[27px] md:before:border-t-[3px] md:before:border-dashed md:before:border-marigold md:before:content-[''] rise-stagger">
    <li v-for="(step, i) in list" :key="step.title" class="relative flex animate-rise flex-col gap-2.5">
      <span class="grid size-14 place-items-center rounded-full bg-marigold font-display text-2xl font-black text-on-marigold font-stretch-expanded">{{ i + 1 }}</span>
      <h3 class="mt-1.5 mb-0 font-display text-[19px] leading-6 font-extrabold [font-stretch:110%]">{{ step.title }}</h3>
      <p class="m-0 text-[15px] leading-6 text-ink-muted">{{ step.text }}</p>
    </li>
  </ol>
</template>
