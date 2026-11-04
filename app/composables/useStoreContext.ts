import { computed } from 'vue'
import { useState, useSupabaseClient } from '#imports'
import { useSession } from './useSession'
import { roleCan, storeRoles } from '~/utils/storeRoles'
import type { StorePermission } from '~/utils/storeRoles'
import { listedStores } from '~/utils/stores'

// The store the dashboard is showing, and what the signed-in person may do there.
// For now that's their first store; a switcher for people with several comes later.
export function useStoreContext() {
  const { memberships } = useSession()
  const membership = computed(() => memberships.value[0])
  const store = computed(() => membership.value?.store ?? listedStores.value[0]!)
  const role = computed(() => membership.value?.role ?? 'owner')
  const can = (permission: StorePermission) => roleCan(role.value, permission)

  // The store's database id (uuid), for writes and team lookups; the app otherwise uses ids like STR-001
  const supabase = useSupabaseClient()
  const uuids = useState<Record<string, string>>('store-uuids', () => ({}))
  async function storeUuid() {
    const publicId = membership.value?.store.id
    if (!publicId) return null
    if (!uuids.value[publicId]) {
      const { data } = await supabase.from('stores').select('id').eq('public_id', publicId).maybeSingle()
      if (data) uuids.value = { ...uuids.value, [publicId]: data.id }
    }
    return uuids.value[publicId] ?? null
  }

  return { membership, store, role, roleLabel: computed(() => storeRoles[role.value].label), can, storeUuid }
}
