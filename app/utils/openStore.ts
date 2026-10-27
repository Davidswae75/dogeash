import type { IconName } from '~/components/AppIcon.vue'
import type { HowItWorksStep } from '~/components/HowItWorks.vue'

// The Open a store page: why kennels open a store on Dogeash, how verification works, what to have ready, and questions.
// Fees aren't decided yet (PLAN.md Open decisions), so nothing here quotes one.

export const openStoreFacts = [
  { value: '0', label: 'Listings go public before your kennel has been inspected' },
  { value: '5', label: 'Protection levels, so buyers know exactly what they are getting' },
  { value: '1', label: 'Dashboard for your dogs, enquiries, kennel visits and payouts' },
]

export const openStoreReasons: { icon: IconName, title: string, text: string }[] = [
  { icon: 'watchful-eye', title: 'Buyers who are ready', text: 'They shortlist, compare and book a kennel visit before they call you. Fewer time-wasters at the gate.' },
  { icon: 'shield-paw', title: 'The Verified stamp', text: 'Your inspection record sits on every listing. Good kennels stop competing with backyard breeders on price alone.' },
  { icon: 'heart-paw', title: 'A K9 file for every dog', text: 'Health, hips, training and temperament in one format buyers trust, so you answer the same questions once.' },
  { icon: 'family', title: 'Your vets and trainers, credited', text: 'Link the care team you work with. Buyers book them after handover, and your store gets the credit.' },
]

export const storeVerificationSteps: HowItWorksStep[] = [
  { title: 'Apply', text: 'Tell us about your kennel and upload the owner\'s ID, CAC registration and a bank account for payouts.' },
  { title: 'Inspection visit', text: 'An inspector visits your kennel, meets the dogs, checks health and training records and confirms each dog\'s level.' },
  { title: 'Go live', text: 'Your store and listings go public with the Verified stamp. Enquiries and visit requests arrive in your dashboard.' },
  { title: 'Stay verified', text: 'A yearly re-inspection and reviews from buyers after handover keep the stamp current.' },
]

export const openStoreRequirements = [
  'Government ID for the kennel owner',
  'CAC business registration',
  'A Nigerian bank account in the business or owner\'s name',
  'Your kennel\'s address, open for an inspection visit',
  'Vaccination and vet records for each dog',
  'Training records or titles, where the dog has them',
]

export const openStoreQuestions = [
  { q: 'What does it cost to have a store on Dogeash?', a: 'Applying and the inspection are free while we\'re in beta. Store fees will be published here before launch, and nothing is charged without your agreement.' },
  { q: 'How long does verification take?', a: 'Once your documents are in, we agree an inspection date with you. You can set up your store and add dogs while you wait; nothing goes public until the inspection passes.' },
  { q: 'Can my store list puppies or stud services?', a: 'Not yet. Dogeash starts with trained adult dogs. Litters and stud listings are planned for later.' },
  { q: 'We only have a few dogs at a time. Can we still open a store?', a: 'Yes, as long as every dog is kept and trained to the same standard and you\'re happy to have the kennel inspected.' },
  { q: 'Who sees my bank and ID details?', a: 'Only the Dogeash verification team. Buyers see your store, your inspection record and your dogs, never your documents.' },
]
