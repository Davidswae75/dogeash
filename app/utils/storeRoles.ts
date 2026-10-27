// People who work at a store, and what each role may do in the store dashboard.
// One account can buy on Dogeash and also belong to one or more stores (PLAN.md Phase 5a).

export type StoreRole = 'owner' | 'manager' | 'handler'
export type StorePermission = 'dogs' | 'enquiries' | 'bookings' | 'care' | 'profile' | 'payouts' | 'team' | 'settings'

export interface StoreMembership { storeId: string, role: StoreRole }

export const storeRoles: Record<StoreRole, { label: string, can: StorePermission[] }> = {
  owner: { label: 'Owner', can: ['dogs', 'enquiries', 'bookings', 'care', 'profile', 'payouts', 'team', 'settings'] },
  manager: { label: 'Manager', can: ['dogs', 'enquiries', 'bookings', 'care', 'profile'] },
  handler: { label: 'Handler', can: ['dogs', 'bookings'] },
}

export const roleCan = (role: StoreRole, permission: StorePermission) => storeRoles[role].can.includes(permission)

// What's waiting at each store, shown to its members while they browse (example figures)
export const storeActivity: Record<string, { enquiries: number, visitsToday: number }> = {
  'STR-001': { enquiries: 3, visitsToday: 1 },
}

export function storeActivityLine(storeId: string) {
  const a = storeActivity[storeId]
  if (!a) return 'Nothing waiting'
  const parts = [
    a.enquiries ? `${a.enquiries} new ${a.enquiries === 1 ? 'enquiry' : 'enquiries'}` : '',
    a.visitsToday ? `${a.visitsToday} ${a.visitsToday === 1 ? 'visit' : 'visits'} today` : '',
  ].filter(Boolean)
  return parts.length ? parts.join(' · ') : 'Nothing waiting'
}
