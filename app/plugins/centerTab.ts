import type { Directive } from 'vue'

// v-center-tab on a row of tabs that scrolls sideways: the clicked tab slides to the row's centre,
// and a tab already selected on load starts in view. Only the row moves, never the page.
// Rows that all fit (no overflow) stay still.
const SELECTED = '[aria-current="page"], [aria-current="true"], [aria-pressed="true"], [aria-selected="true"], [data-state="on"], .router-link-exact-active'

function center(row: HTMLElement, tab: Element, smooth: boolean) {
  const rowBox = row.getBoundingClientRect()
  const tabBox = tab.getBoundingClientRect()
  const left = row.scrollLeft + tabBox.left - rowBox.left - (row.clientWidth - tabBox.width) / 2
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  row.scrollTo({ left, behavior: smooth && !reduced ? 'smooth' : 'auto' })
}

const handlers = new WeakMap<HTMLElement, (e: Event) => void>()

const centerTab: Directive<HTMLElement> = {
  mounted(row) {
    const onClick = (e: Event) => {
      let tab = e.target as HTMLElement | null
      while (tab && tab.parentElement !== row) tab = tab.parentElement
      if (tab) center(row, tab, true)
    }
    handlers.set(row, onClick)
    row.addEventListener('click', onClick)
    const selected = row.querySelector(SELECTED)
    if (selected) center(row, selected, false)
  },
  beforeUnmount(row) {
    const onClick = handlers.get(row)
    if (onClick) row.removeEventListener('click', onClick)
  },
}

export default defineNuxtPlugin((nuxtApp) => {
  nuxtApp.vueApp.directive('center-tab', centerTab)
})

declare module 'vue' {
  interface GlobalDirectives {
    vCenterTab: typeof centerTab
  }
}
