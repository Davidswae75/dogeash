import { useLocalStorage } from '@vueuse/core'
import { computed } from 'vue'

// Whether this browser has dismissed a one-time message, e.g. the "New to guard dogs?" intro
export function useFirstVisit(key: string) {
  const dismissed = useLocalStorage(`dogeash-dismissed-${key}`, false)
  return {
    isFirstVisit: computed(() => !dismissed.value),
    dismiss: () => { dismissed.value = true },
  }
}
