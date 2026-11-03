// Times as people say them: "Just now", "5 min", "3 h", "Yesterday", "Mon 3 Nov"
export function shortTime(iso: string, now = new Date()) {
  const then = new Date(iso)
  const minutes = Math.round((now.getTime() - then.getTime()) / 60000)
  if (minutes < 1) return 'Just now'
  if (minutes < 60) return `${minutes} min`
  if (minutes < 60 * 24 && then.getDate() === now.getDate()) return `${Math.round(minutes / 60)} h`
  const yesterday = new Date(now)
  yesterday.setDate(now.getDate() - 1)
  if (then.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return then.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' })
}

// A visit day ("2026-11-07") as "Sat 7 Nov", and its parts for a calendar block
export function visitDay(day: string) {
  const d = new Date(`${day}T12:00:00`)
  return {
    label: d.toLocaleDateString('en-NG', { weekday: 'short', day: 'numeric', month: 'short' }),
    weekday: d.toLocaleDateString('en-NG', { weekday: 'short' }),
    date: String(d.getDate()),
    month: d.toLocaleDateString('en-NG', { month: 'short' }),
  }
}

export const todayIso = () => new Date().toISOString().slice(0, 10)
