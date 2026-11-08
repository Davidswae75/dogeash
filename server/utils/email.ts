import type { H3Event } from 'h3'
import { useRuntimeConfig } from '#imports' // nitro

// The site's own emails (invitations now; bookings and payments later), sent from the server through
// whichever provider has a key:
//   - Brevo (BREVO_API_KEY), for now: it sends from a single verified sender address, no domain needed
//   - Resend (RESEND_API_KEY), once Dogeash has a domain verified there (it then wins if both are set)
// EMAIL_FROM is the sender, "Dogeash <address>"; with Brevo it must be the sender verified in Brevo.
// Without a key nothing is sent and the caller carries on: the invitation still waits in the person's account.
// (Sign-up codes and password resets are Supabase's own emails, through Brevo SMTP; not these.)

export interface EmailMessage {
  to: string
  subject: string
  /** Short lines of plain text; the button and footer are added */
  lines: string[]
  button?: { label: string, url: string }
  /** Small print under the button */
  note?: string
}

// "Dogeash <hello@x.com>" → name and address
function parseFrom(from: string) {
  const m = from.match(/^\s*"?([^"<]*?)"?\s*<([^>]+)>\s*$/)
  return m ? { name: m[1]!.trim() || 'Dogeash', email: m[2]!.trim() } : { name: 'Dogeash', email: from.trim() }
}

export async function sendEmail(event: H3Event, m: EmailMessage): Promise<{ sent: boolean, error?: string }> {
  const config = useRuntimeConfig(event)
  const resendKey = config.resendApiKey as string
  const brevoKey = config.brevoApiKey as string
  const from = config.emailFrom as string
  if (!from || (!resendKey && !brevoKey)) return { sent: false, error: 'Email isn\'t set up (BREVO_API_KEY or RESEND_API_KEY, and EMAIL_FROM)' }
  const html = emailHtml(m)
  const text = emailText(m)
  try {
    const res = resendKey
      ? await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { 'Authorization': `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from, to: [m.to], subject: m.subject, html, text }),
        })
      : await fetch('https://api.brevo.com/v3/smtp/email', {
          method: 'POST',
          headers: { 'api-key': brevoKey, 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ sender: parseFrom(from), to: [{ email: m.to }], subject: m.subject, htmlContent: html, textContent: text }),
        })
    if (!res.ok) {
      const body = await res.json().catch(() => null) as { message?: string } | null
      return { sent: false, error: body?.message ?? `The email service answered ${res.status}` }
    }
    return { sent: true }
  }
  catch (e) {
    return { sent: false, error: (e as Error).message }
  }
}

const escape = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

// Plain, sturdy HTML that mail apps render the same: one column, inline styles, the brand's ink and marigold
export function emailHtml(m: EmailMessage) {
  const lines = m.lines.map(l => `<p style="margin:0 0 14px;font-size:15px;line-height:23px;color:#1c1b19">${escape(l)}</p>`).join('')
  const button = m.button
    ? `<p style="margin:22px 0"><a href="${escape(m.button.url)}" style="display:inline-block;background:#f5b417;color:#1c1b19;font-weight:700;font-size:15px;text-decoration:none;padding:13px 22px;border-radius:999px">${escape(m.button.label)}</a></p>
       <p style="margin:0 0 14px;font-size:12px;line-height:18px;color:#6b675f">Or paste this link into your browser:<br><span style="word-break:break-all">${escape(m.button.url)}</span></p>`
    : ''
  const note = m.note ? `<p style="margin:0;font-size:12px;line-height:18px;color:#6b675f">${escape(m.note)}</p>` : ''
  return `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"></head><body style="margin:0;padding:24px 12px;background:#f3f1ec;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0"><tr><td align="center">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width:520px;background:#ffffff;border-radius:16px">
      <tr><td style="padding:24px 28px 8px"><span style="font-size:22px;font-weight:900;letter-spacing:-0.5px;color:#1c1b19">dogeash<span style="color:#f5b417">.</span></span></td></tr>
      <tr><td style="padding:12px 28px 26px">${lines}${button}${note}</td></tr>
    </table>
    <p style="margin:14px 0 0;font-size:11px;color:#8a857b">Dogeash · Guard dogs from kennels we inspect in person</p>
  </td></tr></table></body></html>`
}

function emailText(m: EmailMessage) {
  return [...m.lines, m.button ? `${m.button.label}: ${m.button.url}` : '', m.note ?? ''].filter(Boolean).join('\n\n')
}
