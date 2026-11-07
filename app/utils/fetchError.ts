// What the site's server said when it refused a request (the database's or Paystack's words),
// or a plain fallback when it couldn't be reached
export function fetchError(e: unknown) {
  const err = e as { data?: { message?: string, statusMessage?: string }, statusMessage?: string }
  return err.data?.message || err.data?.statusMessage || err.statusMessage || 'That didn\'t work. Check your connection and try again.'
}
