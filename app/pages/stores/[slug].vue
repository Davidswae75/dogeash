<script setup lang="ts">
import { CalendarDays, Clock, MapPin, MessageSquare, Quote, Star, Truck } from '@lucide/vue'
import type { ProtectionLevel } from '~/utils/protection'

// A store: its dogs for sale, who runs it, its history, inspection record, care team and reviews
const route = useRoute()
const store = findStore(String(route.params.slug))
if (!store) throw createError({ statusCode: 404, statusMessage: 'No store with that name' })

const summary = storeSummary(store)
// People who work at this store see management actions instead of Contact and Book
const { memberOf } = useSession()
const isOwn = computed(() => !!memberOf(store.id))
const care = store.care
  .map(link => ({ ...link, provider: findCareProvider(link.providerId)! }))
  .filter(c => c.provider)

useSeoMeta({
  title: `${store.name}, ${store.city} · Dogeash`,
  description: `${store.tagline}. ${summary.dogs.length} dogs listed. ${store.verified ? `Inspected by Dogeash in ${store.inspection.date}.` : 'Dogeash inspection booked.'}`,
})

const levelFilter = ref<ProtectionLevel[]>([])
const availableOnly = ref<string[]>([])
const levelOptions = summary.levels.map(n => ({ value: n, label: `Level ${n}` }))
const dogs = computed(() => summary.dogs.filter(d =>
  (!levelFilter.value.length || levelFilter.value.includes(d.level))
  && (!availableOnly.value.length || d.status === 'available'),
))

// Skip titles like "Col." and "(rtd)"
const ownerInitials = store.owner.name.split(' ').filter(w => /^[A-Z][a-z]/.test(w) && !w.endsWith('.')).slice(0, 2).map(w => w[0]).join('')
const years = new Date().getFullYear() - store.founded

const stats = [
  { value: String(summary.available), label: 'for sale now' },
  { value: String(store.dogsPlaced), label: 'dogs placed' },
  { value: String(years), label: years === 1 ? 'year running' : 'years running' },
  { value: store.reviews ? String(store.rating) : 'New', label: store.reviews ? `${store.reviews} reviews` : 'no reviews yet' },
]

// Section tabs with a sliding marigold indicator that follows the section in view
const sections = [
  { id: 'dogs', label: 'Dogs' },
  { id: 'about', label: 'About' },
  { id: 'people', label: 'People' },
  { id: 'inspection', label: 'Inspection' },
  { id: 'reviews', label: 'Reviews' },
]
const active = ref('dogs')
const tabEls = ref<HTMLElement[]>([])
const indicator = ref({ left: 0, width: 0 })

function moveIndicator() {
  const el = tabEls.value[sections.findIndex(s => s.id === active.value)]
  if (el) indicator.value = { left: el.offsetLeft, width: el.offsetWidth }
}

watch(active, () => nextTick(moveIndicator))

onMounted(() => {
  moveIndicator()
  const observer = new IntersectionObserver((entries) => {
    const visible = entries.filter(e => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)
    if (visible[0]) active.value = visible[0].target.id
  }, { rootMargin: '-30% 0px -60% 0px' })
  sections.forEach(s => document.getElementById(s.id) && observer.observe(document.getElementById(s.id)!))
  window.addEventListener('resize', moveIndicator)
  onBeforeUnmount(() => {
    observer.disconnect()
    window.removeEventListener('resize', moveIndicator)
  })
})

const eyebrow = 'text-xs leading-4 font-bold tracking-[.08em] uppercase'
const h2 = 'm-0 mega text-[clamp(26px,2.6vw,34px)] leading-none'
</script>

<template>
  <div v-if="store" class="mx-auto flex w-full max-w-[calc(var(--container)+64px)] flex-col px-4 pt-5 pb-24 sm:px-8 lg:pb-8">
    <nav aria-label="Breadcrumb" class="pb-4 text-sm text-ink-muted">
      <NuxtLink to="/stores" class="text-ink-muted no-underline hover:text-ink">Stores</NuxtLink>
      <span class="mx-2" aria-hidden="true">/</span>
      <span class="text-ink">{{ store.name }}</span>
    </nav>

    <OwnListingBanner :store="store" what="store" class="mb-4" />

    <!-- Banner: the store's own banner image will replace this once stores can upload one -->
    <StoreBanner :store="store" size="hero" class="h-[220px] animate-rise rounded-xl sm:h-[340px]">
      <span class="absolute top-8 right-8 hidden items-center gap-1.5 rounded-full bg-surface px-3 py-1.5 font-mono text-[11px] font-semibold tracking-[.1em] text-ink uppercase sm:inline-flex sm:top-10 sm:right-10">
        <span :class="['size-1.5 rounded-full', store.verified ? 'bg-marigold' : 'bg-ash']" aria-hidden="true" />
        {{ store.verified ? `Inspected ${store.inspection.date}` : 'Inspection booked' }}
      </span>
    </StoreBanner>

    <div class="grid gap-10 pt-8 lg:grid-cols-[1fr_340px] lg:gap-14">
      <div class="flex min-w-0 flex-col">
        <!-- Title -->
        <header class="flex animate-rise flex-col gap-4 [animation-delay:80ms]">
          <div class="flex items-center gap-3">
            <StoreAvatar :initials="store.initials" class="size-12 rounded-[14px]" />
            <Badge v-if="store.verified" variant="verified"><AppIcon name="shield" :size="14" />Verified store</Badge>
            <Badge v-else>Inspection booked</Badge>
          </div>
          <h1 class="m-0 mega text-[clamp(34px,4.2vw,56px)] leading-[.98]">{{ store.name }}</h1>
          <p class="m-0 max-w-[34em] text-[17px] leading-[27px] text-ink-muted">{{ store.tagline }}</p>
          <div class="flex flex-wrap gap-x-5 gap-y-2 text-sm text-ink-muted">
            <span class="inline-flex items-center gap-1.5"><MapPin class="size-4" aria-hidden="true" />{{ store.area }}, {{ store.city }}</span>
            <span class="inline-flex items-center gap-1.5"><CalendarDays class="size-4" aria-hidden="true" />Since {{ store.founded }}</span>
            <span class="inline-flex items-center gap-1.5"><MessageSquare class="size-4" aria-hidden="true" />Replies in {{ store.replies }}</span>
          </div>
        </header>

        <dl class="m-0 mt-8 grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
          <div v-for="stat in stats" :key="stat.label" class="flex animate-rise flex-col-reverse justify-end gap-1 border-t-[3px] border-ink pt-3 [animation-delay:160ms]">
            <dt class="text-[13px] text-ink-muted">{{ stat.label }}</dt>
            <dd class="m-0 mega text-[clamp(30px,3vw,42px)] leading-none tabular-nums">{{ stat.value }}</dd>
          </div>
        </dl>

        <!-- Section tabs -->
        <nav aria-label="On this page" class="sticky top-[calc(var(--header-height)+env(safe-area-inset-top,0px))] z-10 -mx-4 mt-10 bg-canvas px-4 sm:mx-0 sm:px-0">
          <ul v-center-tab class="relative m-0 flex list-none gap-1 overflow-x-auto border-b border-line p-0 [scrollbar-width:none]">
            <li v-for="s in sections" :key="s.id">
              <a
                ref="tabEls"
                :href="`#${s.id}`"
                :aria-current="active === s.id ? 'true' : undefined"
                :class="['block px-3 py-3.5 text-sm font-semibold whitespace-nowrap no-underline transition-colors', active === s.id ? 'text-ink' : 'text-ink-muted hover:text-ink']"
              >{{ s.label }}</a>
            </li>
            <span
              class="absolute bottom-0 h-[3px] rounded-full bg-marigold transition-[left,width] duration-300 ease-calm"
              :style="{ left: `${indicator.left}px`, width: `${indicator.width}px` }"
              aria-hidden="true"
            />
          </ul>
        </nav>

        <!-- Dogs -->
        <section id="dogs" class="flex scroll-mt-32 flex-col gap-6 pt-10">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <div class="flex flex-col gap-2">
              <span :class="[eyebrow, 'text-ink-muted']">{{ summary.dogs.length }} listed · {{ summary.available }} available</span>
              <h2 :class="h2">Dogs for <span class="text-outline">sale</span></h2>
            </div>
            <div v-if="summary.dogs.length" class="flex flex-wrap gap-2">
              <FilterChips v-model="levelFilter" :options="levelOptions" label="Protection level" />
              <FilterChips v-model="availableOnly" :options="[{ value: 'yes', label: 'Available only' }]" label="Availability" />
            </div>
          </div>
          <TransitionGroup
            v-if="dogs.length"
            tag="div"
            class="grid grid-cols-1 gap-5 sm:grid-cols-2"
            move-class="transition-transform duration-500 ease-calm"
            enter-active-class="transition duration-400 ease-calm"
            enter-from-class="translate-y-3 opacity-0"
            leave-active-class="hidden"
          >
            <K9Card v-for="dog in dogs" :key="dog.fileNo" :dog="dog" />
          </TransitionGroup>
          <HelpPanel v-else-if="!summary.dogs.length" title="No dogs listed yet">
            {{ store.name }}'s dogs will appear here once the Dogeash inspection in {{ store.inspection.date }} has passed.
          </HelpPanel>
          <p v-else class="m-0 text-[15px] text-ink-muted">
            No dogs match those filters.
            <button type="button" class="cursor-pointer border-0 bg-transparent p-0 font-bold text-ink underline" @click="levelFilter = []; availableOnly = []">Show all dogs</button>
          </p>
        </section>

        <!-- About -->
        <section id="about" class="flex scroll-mt-32 flex-col gap-8 pt-16">
          <div class="flex flex-col gap-4">
            <h2 :class="h2">About the <span class="text-outline">store</span></h2>
            <p class="m-0 max-w-[38em] text-[17px] leading-[28px]">{{ store.about }}</p>
          </div>

          <ul class="m-0 grid list-none gap-x-8 gap-y-4 p-0 sm:grid-cols-2">
            <li v-for="service in store.services" :key="service" class="flex gap-3">
              <span class="mt-0.5 grid size-5 shrink-0 place-items-center rounded-full bg-marigold text-on-marigold"><AppIcon name="check" :size="13" /></span>
              <span>
                <strong class="block text-[15px] leading-[22px]">{{ storeServices[service].label }}</strong>
                <span class="text-[13px] leading-[19px] text-ink-muted">{{ storeServices[service].hint }}</span>
              </span>
            </li>
          </ul>

          <div class="flex flex-col gap-4">
            <span :class="[eyebrow, 'text-ink-muted']">History</span>
            <ol class="m-0 flex list-none flex-col p-0">
              <li v-for="(event, i) in store.history" :key="event.year" class="grid grid-cols-[64px_20px_1fr] gap-x-3">
                <span class="pt-0.5 font-mono text-sm font-semibold tabular-nums">{{ event.year }}</span>
                <span class="relative flex justify-center" aria-hidden="true">
                  <span :class="['relative z-[1] mt-1.5 size-3 rounded-full ring-4 ring-canvas', i === store.history.length - 1 ? 'bg-marigold' : 'bg-ink']" />
                  <span v-if="i < store.history.length - 1" class="absolute top-3 bottom-0 w-0 border-l-2 border-dashed border-line-strong" />
                </span>
                <span class="pb-6 text-[15px] leading-[22px]">{{ event.text }}</span>
              </li>
            </ol>
          </div>
        </section>

        <!-- People: owner and care team -->
        <section id="people" class="flex scroll-mt-32 flex-col gap-6 pt-12">
          <h2 :class="h2">The <span class="text-outline">people</span></h2>

          <div class="flex flex-col gap-5 rounded-xl bg-night p-6 text-on-night sm:flex-row sm:p-8">
            <Avatar class="size-20 shrink-0 rounded-full">
              <AvatarFallback class="rounded-full bg-marigold font-display text-2xl font-black text-on-marigold">{{ ownerInitials }}</AvatarFallback>
            </Avatar>
            <div class="flex flex-col gap-3">
              <div>
                <span :class="[eyebrow, 'text-marigold']">Owner</span>
                <strong class="mt-1 block font-display text-[22px] leading-7 font-extrabold font-stretch-expanded">{{ store.owner.name }}</strong>
                <span class="text-sm">{{ store.owner.title }} · {{ store.owner.yearsWithDogs }} years with dogs</span>
              </div>
              <p class="m-0 max-w-[40em] text-[15px] leading-[25px]">{{ store.owner.bio }}</p>
              <div class="flex flex-wrap gap-2">
                <span v-for="c in store.owner.credentials" :key="c" class="rounded-full border border-on-night/30 px-3 py-1 text-xs font-semibold">{{ c }}</span>
              </div>
            </div>
          </div>

          <div class="flex flex-col gap-3">
            <div class="flex flex-wrap items-baseline justify-between gap-2">
              <span :class="[eyebrow, 'text-ink-muted']">Vets and trainers they work with</span>
              <span class="text-[13px] text-ink-muted">Book them yourself, before or after you buy</span>
            </div>
            <ul v-if="care.length" class="m-0 flex list-none flex-col divide-y divide-line rounded-xl bg-surface p-0 ring-1 ring-line">
              <li v-for="c in care" :key="c.providerId" class="flex flex-col gap-4 p-5 sm:flex-row sm:items-center">
                <CareProviderIcon :type="c.provider.type" />
                <div class="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span class="text-[11px] leading-4 font-bold tracking-[.08em] text-marigold-ink uppercase">{{ c.relationship }}</span>
                  <span class="flex flex-wrap items-center gap-2">
                    <NuxtLink :to="`/care/${careProviderSlug(c.provider)}`" class="text-[16px] leading-6 font-bold text-ink underline-offset-4 hover:underline">{{ c.provider.name }}</NuxtLink>
                    <AppIcon v-if="c.provider.verified" name="shield" :size="16" class="text-verified" aria-label="Verified" />
                  </span>
                  <span class="text-[13px] text-ink-muted">
                    <template v-if="c.provider.person">{{ c.provider.person }} · </template>{{ c.provider.areas }}
                    · <Star class="inline size-3 fill-marigold text-marigold" aria-hidden="true" /> {{ c.provider.rating }}
                    <template v-if="c.provider.homeVisits"> · Home visits</template>
                  </span>
                </div>
                <CareBookingDialog :provider="c.provider" label="Book" />
              </li>
            </ul>
            <p v-else class="m-0 rounded-xl bg-surface p-5 text-[15px] text-ink-muted ring-1 ring-line">This store hasn't added its vet or trainers yet.</p>
          </div>
        </section>

        <!-- Inspection -->
        <section id="inspection" class="flex scroll-mt-32 flex-col gap-5 pt-16">
          <h2 :class="h2">Inspection <span class="text-outline">record</span></h2>
          <div class="flex flex-col gap-5 rounded-xl bg-surface p-6 ring-1 ring-line sm:flex-row sm:items-start sm:gap-8 sm:p-8">
            <div class="flex shrink-0 flex-col gap-3">
              <VerifiedStamp v-if="store.inspection.status === 'passed'" class="w-fit text-xs" />
              <Badge v-else>Booked</Badge>
              <span class="font-mono text-sm">{{ store.inspection.date }}</span>
              <span class="text-[13px] text-ink-muted">{{ store.inspection.by }}</span>
            </div>
            <ul v-if="store.inspection.checks.length" class="m-0 flex list-none flex-wrap gap-2 p-0">
              <li v-for="check in store.inspection.checks" :key="check" class="inline-flex items-center gap-2 rounded-full bg-ash-soft py-1.5 pr-3.5 pl-1.5 text-sm font-medium">
                <span class="grid size-5 place-items-center rounded-full bg-night text-marigold"><AppIcon name="check" :size="12" /></span>
                {{ check }}
              </li>
            </ul>
            <p v-else class="m-0 text-[15px] leading-6 text-ink-muted">Dogeash inspects every kennel in person before its dogs can be listed: runs and shade, vet records, protection levels and microchips. The result will appear here.</p>
          </div>
        </section>

        <!-- Reviews -->
        <section id="reviews" class="flex scroll-mt-32 flex-col gap-5 pt-16">
          <div class="flex flex-wrap items-end justify-between gap-4">
            <h2 :class="h2">What buyers <span class="text-outline">say</span></h2>
            <span v-if="store.reviews" class="text-sm text-ink-muted"><strong class="text-ink">{{ store.rating }}</strong> from {{ store.reviews }} reviews after handover</span>
          </div>
          <div v-if="store.reviewSamples.length" class="flex flex-col gap-4">
            <figure v-for="review in store.reviewSamples" :key="review.name + review.date" class="m-0 grid gap-4 rounded-xl bg-surface p-6 ring-1 ring-line sm:grid-cols-[auto_1fr]">
              <Quote class="size-8 text-marigold" aria-hidden="true" />
              <div class="flex flex-col gap-3">
                <blockquote class="m-0 text-[17px] leading-[27px]">{{ review.text }}</blockquote>
                <figcaption class="flex flex-wrap items-center gap-x-3 gap-y-1 text-sm text-ink-muted">
                  <span class="flex gap-0.5" :aria-label="`${review.rating} out of 5`">
                    <Star v-for="n in 5" :key="n" :class="['size-3.5', n <= review.rating ? 'fill-marigold text-marigold' : 'text-line-strong']" aria-hidden="true" />
                  </span>
                  <span><strong class="text-ink">{{ review.name }}</strong>, {{ review.city }} · {{ review.date }}<template v-if="review.dog"> · bought {{ review.dog }}</template></span>
                </figcaption>
              </div>
            </figure>
          </div>
          <p v-else class="m-0 text-[15px] text-ink-muted">No reviews yet. Reviews come only from buyers after a completed handover.</p>
        </section>
      </div>

      <!-- Contact panel -->
      <aside class="hidden lg:block">
        <div class="sticky top-[calc(var(--header-height)+24px)] flex animate-rise flex-col gap-5 rounded-xl bg-surface p-6 ring-1 ring-line [animation-delay:160ms]">
          <div class="flex items-center gap-3">
            <StoreAvatar :initials="store.initials" class="size-11 rounded-xl" />
            <div class="min-w-0">
              <strong class="block truncate text-[15px] leading-5">{{ store.name }}</strong>
              <span class="text-[13px] text-ink-muted">Replies in {{ store.replies }}</span>
            </div>
          </div>
          <div class="flex flex-col gap-2.5">
            <OwnListingActions v-if="isOwn" :store="store" />
            <template v-else>
              <ContactStoreDialog :store="store" trigger-class="w-full" />
              <KennelVisitDialog :store="store" trigger-class="h-10 w-full" />
            </template>
          </div>
          <ul class="m-0 flex list-none flex-col gap-3 border-t border-line p-0 pt-5 text-sm">
            <li class="flex gap-2.5"><MapPin class="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />{{ store.area }}, {{ store.city }}, {{ store.state }}</li>
            <li class="flex gap-2.5"><Clock class="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />{{ store.hours }}</li>
            <li class="flex gap-2.5"><Truck class="mt-0.5 size-4 shrink-0 text-ink-muted" aria-hidden="true" />Delivers to {{ store.deliveryAreas }}</li>
          </ul>
          <div v-if="summary.priceFrom" class="flex items-baseline justify-between rounded-md bg-ash-soft px-4 py-3">
            <span class="text-[13px] text-ink-muted">Dogs from</span>
            <span class="font-mono text-[15px] font-semibold">{{ formatNaira(summary.priceFrom) }}</span>
          </div>
        </div>
      </aside>
    </div>

    <!-- Phone: contact bar -->
    <div class="fixed inset-x-0 bottom-0 z-20 flex items-center gap-3 border-t border-line bg-canvas px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom,0px))] lg:hidden">
      <div class="min-w-0 flex-1">
        <strong class="block truncate text-sm">{{ store.name }}</strong>
        <span class="text-xs text-ink-muted">Replies in {{ store.replies }}</span>
      </div>
      <Button v-if="isOwn" as-child variant="marigold" size="sm"><NuxtLink to="/dashboard">Store dashboard</NuxtLink></Button>
      <ContactStoreDialog v-else :store="store" size="sm" />
    </div>
  </div>
</template>
