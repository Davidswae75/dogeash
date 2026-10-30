import { useLocalStorage } from '@vueuse/core'
import type { RemovableRef } from '@vueuse/core'

// Lists (dog file numbers, gear cart lines) kept in this browser per person: one for the guest, one per account.
// Stored as { guest: [...], 'BYR-0417': [...] } under `dogeash-<name>`; older plain arrays count as the guest's.
// When accounts are connected these move to the server; the shape of the API stays the same.
export type AccountListName = 'shortlist' | 'compare' | 'recently-viewed' | 'cart'

const GUEST = 'guest'
const LIMITS: Partial<Record<AccountListName, number>> = { 'compare': COMPARE_MAX, 'recently-viewed': 12 }

type Owners = Record<string, string[]>
const stores = new Map<AccountListName, RemovableRef<Owners | string[]>>()

function storeFor(name: AccountListName) {
  if (!stores.has(name)) stores.set(name, useLocalStorage<Owners | string[]>(`dogeash-${name}`, {}))
  return stores.get(name)!
}

function owners(name: AccountListName): Owners {
  const value = storeFor(name).value
  return Array.isArray(value) ? { [GUEST]: value } : value
}

function write(name: AccountListName, owner: string, list: string[]) {
  const limit = LIMITS[name]
  storeFor(name).value = { ...owners(name), [owner]: limit ? list.slice(0, limit) : list }
}

// The current person's list as a writable ref
export function useAccountList(name: AccountListName) {
  const { user } = useSession()
  const owner = computed(() => user.value?.id ?? GUEST)
  return computed<string[]>({
    get: () => owners(name)[owner.value] ?? [],
    set: list => write(name, owner.value, list),
  })
}

// On sign-in: put the guest's items in front of the account's own, drop duplicates, clear the guest.
// Returns how many shortlisted dogs were new to the account.
export function mergeGuestLists(accountId: string) {
  let movedToShortlist = 0
  for (const name of ['shortlist', 'compare', 'recently-viewed', 'cart'] as const) {
    const all = owners(name)
    const guest = all[GUEST] ?? []
    if (!guest.length) continue
    const mine = all[accountId] ?? []
    if (name === 'shortlist') movedToShortlist = guest.filter(f => !mine.includes(f)).length
    write(name, accountId, [...new Set([...guest, ...mine])])
    write(name, GUEST, [])
  }
  return movedToShortlist
}
