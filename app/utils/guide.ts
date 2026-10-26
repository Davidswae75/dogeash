import type { IconName } from '~/components/AppIcon.vue'
import heroGuardian from '@/assets/dogs/hero-guardian.jpg'
import guideFamily from '@/assets/dogs/guide-family.jpg'
import guideNight from '@/assets/dogs/guide-night.jpg'
import guideVet from '@/assets/dogs/guide-vet.jpg'
import guideFeeding from '@/assets/dogs/guide-feeding.jpg'
import guideTraining from '@/assets/dogs/guide-training.jpg'

// Buyer's guide content: should you keep a guard dog at your home or compound?
// Copy follows the Dogeash voice: direct, factual, no puns, never "attack dog".

export interface GuideImage {
  // Drop the finished file into public/guide/ with this name, then set ready: true
  file: string
  ready: boolean
  ratio: '16/9' | '3/2' | '4/3' | '1/1'
  alt: string
  // What the picture must show, written so it can be pasted into an image generator
  brief: string
}

// Shared direction for every photo on the page
export const guideImageStyle = 'Photographic, natural light, shot at eye level in a real Nigerian home or compound. Calm, alert dogs only: no bared teeth, no lunging, no muzzles. No text, logos or watermarks in the image. Warm but true-to-life colour.'

export const guideImages = {
  hero: {
    file: heroGuardian,
    ready: true,
    ratio: '16/9',
    alt: 'A German Shepherd sits alert inside the open gate of a family compound at dusk',
    brief: 'A black-and-tan German Shepherd sitting upright and alert just inside the open sliding gate of a two-storey duplex compound in Abuja at golden hour. Interlocking-tile driveway, a parked car partly in frame, bougainvillea on the wall. The dog looks toward the street, calm and watchful. Wide shot with space on the left for a headline.',
  },
  family: {
    file: guideFamily,
    ready: true,
    ratio: '4/3',
    alt: 'A Rottweiler lies on a veranda while two children play nearby and a parent watches',
    brief: 'A Rottweiler lying relaxed on a tiled veranda of a Nigerian bungalow in the afternoon, head up. Two children around 7 and 10 play with a ball on the lawn a few metres away; a parent sits on a plastic chair watching. The dog is clearly part of the household, not tied up. Soft afternoon light.',
  },
  night: {
    file: guideNight,
    ready: true,
    ratio: '3/2',
    alt: 'A Belgian Malinois walks the inside of a compound wall at night under a security light',
    brief: 'A Belgian Malinois walking along the inside of a tall painted compound wall at night, lit by a single security floodlight. Razor wire on top of the wall, a generator shed in the background. The dog is mid-stride, ears up, attentive. Moody but not menacing.',
  },
  vet: {
    file: guideVet,
    ready: true,
    ratio: '4/3',
    alt: 'A vet scans a Dobermann for its microchip during a health check',
    brief: 'Inside a clean veterinary clinic in Lagos, a vet in scrubs scans the shoulder of a calm Dobermann with a handheld microchip reader while the owner holds the lead. Vaccination card and stethoscope on the steel table. Bright, clinical light.',
  },
  feeding: {
    file: guideFeeding,
    ready: true,
    ratio: '1/1',
    alt: 'A guard dog eats from a steel bowl inside a shaded kennel run',
    brief: 'A Boerboel eating from a stainless-steel bowl inside a covered, shaded kennel run with a mesh gate, in a compound. A water bucket beside it. The run is clean, with a raised bed. The point of the picture is controlled, secure feeding: only the owner feeds this dog.',
  },
  handover: {
    file: guideTraining,
    ready: true,
    ratio: '3/2',
    alt: 'A trainer shows a family how to give commands to their new guard dog at their gate',
    brief: 'A professional dog trainer in a polo shirt standing in a family compound, showing a man and a woman how to give a hand signal to a sitting German Shepherd. A teenager watches. The family looks focused and confident. Midday, open shade.',
  },
} satisfies Record<string, GuideImage>

export const guideSections = [
  { id: 'short-answer', label: 'The short answer' },
  { id: 'benefits', label: 'What a guard dog does well' },
  { id: 'drawbacks', label: 'What it costs you' },
  { id: 'poisoning', label: 'The poisoning risk' },
  { id: 'compare', label: 'Dog, guard, cameras or fence' },
  { id: 'costs', label: 'First-year costs' },
  { id: 'level', label: 'Which level fits your home' },
  { id: 'ready', label: 'Are you ready?' },
  { id: 'faq', label: 'Questions buyers ask' },
] as const

export const guideSuitsYouIf = [
  'You live in a house or compound with a secure wall or fence',
  'Someone is home most days, or you can pay a handler',
  'You can budget for food, vet care and training every month for 10 years or more',
  'Everyone at home agrees and will follow the commands',
  'You want a deterrent that works in a power cut',
]

export const guideThinkTwiceIf = [
  'You live in a flat or share a yard with other households',
  'You travel often and have no one to care for the dog',
  'Visitors, tenants or staff come and go all day',
  'You want security you can switch off or put away',
  'Money is tight: a dog is a monthly cost, not a one-off purchase',
]

export interface GuidePoint {
  icon: IconName
  title: string
  body: string
  note?: string
}

export const guideBenefits: GuidePoint[] = [
  {
    icon: 'shield-paw',
    title: 'It deters before anything happens',
    body: 'Most break-ins are opportunistic. Interviews with convicted burglars in several countries keep finding the same thing: a barking dog behind the gate is one of the strongest reasons to move on to the next house. A dog that is seen and heard protects you without ever making contact.',
  },
  {
    icon: 'alert-bell',
    title: 'You get the earliest possible warning',
    body: 'A dog hears footsteps on the wall, a car idling outside or a stranger at the gate long before you or a camera would notice. That warning gives you minutes to lock doors, call for help or switch on lights.',
  },
  {
    icon: 'power-out',
    title: 'It works when the power goes out',
    body: 'Electric fences, alarms and CCTV stop when the grid and the inverter run out. A dog does not. For many homes, the hours after a power cut are exactly when intruders try.',
  },
  {
    icon: 'patrol',
    title: 'It covers the whole compound, all night',
    body: 'A camera watches one angle. A guard dog moves, patrols the wall line and goes to wherever the noise is. Level 3 and above dogs are trained to hold a perimeter, not just bark from one spot.',
  },
  {
    icon: 'family',
    title: 'It protects people, not just property',
    body: 'Family protection dogs (level 4) are trained to stand between you and a threat on command and to release on command. A guard on the gate cannot follow your children to the car or into the garden.',
  },
  {
    icon: 'wallet',
    title: 'It can cost less than a guard, over time',
    body: 'A trained dog costs more on day one, but a monthly security guard salary adds up quickly. Over several years, many households spend less on a dog than on staffing the gate, and some keep both.',
  },
  {
    icon: 'watchful-eye',
    title: 'It cannot be bribed or distracted',
    body: 'A well-trained guard dog does not fall asleep on duty, take a phone call or let a stranger in because they claim to know you. It only answers to its handlers.',
  },
  {
    icon: 'heart-paw',
    title: 'It becomes part of the family',
    body: 'Protection breeds are loyal and affectionate with their own people. Many owners say the companionship ends up mattering as much as the security.',
  },
]

export const guideDrawbacks: GuidePoint[] = [
  {
    icon: 'monthly-cost',
    title: 'It is a monthly cost for a decade',
    body: 'The purchase price is only the start. Food, vaccines, tick and worm treatment, vet visits and refresher training continue for the dog\'s whole life, usually 10 to 13 years.',
    note: 'Budget monthly before you buy. Ask the seller what the dog eats now.',
  },
  {
    icon: 'clock',
    title: 'It needs time every single day',
    body: 'A guard dog needs exercise, training drills and contact with its handlers daily. A protection dog left alone in a kennel for weeks loses its training and can become unpredictable.',
    note: 'Agree who in the household is the main handler before the dog arrives.',
  },
  {
    icon: 'scale',
    title: 'You are responsible for what it does',
    body: 'If your dog injures a visitor, a neighbour or even an intruder, you can be held responsible. The higher the protection level, the more control and paperwork you need.',
    note: 'Choose the lowest level that meets your need. Put up a clear "guard dog on duty" sign.',
  },
  {
    icon: 'child',
    title: 'The wrong dog is a risk to children and visitors',
    body: 'A dog matched to the wrong home can be dangerous: too much drive for a busy family, or a nervous temperament around guests. Most problems come from a poor match, not from the breed.',
    note: 'Only buy dogs tested with children if you have them. Read the K9 file\'s temperament notes.',
  },
  {
    icon: 'poison',
    title: 'Intruders may try to poison it',
    body: 'In Nigeria, poisoning the guard dog before a break-in is a known tactic. A dog that eats anything thrown over the wall is a weak point.',
    note: 'See the poisoning section below. Food-refusal training is essential.',
  },
  {
    icon: 'heat',
    title: 'Heat, ticks and disease are real threats',
    body: 'Large protection breeds suffer in heat. Tick fever, parvovirus and rabies are common risks if vaccinations and tick control slip.',
    note: 'Provide shade, ventilation and water all day. Keep vaccinations on schedule.',
  },
  {
    icon: 'noise',
    title: 'Neighbours will hear it',
    body: 'A guard dog barks at what it hears. In a quiet estate or a close compound, constant barking can cause friction with neighbours and estate management.',
    note: 'Training can teach a dog to bark, then settle on command.',
  },
  {
    icon: 'travel',
    title: 'Travel gets harder',
    body: 'Holidays and long trips need a plan. Not every kennel will board a protection-trained dog, and not every friend can handle one.',
    note: 'Ask your seller about boarding before you buy. Some kennels take back their own dogs.',
  },
]

export const guidePoisoningSteps = [
  { title: 'Train food refusal', body: 'The dog should refuse food from anyone except its handlers, and ignore anything thrown over the wall. Ask the seller to show you this, not just describe it.' },
  { title: 'Feed at set times, in one place', body: 'Feed in the kennel run or a fixed bowl, never scattered on the ground. A dog that expects food in one place is less tempted elsewhere.' },
  { title: 'Check the wall line every morning', body: 'Walk the perimeter and remove anything thrown in overnight: meat, bread, sweets, bones.' },
  { title: 'Know the signs and your nearest vet', body: 'Vomiting, shaking, drooling, collapse or bleeding gums need a vet immediately. Save an emergency vet number before the dog arrives.' },
]

export type GuideRating = 'yes' | 'partly' | 'no'

export const guideComparisonOptions = ['Guard dog', 'Security guard', 'CCTV and alarm', 'Electric fence'] as const

export const guideComparison: { label: string, values: [GuideRating, GuideRating, GuideRating, GuideRating], note?: string }[] = [
  { label: 'Deters intruders', values: ['yes', 'yes', 'partly', 'yes'] },
  { label: 'Warns you early', values: ['yes', 'partly', 'partly', 'no'] },
  { label: 'Responds physically', values: ['yes', 'yes', 'no', 'no'] },
  { label: 'Works in a power cut', values: ['yes', 'yes', 'partly', 'no'], note: 'CCTV and alarms run only as long as the inverter lasts' },
  { label: 'Records evidence', values: ['no', 'no', 'yes', 'no'] },
  { label: 'Cannot be bribed', values: ['yes', 'no', 'yes', 'yes'] },
  { label: 'Moves around the compound', values: ['yes', 'partly', 'no', 'no'] },
  { label: 'Low daily effort', values: ['no', 'yes', 'yes', 'yes'] },
]

// Example figures for the design. Replace with figures confirmed by Dogeash kennels and vets.
export const guideFirstYearCosts = [
  { label: 'Buying the dog', low: 650_000, high: 4_500_000, note: 'Puppy to titled adult' },
  { label: 'Food', low: 600_000, high: 1_400_000, note: 'Quality dry food for a large breed' },
  { label: 'Vet, vaccines, tick and worm control', low: 150_000, high: 400_000, note: 'More in the first year' },
  { label: 'Kennel run, bedding and gear', low: 200_000, high: 700_000, note: 'Mostly a one-off' },
  { label: 'Refresher training', low: 100_000, high: 500_000, note: 'Every few months' },
]

export const guideLevels = [
  { home: 'Flat or shared compound', household: 'Any', level: 1, note: 'Consider whether a guard dog suits you at all' },
  { home: 'House with a wall', household: 'Young children', level: 2, note: 'A deterrent that is easy to control' },
  { home: 'House or compound', household: 'Older children, adults', level: 3, note: 'A dog that patrols and holds the perimeter' },
  { home: 'Compound', household: 'Family wanting personal protection', level: 4, note: 'Protects people on command' },
  { home: 'Estate or business', household: 'Experienced handler on site', level: 5, note: 'Titled working dogs only' },
] as const

export const guideReadiness = [
  'My home has a secure wall or fence with a gate that closes',
  'There is shade and space for a kennel run',
  'Someone will be home, or a handler will be on site, most days',
  'I can afford food and vet care every month for 10+ years',
  'Everyone at home wants the dog and will learn the commands',
  'I have a vet within 30 minutes of home',
  'I can spend at least an hour a day on exercise and training',
  'I have a plan for when I travel',
  'Visitors and staff can be kept away from the dog when needed',
  'I will put up a clear guard dog sign at the gate',
]

export const guideFaqs = [
  {
    q: 'Will a guard dog be safe with my children?',
    a: 'It can be, if it is the right dog. Choose a dog whose K9 file says it was raised with or tested around children, and start at level 2 or 3. Supervise children with any dog, and teach them never to play-fight with it.',
  },
  {
    q: 'Should I buy a puppy or a trained adult?',
    a: 'A trained adult gives you protection from the day it arrives and you can see its temperament now. A puppy costs less and grows up with your family, but takes 18 to 24 months of training before it protects reliably.',
  },
  {
    q: 'Male or female?',
    a: 'Both make excellent guard dogs. Males are often larger and more territorial; females are often quicker to train and easier with families. The individual dog matters more than its sex.',
  },
  {
    q: 'Should I keep my guard dog chained?',
    a: 'No. Dogs kept on a chain all day become frustrated and unpredictable, and a chained dog cannot patrol. Use a secure kennel run during the day and let the dog move freely inside the compound at night.',
  },
  {
    q: 'Can one dog protect a large compound?',
    a: 'One dog can cover a typical family compound. Large estates and businesses often need two dogs, or a dog with a handler, so the whole perimeter is covered.',
  },
  {
    q: 'What happens if my dog bites someone?',
    a: 'You can be held responsible for harm your dog causes, including to intruders in some circumstances. Keep the dog\'s training records, display a warning sign, keep visitors away from the dog, and take legal advice if an incident happens.',
  },
  {
    q: 'How long will a guard dog work?',
    a: 'Most protection dogs work well until about 8 or 9 years old and live 10 to 13 years. Plan for the dog\'s retirement as a family companion.',
  },
  {
    q: 'Can I see the dog work before I buy?',
    a: 'Yes. Every Dogeash listing for an adult dog includes videos of obedience and protection work, and you can book a visit to see the dog with its trainer.',
  },
]

export function formatNairaRange(low: number, high: number) {
  const f = (v: number) => v >= 1_000_000 ? `₦${(v / 1_000_000).toFixed(1).replace(/\.0$/, '')}m` : `₦${Math.round(v / 1000)}k`
  return `${f(low)} – ${f(high)}`
}
