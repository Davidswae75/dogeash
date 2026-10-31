// Every jump within a page scrolls smoothly, except for people who've asked for reduced motion.
// Page changes still start at the top instantly, and skip links stay instant so keyboard users aren't kept waiting.
export default defineNuxtPlugin((nuxtApp) => {
  // NuxtLinks with a hash, such as the "What it costs" menu item
  const router = useRouter()
  router.beforeEach(() => {
    router.options.scrollBehaviorType = scrollBehavior()
  })

  // Plain <a href="#section"> links, such as contents lists
  document.addEventListener('click', (e) => {
    if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return
    const link = (e.target as Element).closest?.('a[href^="#"]')
    const id = link?.getAttribute('href')?.slice(1)
    if (!id || id === 'main') return
    if (scrollToSection(id)) e.preventDefault()
  })
})
