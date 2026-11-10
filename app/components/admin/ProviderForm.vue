<script setup lang="ts">
import { toTypedSchema } from '@vee-validate/zod'
import { useForm } from 'vee-validate'
import { computed, ref, watch } from 'vue'
import { z } from 'zod'
import type { FieldConfig } from '~/components/Fields.vue'
import type { InviteResult, ProviderDraft } from '~/composables/useAdminCare'
import type { CareProvider, CareType } from '~/utils/care'
import { useNotify } from '~/composables/useNotify'
import { careTypes } from '~/utils/care'

const typeOptions = (Object.keys(careTypes) as CareType[]).map(k => ({ value: k, label: careTypes[k].label }))

// Add or edit a care provider: the business's details, who manages it (invited by email, one or more), and
// whether it's listed for buyers yet. `save` saves, invites and emails; it returns an error, or each invitation's
// result. If an email couldn't be sent, the form stays open and says why. `resend` emails a waiting invitation again.
const props = defineProps<{
  provider?: CareProvider
  managers?: { members: { name: string, email: string }[], invites: { id: string, email: string }[] }
  save: (p: ProviderDraft, emails: string[]) => Promise<{ error: string | null, invites: InviteResult[] }>
  resend?: (email: string) => Promise<InviteResult[]>
}>()
const open = defineModel<boolean>('open', { default: false })

const schema = z.object({
  name: z.string().trim().min(2, 'Give the provider a name').max(80),
  person: z.string().trim().max(80).default(''),
  type: z.enum(Object.keys(careTypes) as [CareType, ...CareType[]], { message: 'Choose what they do' }),
  city: z.string().trim().min(2, 'Which city?').max(60),
  areas: z.string().trim().max(120).default(''),
  credential: z.string().trim().max(120).default(''),
  priceFrom: z.coerce.number({ message: 'Price in naira, like 15000' }).int().min(0).max(100_000_000),
  homeVisits: z.boolean(),
  verified: z.boolean(),
  listed: z.boolean(),
})
type Values = z.infer<typeof schema>
const blank = (): Partial<Values> => ({ name: '', person: '', type: 'vet', city: '', areas: '', credential: '', priceFrom: 0, homeVisits: false, verified: false, listed: true })
const fromProvider = (p: CareProvider): Values => ({ name: p.name, person: p.person ?? '', type: p.type, city: p.city, areas: p.areas, credential: p.credential, priceFrom: p.priceFrom, homeVisits: p.homeVisits, verified: p.verified, listed: p.listed !== false })

const { handleSubmit, defineField, errors, resetForm } = useForm<Values>({ validationSchema: toTypedSchema(schema) })
const [type] = defineField('type')
const [homeVisits] = defineField('homeVisits')
const [verified] = defineField('verified')
const [listed] = defineField('listed')
watch(open, (o) => {
  if (!o) return
  resetForm({ values: props.provider ? fromProvider(props.provider) : blank() })
  error.value = ''
  emails.value = []
  emailError.value = ''
  results.value = []
})

// Who manages it: emails typed in (Enter or comma after each), checked as they're added
const emails = ref<string[]>([])
const emailError = ref('')
const isEmail = (e: string) => /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e)
// (Taking a bad one out changes the list again; that change mustn't clear the message about it)
let tidying = false
watch(emails, (list) => {
  if (tidying) return void (tidying = false)
  const clean = [...new Set(list.map(e => e.trim().toLowerCase()).filter(Boolean))]
  const bad = clean.filter(e => !isEmail(e))
  emailError.value = bad.length ? `${bad.join(', ')} ${bad.length === 1 ? 'isn\'t an email' : 'aren\'t emails'}` : ''
  const good = clean.filter(isEmail)
  if (good.join() !== list.join()) {
    tidying = true
    emails.value = good
  }
})
const already = computed(() => [...(props.managers?.members ?? []).map(m => m.email), ...(props.managers?.invites ?? []).map(i => i.email)].map(e => e.toLowerCase()))

// After saving: each invitation's result, kept on screen when an email didn't go out
const results = ref<InviteResult[]>([])
const failed = computed(() => results.value.filter(r => !r.invited || !r.emailed))
const resending = ref('')
async function resendTo(email: string) {
  if (!props.resend) return
  resending.value = email
  const r = await props.resend(email)
  resending.value = ''
  results.value = [...results.value.filter(x => x.email !== email), ...r]
  // Say how it went, either way
  const sent = r.find(x => x.email === email)
  if (sent?.emailed) useNotify().adminDone('Invitation emailed', `${email} has a fresh link to sign up (or sign in) and accept.`)
  else useNotify().failed(`The email to ${email} wasn't sent${sent?.error ? `: ${sent.error}` : ''}. The invitation still waits in their account.`)
}

const input = (name: keyof Values, label: string, placeholder: string, extra: Partial<FieldConfig> = {}): FieldConfig =>
  ({ fieldType: 'input', name, label, attrs: { placeholder, ...extra.attrs }, ...extra } as FieldConfig)
const fields = {
  who: [input('name', 'Name', 'Kuje Veterinary Clinic'), input('person', 'Person', 'Dr. Halima Sani', { hint: 'Who buyers will deal with.', optional: true })],
  where: [input('city', 'City', 'Abuja'), input('areas', 'Areas covered', 'Abuja and environs', { optional: true })],
  more: [input('credential', 'Credential', 'VCN registered veterinary surgeon', { optional: true }), input('priceFrom', 'Price from', '15,000', { prefix: '₦', money: true, attrs: { inputmode: 'numeric' } })],
}

const busy = ref(false)
const error = ref('')
// A bad email is never kept in the list, so its message is advice, not a reason to stop saving
const submit = handleSubmit(async (v) => {
  busy.value = true
  const out = await props.save({ ...v, id: props.provider?.id }, emails.value.filter(e => !already.value.includes(e)))
  busy.value = false
  error.value = out.error ?? ''
  if (error.value) return
  results.value = out.invites
  emails.value = []
  if (!failed.value.length) open.value = false
})
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="max-h-[92dvh] overflow-y-auto sm:max-w-[560px]">
      <DialogHeader>
        <DialogTitle>{{ props.provider ? `Edit ${props.provider.name}` : 'Add a care provider' }}</DialogTitle>
        <DialogDescription>The business's details, who manages it, and whether buyers can see it yet. Listed providers show in the care directory, and stores can add them to their care team.</DialogDescription>
      </DialogHeader>
      <form class="flex flex-col gap-5" novalidate @submit.prevent="submit">
        <div class="grid gap-5 sm:grid-cols-2"><Fields :fields="fields.who.slice(0, 1)" /><Fields :fields="fields.who.slice(1)" /></div>
        <FieldShell label="What they do" for="provider-type" :error="errors.type">
          <SelectMenu id="provider-type" v-model="type" :options="typeOptions" placeholder="Choose what they do" class="h-11!" />
        </FieldShell>
        <div class="grid gap-5 sm:grid-cols-2"><Fields :fields="fields.where.slice(0, 1)" /><Fields :fields="fields.where.slice(1)" /></div>
        <div class="grid gap-5 sm:grid-cols-2"><Fields :fields="fields.more.slice(0, 1)" /><Fields :fields="fields.more.slice(1)" /></div>
        <label class="flex items-center gap-3 text-sm"><Switch v-model="homeVisits" />Visits clients at home</label>
        <label class="flex items-center gap-3 text-sm"><Switch v-model="verified" />Checked by Dogeash <span class="text-ink-muted">(shows the "verified" badge)</span></label>

        <FieldShell label="Who manages it" for="provider-emails" optional hint="Their emails, one or more. Press Enter after each. They get an email with a link to sign up (or sign in) and take over bookings and the listing's details.">
          <TagsInput id="provider-emails" v-model="emails" :add-on-blur="true" :add-on-paste="true" :delimiter="/[,;\s]+/" class="min-h-11 border-line-strong bg-surface">
            <TagsInputItem v-for="e in emails" :key="e" :value="e">
              <TagsInputItemText />
              <TagsInputItemDelete />
            </TagsInputItem>
            <TagsInputInput :placeholder="emails.length ? 'Add another email' : 'Add an email, like halima@kujevets.ng'" />
          </TagsInput>
          <p v-if="emailError" class="m-0 text-sm font-semibold text-danger" role="alert">{{ emailError }}</p>
        </FieldShell>
        <ul v-if="props.managers && (props.managers.members.length || props.managers.invites.length)" class="m-0 -mt-2 flex list-none flex-col gap-1.5 p-0 text-[13px]">
          <li v-for="m in props.managers.members" :key="m.email" class="flex items-center gap-2"><span class="size-1.5 rounded-full bg-marigold" aria-hidden="true" />{{ m.name }} <span class="text-ink-muted">· manages it</span></li>
          <li v-for="i in props.managers.invites" :key="i.id" class="flex flex-wrap items-center gap-2">
            <span class="size-1.5 rounded-full bg-line-strong" aria-hidden="true" />{{ i.email }} <span class="text-ink-muted">· invited, not accepted yet</span>
            <Button v-if="props.resend" type="button" variant="link" size="sm" class="h-auto p-0 text-[13px]" :loading="resending === i.email" @click="resendTo(i.email)">Email it again</Button>
          </li>
        </ul>

        <label class="flex items-start gap-3 rounded-lg bg-surface-sunk p-3 text-sm">
          <Switch v-model="listed" class="mt-0.5" />
          <span><strong>{{ listed ? 'Listed: buyers can find and book it' : 'Hidden: only Dogeash and its managers see it' }}</strong>
            <span class="block text-[13px] text-ink-muted">Keep it hidden while the managers set it up, then list it.</span></span>
        </label>

        <div v-if="failed.length" class="flex flex-col gap-1.5 rounded-lg p-3 text-sm ring-1 ring-danger/40" role="alert">
          <strong>Saved, but {{ failed.length === 1 ? 'one invitation needs' : `${failed.length} invitations need` }} a look:</strong>
          <span v-for="f in failed" :key="f.email" class="flex flex-wrap items-center gap-2">
            {{ f.email }}: <span class="text-ink-muted">{{ !f.invited ? f.error : `invited, but the email wasn't sent (${f.error ?? 'unknown reason'})` }}</span>
            <Button v-if="f.invited && props.resend" type="button" variant="link" size="sm" class="h-auto p-0" :loading="resending === f.email" @click="resendTo(f.email)">Try again</Button>
          </span>
          <span class="text-[13px] text-ink-muted">The invitation still waits in their account when they sign in or sign up with that email.</span>
        </div>
        <p v-if="error" class="m-0 text-sm font-semibold text-danger" role="alert">{{ error }}</p>
        <DialogFooter>
          <Button type="button" variant="ghost" :disabled="busy" @click="open = false">Cancel</Button>
          <Button v-if="failed.length" type="button" variant="marigold" @click="open = false">Done</Button>
          <Button v-else type="submit" variant="marigold" :loading="busy">{{ props.provider ? 'Save changes' : (listed ? 'Add and list' : 'Add, hidden for now') }}</Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
