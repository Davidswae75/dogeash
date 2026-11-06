import { useState, useSupabaseClient } from '#imports'

// Admin › Reports: what buyers and stores reported (admin_reports()), the open count for the sidebar,
// reading a reported conversation (logged), and resolving or dismissing with a note the reporter reads.
export interface AdminReport {
  id: string
  kind: 'dog' | 'store' | 'review' | 'conversation'
  target_id: string
  reason: string
  details: string
  status: 'open' | 'resolved' | 'dismissed'
  resolution: string
  resolved_at: string | null
  created_at: string
  reporter: string
  reporter_email: string
  target: { label: string, link: string | null, status: string }
  open_on_target: number
}

export function useAdminReports() {
  const supabase = useSupabaseClient()
  const reports = useState<AdminReport[]>('admin-reports', () => [])
  const openCount = useState('admin-reports-open', () => 0)
  const loaded = useState('admin-reports-loaded', () => false)

  async function load() {
    const { data } = await supabase.rpc('admin_reports')
    reports.value = (data as unknown as AdminReport[] | null) ?? []
    openCount.value = reports.value.filter(r => r.status === 'open').length
    loaded.value = true
  }
  async function loadCount() {
    const { data } = await supabase.rpc('admin_open_reports')
    openCount.value = (data as number | null) ?? 0
  }

  async function messages(report: AdminReport) {
    const { data } = await supabase.rpc('admin_report_messages', { report: report.id })
    return (data as unknown as { from: 'buyer' | 'store', body: string, at: string }[] | null) ?? []
  }

  async function close(report: AdminReport, outcome: 'resolved' | 'dismissed', note: string): Promise<string | null> {
    const { error } = await supabase.rpc('admin_resolve_report', { target: report.id, outcome, note })
    if (error) return error.message.includes('note') ? 'Give the reporter a note (a few words).' : 'That didn\'t work. Try again.'
    await load()
    return null
  }

  return { reports, openCount, loaded, load, loadCount, messages, close }
}
