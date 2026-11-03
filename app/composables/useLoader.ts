import { useState } from '#imports'

// The full-screen loader (AppLoader in app.vue). Only for waits with nothing else on screen to show
// progress, such as signing out from a menu that closes. If the person pressed a button that stays
// in view, give it `loading` instead; page changes have the thin bar along the top.
//   await useLoader().run('Signing you out…', async () => { … })
// run() resolves once the loader has faded away and a short pause has passed, so a toast shown
// afterwards arrives on its own rather than under the loader.
export interface LoaderState { title: string, text?: string }

// Long enough to read, short enough not to slow anyone down
const MIN_VISIBLE_MS = 600
// The loader's fade-out (AppLoader: 200ms), then a beat before anything else appears
const SETTLE_MS = 450

const wait = (ms: number) => new Promise(r => setTimeout(r, ms))

export function useLoader() {
  const state = useState<LoaderState | null>('app-loader', () => null)

  async function run<T>(title: string, task: () => Promise<T>, text?: string): Promise<T> {
    state.value = { title, text }
    const started = Date.now()
    try {
      return await task()
    }
    finally {
      const left = MIN_VISIBLE_MS - (Date.now() - started)
      if (left > 0) await wait(left)
      state.value = null
      await wait(SETTLE_MS)
    }
  }

  return { state, run }
}
