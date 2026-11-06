import { useSupabaseClient } from '#imports'
import type { ReportKind, ReportReason } from '~/utils/reports'

// Reporting something to Dogeash (Supabase: reports). Returns an error message, or null when it's sent.
export function useReports() {
  const supabase = useSupabaseClient()

  async function send(kind: ReportKind, targetId: string, reason: ReportReason, details: string): Promise<string | null> {
    const { error } = await supabase.from('reports').insert({ kind, target_id: targetId, reason, details: details.trim() })
    if (!error) return null
    if (error.code === '23505') return 'You\'ve already reported this. We\'ll let you know when we\'ve looked into it.'
    if (error.message.includes('a lot of reports')) return 'You\'ve sent a lot of reports today. Try again tomorrow.'
    return 'Your report didn\'t send. Try again.'
  }

  return { send }
}
