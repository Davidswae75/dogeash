<script setup lang="ts">
import { Info } from '@lucide/vue'
import type { Dog } from '~/utils/dogs'
import { computed } from 'vue'
import { dogeashId } from '~/utils/dogs'

// A dog's properties on its page: each in its own cell with dividing lines, and an info button that explains
// what the property means and why it matters (a popover, so it works by tap as well as by mouse).
const props = defineProps<{ dog: Dog }>()

const facts = computed(() => {
  const d = props.dog
  const f = d.file
  return [
    { label: 'Dogeash ID', value: dogeashId(d.fileNo), tip: 'The number Dogeash gives every dog it lists. Quote it to the store, in messages and on your receipt so everyone means the same dog.' },
    { label: 'Breed', value: d.breed, tip: 'The breed the store registered. Its pedigree (sire and dam) is below when the store has it.' },
    { label: 'Sex', value: d.sex, tip: 'Males are usually bigger and more territorial; females are often quicker to train and settle with families.' },
    { label: 'Age', value: f ? `${d.age} · born ${f.born}` : d.age, tip: 'Guard dogs are at their best from about 2 to 8 years. Younger dogs are still in training; older ones may slow down.' },
    { label: 'Weight', value: `${d.weightKg} kg`, tip: 'Its weight when the store last checked. A healthy weight for the breed matters more than a big number.' },
    { label: 'Hips / elbows', value: f?.hipsElbows ?? d.hips, tip: 'An X-ray grade of the hip and elbow joints. Good or excellent means a lower risk of painful joint problems later.' },
    { label: 'Microchip', value: f?.microchip, tip: 'The number on the chip under the dog\'s skin. A vet can scan it to prove the dog is this one, and to bring it back if it\'s lost.' },
    { label: 'Vaccinations', value: f?.vaccinations, tip: 'The vaccines the dog has had. You get the card at handover; boosters are due once a year.' },
    { label: 'Titles', value: f?.titles, tip: 'Training certificates or competition titles the dog has earned, a sign of what it has already proved it can do.' },
    { label: 'Sire', value: f?.sire, tip: 'The dog\'s father. Good lines tend to pass on temperament and health.' },
    { label: 'Dam', value: f?.dam, tip: 'The dog\'s mother.' },
    { label: 'Kennel inspected', value: f?.inspected, tip: 'When Dogeash last visited this dog\'s kennel in person to check the dogs, the conditions and the records.' },
  ].filter(x => x.value)
})
</script>

<template>
  <section class="overflow-hidden rounded-xl bg-surface ring-1 ring-line" aria-labelledby="dog-facts">
    <h2 id="dog-facts" class="m-0 border-b border-line px-5 py-3.5 font-display text-[17px] leading-6 font-extrabold font-stretch-expanded sm:px-6">Details</h2>
    <!-- Cells share borders: a 1px gap over the line colour draws the dividing lines -->
    <dl class="m-0 grid grid-cols-1 gap-px bg-line min-[420px]:grid-cols-2 md:grid-cols-3">
      <div v-for="fact in facts" :key="fact.label" class="flex flex-col gap-1.5 bg-surface px-5 py-4 sm:px-6">
        <dt class="flex items-center gap-1 text-[11px] leading-4 font-bold tracking-[.08em] text-ink-muted uppercase">
          {{ fact.label }}
          <Popover>
            <PopoverTrigger as-child>
              <button type="button" class="-m-1 grid size-6 place-items-center rounded-full text-ink-muted hover:text-ink focus-visible:outline-2 focus-visible:outline-ink" :aria-label="`What ${fact.label.toLowerCase()} means`">
                <Info class="size-3.5" aria-hidden="true" />
              </button>
            </PopoverTrigger>
            <PopoverContent side="top" :side-offset="6" class="w-[min(280px,calc(100vw-32px))] border-transparent bg-ink p-3 text-[13px] leading-5 font-normal tracking-normal text-canvas normal-case">
              {{ fact.tip }}
            </PopoverContent>
          </Popover>
        </dt>
        <dd class="m-0 font-mono text-[15px] leading-5 font-medium text-ink" :class="fact.label === 'Dogeash ID' && 'font-semibold tracking-[.04em]'">{{ fact.value }}</dd>
      </div>
    </dl>
  </section>
</template>
