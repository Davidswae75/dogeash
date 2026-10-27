// The store the dashboard is showing, and what the signed-in person may do there.
// For now that's their first store; a switcher for people with several comes later.
export function useStoreContext() {
  const { memberships } = useSession()
  const membership = computed(() => memberships.value[0])
  const store = computed(() => membership.value?.store ?? sampleStores[0]!)
  const role = computed(() => membership.value?.role ?? 'owner')
  const can = (permission: StorePermission) => roleCan(role.value, permission)
  return { membership, store, role, roleLabel: computed(() => storeRoles[role.value].label), can }
}
