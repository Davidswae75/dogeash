// Smooth scrolling that respects reduced motion
export const scrollBehavior = (smooth = true): ScrollBehavior =>
  smooth && !window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'smooth' : 'auto'

// Slide a tab to the centre of its sideways row. Only the row moves, never the page.
export function centerInRow(row: HTMLElement, tab: Element, smooth = true) {
  const rowBox = row.getBoundingClientRect()
  const tabBox = tab.getBoundingClientRect()
  const left = row.scrollLeft + tabBox.left - rowBox.left - (row.clientWidth - tabBox.width) / 2
  row.scrollTo({ left, behavior: scrollBehavior(smooth) })
}

// Smooth-scroll to a section on this page and keep the address shareable. Focus moves there too,
// so the next Tab press carries on from the section, as it does with a normal # link.
export function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (!el) return false
  el.scrollIntoView({ behavior: scrollBehavior() })
  if (!el.hasAttribute('tabindex')) el.setAttribute('tabindex', '-1')
  el.focus({ preventScroll: true })
  history.replaceState(history.state, '', `#${id}`)
  return true
}
