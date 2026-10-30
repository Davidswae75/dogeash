import { createGlobalState } from '@vueuse/core'

// The gear cart, kept per person like the shortlist. Entries are stored as `productId~size:quantity`,
// so a guest's cart merges into their account on sign-in and matching lines add up.
export const useCart = createGlobalState(() => {
  const entries = useAccountList('cart')

  const quantities = computed(() => {
    const map = new Map<string, number>()
    for (const entry of entries.value) {
      const [key = '', qty] = entry.split(':')
      map.set(key, Math.min((map.get(key) ?? 0) + Number(qty), GEAR_MAX_QUANTITY))
    }
    return map
  })

  const save = (map: Map<string, number>) => {
    entries.value = [...map].map(([key, qty]) => `${key}:${qty}`)
  }

  const lines = computed(() => [...quantities.value].flatMap(([key, quantity]) => {
    const [id = '', size] = key.split('~')
    const product = findGear(id)
    return product ? [{ key, product, size: size || undefined, quantity, total: product.priceNaira * quantity }] : []
  }))

  const count = computed(() => lines.value.reduce((sum, l) => sum + l.quantity, 0))
  const subtotal = computed(() => lines.value.reduce((sum, l) => sum + l.total, 0))
  const delivery = computed(() => (subtotal.value >= GEAR_FREE_DELIVERY_FROM ? 0 : GEAR_DELIVERY_FEE))
  const total = computed(() => subtotal.value + delivery.value)

  function add(id: string, size?: string) {
    const key = `${id}~${size ?? ''}`
    save(new Map(quantities.value).set(key, Math.min((quantities.value.get(key) ?? 0) + 1, GEAR_MAX_QUANTITY)))
  }

  function setQuantity(key: string, quantity: number) {
    save(new Map(quantities.value).set(key, Math.min(Math.max(quantity, 1), GEAR_MAX_QUANTITY)))
  }

  // Returns an undo that puts the line back
  function remove(key: string) {
    const before = entries.value
    const next = new Map(quantities.value)
    next.delete(key)
    save(next)
    return () => { entries.value = before }
  }

  return { lines, count, subtotal, delivery, total, add, setQuantity, remove }
})
