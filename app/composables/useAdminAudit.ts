import { ref } from 'vue'
import { useSupabaseClient } from '#imports'
import type { AuditEntry } from '~/utils/admin'

// Admin › Audit log: every admin action, newest first, 100 at a time, optionally one kind ("store.", "dog." …)
const PAGE = 100

export function useAdminAudit() {
  const supabase = useSupabaseClient()
  const entries = ref<AuditEntry[]>([])
  const more = ref(false)
  const loading = ref(false)

  async function load(kind = '', append = false) {
    loading.value = true
    let q = supabase.from('admin_audit').select('id, actor_name, action, target_type, target_id, detail, created_at').order('created_at', { ascending: false })
    if (kind) q = q.like('action', `${kind}%`)
    const from = append ? entries.value.length : 0
    const { data } = await q.range(from, from + PAGE - 1)
    const rows = (data ?? []) as AuditEntry[]
    entries.value = append ? [...entries.value, ...rows] : rows
    more.value = rows.length === PAGE
    loading.value = false
  }

  return { entries, more, loading, load }
}
