// Reports from buyers and stores (Supabase: reports): what can be reported, and why.
// The same words show to the person reporting and to admins in the Reports queue.
export type ReportKind = 'dog' | 'store' | 'review' | 'conversation'
export type ReportReason = 'scam' | 'wrong_info' | 'abuse' | 'welfare' | 'other'
export type ReportStatus = 'open' | 'resolved' | 'dismissed'

export const reportKinds: Record<ReportKind, string> = { dog: 'Listing', store: 'Store', review: 'Review', conversation: 'Conversation' }

export const reportReasons: { value: ReportReason, label: string, hint: string }[] = [
  { value: 'scam', label: 'Scam or fraud', hint: 'Asked to pay outside Dogeash, fake dog, fake store' },
  { value: 'wrong_info', label: 'Wrong information', hint: 'Photos, age, health or training don\'t match' },
  { value: 'abuse', label: 'Abusive or offensive', hint: 'Threats, insults, harassment' },
  { value: 'welfare', label: 'Animal welfare', hint: 'A dog that looks mistreated or unwell' },
  { value: 'other', label: 'Something else', hint: 'Tell us below' },
]
export const reasonLabel = (r: string) => reportReasons.find(x => x.value === r)?.label ?? r
