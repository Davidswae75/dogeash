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
