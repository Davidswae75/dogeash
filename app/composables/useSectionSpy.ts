// Which section of a long page is in view, for tabs and contents lists, plus going to one smoothly.
// In view means the last section whose top has passed `line` (just below the sticky header); at the
// bottom of the page it's the last section, because short ones there can never scroll that far.
// A clicked section holds until the scroll settles, so the highlight doesn't flick through the others.
export function useSectionSpy(ids: string[], line = 160) {
  const active = ref(ids[0]!)
  let holding = false
  let settleTimer: ReturnType<typeof setTimeout> | undefined

  function inView() {
    if (window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2) return ids[ids.length - 1]!
    return ids.reduce((current, id) => {
      const el = document.getElementById(id)
      return el && el.getBoundingClientRect().top <= line ? id : current
    }, ids[0]!)
  }

  function holdUntilSettled() {
    holding = true
    clearTimeout(settleTimer)
    settleTimer = setTimeout(() => { holding = false }, 150)
  }

  function onScroll() {
    if (holding) holdUntilSettled()
    else active.value = inView()
  }

  function goTo(id: string) {
    active.value = id
    holdUntilSettled()
    scrollToSection(id)
  }

  onMounted(() => {
    active.value = inView()
    window.addEventListener('scroll', onScroll, { passive: true })
  })
  onBeforeUnmount(() => {
    clearTimeout(settleTimer)
    window.removeEventListener('scroll', onScroll)
  })

  return { active, goTo }
}
