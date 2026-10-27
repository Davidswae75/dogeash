import type { InboxAction, InboxItem } from '~/utils/inbox'

// The store inbox as one shared list: what this person's role may see, unread counts for the bell
// and sidebar, and replying or acting on an item. Changes stay in this browser until the API exists.
export function useStoreInbox() {
  const items = useState<InboxItem[]>('store-inbox', () => structuredClone(sampleInbox))
  const { can, store } = useStoreContext()
  const notify = useNotify()

  const visible = computed(() => items.value.filter(i => can(inboxKinds[i.kind].permission)))
  const unread = computed(() => visible.value.filter(i => i.unread).length)
  const find = (id: string) => items.value.find(i => i.id === id)

  function markRead(id: string) {
    const item = find(id)
    if (item) item.unread = false
  }

  function reply(id: string, text: string) {
    const item = find(id)
    if (!item) return
    item.thread = [...(item.thread ?? []), { from: 'store', name: store.value.name, text, at: 'Just now' }]
    item.preview = `You: ${text}`
    item.status = 'replied'
    item.at = 'Now'
    notify.storeReplySent(item.from, item.channels ?? [])
  }

  function act(id: string, action: InboxAction) {
    const item = find(id)
    if (!item || action.to) return
    item.status = 'done'
    notify.storeActionDone(action.done)
  }

  return { items: visible, unread, find, markRead, reply, act }
}
