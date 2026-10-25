export interface Seller {
  id: string
  name: string
  initials: string
  city: string
  inspected: string
  rating: number
  reviews: number
  dogs: number
  replies: string
  verified: boolean
}

// Example kennels until the seller dashboard and API exist
export const sampleSellers: Seller[] = [
  { id: 'SLR-001', name: 'K9 Guardian Kennels', initials: 'KG', city: 'Abuja', inspected: 'Nov 2025', rating: 4.9, reviews: 84, dogs: 5, replies: '~1 h', verified: true },
  { id: 'SLR-002', name: 'Naija Guard Dogs', initials: 'NG', city: 'Lagos', inspected: 'Feb 2026', rating: 4.8, reviews: 61, dogs: 4, replies: '~2 h', verified: true },
  { id: 'SLR-003', name: 'Niger Delta K9', initials: 'ND', city: 'Port Harcourt', inspected: 'Dec 2025', rating: 4.7, reviews: 38, dogs: 3, replies: '~3 h', verified: true },
  { id: 'SLR-004', name: 'Savanna Working Dogs', initials: 'SW', city: 'Ibadan', inspected: 'Feb 2026', rating: 4.8, reviews: 45, dogs: 3, replies: '~2 h', verified: true },
  { id: 'SLR-005', name: 'Northern Ridge K9', initials: 'NR', city: 'Kano', inspected: 'Oct 2025', rating: 4.6, reviews: 29, dogs: 3, replies: '~4 h', verified: true },
]
