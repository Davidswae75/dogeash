// The Dogeash protection scale: what a dog will do, in plain words
export type ProtectionLevel = 1 | 2 | 3 | 4 | 5

export const protectionLevels: Record<ProtectionLevel, { name: string, description: string }> = {
  1: { name: 'Alert companion', description: 'Barks at strangers and warns you. A family dog first.' },
  2: { name: 'Deterrent', description: 'A confident, visible presence that discourages intruders. Fully controllable.' },
  3: { name: 'Property guard', description: 'Patrols and holds a perimeter, day or night. Trained to a handler.' },
  4: { name: 'Family protection', description: 'Protects people on command and releases on command. Safe around children.' },
  5: { name: 'Estate and executive', description: 'Titled working dogs for large estates and close protection. Experienced owners.' },
}

export type PropertyType = 'home' | 'compound' | 'estate' | 'business'

export const propertyTypes: { value: PropertyType, label: string, hint: string, levels: ProtectionLevel[] }[] = [
  { value: 'home', label: 'Home', hint: 'Level 1–4 · 1 dog', levels: [1, 2, 3, 4] },
  { value: 'compound', label: 'Compound', hint: 'Level 3–4 · 1–2 dogs', levels: [3, 4] },
  { value: 'estate', label: 'Estate', hint: 'Level 4–5 · 2+ dogs', levels: [4, 5] },
  { value: 'business', label: 'Business', hint: 'Level 3–5 · handler', levels: [3, 4, 5] },
]

// The full picture for each level, for the Protection levels page: what the dog does,
// what it won't do, and what it asks of the owner
export const protectionLevelDetails: Record<ProtectionLevel, { does: string[], doesNot: string[], owner: string }> = {
  1: {
    does: ['Barks when someone comes to the gate', 'Lives with the family indoors', 'Makes a house look watched'],
    doesNot: ['Patrol or hold anyone', 'Stand up to a determined intruder'],
    owner: 'Any household. A good first dog.',
  },
  2: {
    does: ['Looks and sounds serious at the gate', 'Holds back on command, every time', 'Walks calmly in public'],
    doesNot: ['Bite on command', 'Work as a night patrol dog'],
    owner: 'Any household willing to keep up basic obedience.',
  },
  3: {
    does: ['Patrols the compound day or night', 'Holds a perimeter and alerts the handler', 'Works with a named handler or guard'],
    doesNot: ['Protect people on command', 'Mix freely with visitors'],
    owner: 'A handler or gateman who will work with the dog daily.',
  },
  4: {
    does: ['Protects family members on command', 'Releases on command, then settles', 'Lives safely with children'],
    doesNot: ['Act without a command', 'Stay sharp without regular refresher training'],
    owner: 'A committed family, with refresher training two or three times a year.',
  },
  5: {
    does: ['Close protection for people and large estates', 'Titled in recognised working trials', 'Works in teams with professional handlers'],
    doesNot: ['Suit a first-time owner', 'Stay reliable without a trained handler'],
    owner: 'Experienced owners or a security team with a dedicated handler.',
  },
}
