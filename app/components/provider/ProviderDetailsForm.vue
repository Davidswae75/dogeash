<script setup lang="ts">
import { Plus, Trash2 } from '@lucide/vue'
import { ref, watch } from 'vue'
import { useNotify } from '~/composables/useNotify'
import { useProviderDashboard } from '~/composables/useProviderDashboard'
import type { CareMilestone } from '~/utils/care'

// Provider dashboard › Your listing: photos (of the person and the workplace), the workplace address, when
// they started, a short history, and how signed-in buyers can reach them. Saved on its own.
const dash = useProviderDashboard()
const { listing, contacts } = dash

const photo = ref<string | null>(null)
const gallery = ref<string[]>([])
const address = ref('')
const startedYear = ref('')
const phone = ref('')
const whatsapp = ref('')
const email = ref('')
const history = ref<CareMilestone[]>([])
watch([listing, contacts], ([l, c]) => {
  if (!l) return
  photo.value = l.photoPath ?? null
  gallery.value = [...(l.galleryPaths ?? [])]
  address.value = l.address ?? ''
  startedYear.value = l.startedYear ? String(l.startedYear) : ''
  history.value = (l.history ?? []).map(h => ({ ...h }))
  phone.value = c.phone
  whatsapp.value = c.whatsapp
  email.value = c.email
}, { immediate: true })

// Photos save the moment they're chosen or removed, so they're never lost by forgetting to press Save
const photoNote = ref('')
async function savePhotos(next: { photo?: string | null, gallery?: string[] }) {
  if (next.photo !== undefined) photo.value = next.photo
  if (next.gallery) gallery.value = next.gallery
  photoNote.value = 'Saving…'
  const error = await dash.savePhotos(photo.value, gallery.value)
  photoNote.value = error ?? 'Saved. Buyers see it on your page now.'
  if (error) useNotify().failed(error)
}

const thisYear = new Date().getFullYear()
const yearOptions = Array.from({ length: 50 }, (_, i) => String(thisYear - i)).map(y => ({ value: y, label: y }))
const addMilestone = () => { if (history.value.length < 8) history.value = [...history.value, { year: '', text: '' }] }
const removeMilestone = (i: number) => { history.value = history.value.filter((_, j) => j !== i) }

const busy = ref(false)
const error = ref('')
async function save() {
  error.value = ''
  if (email.value.trim() && !/^\S+@\S+\.\S+$/.test(email.value.trim())) return (error.value = 'Check the email address.')
  if ([phone.value, whatsapp.value].some(n => n.trim() && n.replace(/[^\d]/g, '').length < 7)) return (error.value = 'Check the phone numbers.')
  busy.value = true
  error.value = (await dash.saveDetails({
    photo: photo.value,
    gallery: gallery.value,
    address: address.value,
    startedYear: startedYear.value ? Number(startedYear.value) : null,
    history: history.value.filter(h => h.text.trim()),
    phone: phone.value,
    whatsapp: whatsapp.value,
    email: email.value,
  })) ?? ''
  busy.value = false
  if (!error.value) useNotify().success({ kicker: 'Your listing', meta: 'Saved', title: 'Photos and details saved', text: 'Buyers see them on your page now.' })
}
const field = 'h-11 border-line-strong bg-surface'
const section = 'flex flex-col gap-5 rounded-xl bg-surface p-4 ring-1 ring-line sm:p-5'
const heading = 'm-0 font-display text-lg font-extrabold font-stretch-expanded'
</script>

<template>
  <form v-if="listing" class="flex flex-col gap-6" novalidate @submit.prevent="save">
    <section :class="section">
      <div class="flex flex-col gap-1">
        <h2 :class="heading">Photos</h2>
        <p class="m-0 text-[13px] leading-5 text-ink-muted">Professional photos build trust: you at work, your clinic, yard or workshop. Clear, well lit, no filters. JPG, PNG or WebP, up to 5 MB each. Photos save as soon as you add or remove them.</p>
      </div>
      <PhotoPicker :path="photo" :upload="dash.uploadPhoto" :preview="listing.photo" label="Profile photo" optional removable shape="round" note="You, or your logo. Shown beside your name." @update:path="p => savePhotos({ photo: p })" />
      <PhotoGrid :paths="gallery" :upload="dash.uploadPhoto" :url-of="dash.mediaUrl" label="Your workplace and work" optional hint="The premises, equipment, kennels you've built, dogs you've trained. You can pick several at once." @update:paths="g => savePhotos({ gallery: g })" />
      <p v-if="photoNote" class="m-0 text-[13px] font-semibold" :class="photoNote.startsWith('Saved') ? 'text-verified' : photoNote === 'Saving…' ? 'text-ink-muted' : 'text-danger'" role="status">{{ photoNote }}</p>
    </section>

    <section :class="section">
      <div class="flex flex-col gap-1">
        <h2 :class="heading">Contact and workplace</h2>
        <p class="m-0 text-[13px] leading-5 text-ink-muted">The address shows to everyone. The phone, WhatsApp and email show only to people signed in to Dogeash, so they aren't collected by bots.</p>
      </div>
      <FieldShell label="Workplace address" for="pd-address" optional hint="Where buyers come for appointments at your premises.">
        <Input id="pd-address" v-model="address" maxlength="200" placeholder="Plot 12, Gado Nasko Road, Kubwa, Abuja" :class="field" />
      </FieldShell>
      <div class="grid gap-5 sm:grid-cols-3">
        <FieldShell label="Phone" for="pd-phone" optional>
          <Input id="pd-phone" v-model="phone" type="tel" inputmode="tel" maxlength="30" placeholder="0803 000 0000" :class="field" />
        </FieldShell>
        <FieldShell label="WhatsApp" for="pd-whatsapp" optional>
          <Input id="pd-whatsapp" v-model="whatsapp" type="tel" inputmode="tel" maxlength="30" placeholder="0803 000 0000" :class="field" />
        </FieldShell>
        <FieldShell label="Email" for="pd-email" optional>
          <Input id="pd-email" v-model="email" type="email" maxlength="120" placeholder="clinic@example.com" :class="field" />
        </FieldShell>
      </div>
    </section>

    <section :class="section">
      <div class="flex flex-col gap-1">
        <h2 :class="heading">Your history</h2>
        <p class="m-0 text-[13px] leading-5 text-ink-muted">When you started and the milestones buyers should know: qualifications, the clinic opening, big clients. Up to 8.</p>
      </div>
      <FieldShell label="Working with dogs since" for="pd-started" optional>
        <SelectMenu id="pd-started" v-model="startedYear" :options="yearOptions" placeholder="Choose a year" class="h-11! sm:w-[220px]" />
      </FieldShell>
      <ol class="m-0 flex list-none flex-col gap-3 p-0">
        <li v-for="(h, i) in history" :key="i" class="grid grid-cols-[88px_minmax(0,1fr)_auto] items-start gap-2">
          <Input v-model="h.year" maxlength="9" placeholder="2019" :aria-label="`Milestone ${i + 1} year`" :class="[field, 'font-mono']" />
          <Input v-model="h.text" maxlength="200" placeholder="Qualified as a vet, University of Abuja" :aria-label="`Milestone ${i + 1}`" :class="field" />
          <Button type="button" variant="ghost" size="icon" class="size-11" :aria-label="`Remove milestone ${i + 1}`" @click="removeMilestone(i)"><Trash2 aria-hidden="true" /></Button>
        </li>
      </ol>
      <div v-if="history.length < 8"><Button type="button" variant="outline" size="sm" @click="addMilestone"><Plus aria-hidden="true" />Add a milestone</Button></div>
    </section>

    <p v-if="error" class="m-0 font-semibold text-danger" role="alert">{{ error }}</p>
    <div><Button type="submit" variant="marigold" class="h-11" :loading="busy">Save photos and details</Button></div>
  </form>
</template>
