import type { AuthError } from '@supabase/supabase-js'
import { useSupabaseClient } from '#imports' // @nuxtjs/supabase
import { useSavedDogs } from './useSavedDogs'
import { useSession } from './useSession'

// Every sign-up, sign-in and password call to Supabase, in one place. Each returns a plain
// error message to show (or null when it worked), so pages never deal with Supabase errors.
// Codes arrive by email: the Supabase email templates must include {{ .Token }} (see PLAN.md).

type Result = string | null

const messages: Record<string, string> = {
  invalid_credentials: 'That email or password isn\'t right.',
  email_not_confirmed: 'Confirm your email first. We\'ve sent you a new code.',
  user_already_exists: 'There\'s already an account with that email. Sign in instead.',
  email_exists: 'There\'s already an account with that email. Sign in instead.',
  otp_expired: 'That code has expired or isn\'t right. Send a new one and try again.',
  over_email_send_rate_limit: 'Too many emails sent just now. Wait a few minutes, then try again.',
  over_request_rate_limit: 'Too many attempts. Wait a minute, then try again.',
  weak_password: 'Choose a stronger password: at least 8 characters with a number.',
  same_password: 'Choose a password you haven\'t used on this account before.',
  email_address_invalid: 'That email address can\'t receive mail. Check it for typos.',
  signup_disabled: 'New accounts are paused right now. Try again later.',
  user_not_found: 'There\'s no account with that email.',
  reauthentication_needed: 'For your security, sign out and back in, then change your password.',
}

export function explainAuthError(error: AuthError | Error | null | undefined): Result {
  if (!error) return null
  const code = 'code' in error ? (error.code as string | undefined) : undefined
  return (code && messages[code]) || 'Something went wrong. Check your connection and try again.'
}

export function useAuth() {
  const auth = useSupabaseClient().auth
  const session = useSession()
  const savedDogs = useSavedDogs()

  // After any successful sign-in: load the account and bring this browser's saved dogs into it.
  // Returns how many dogs were new to the account.
  async function finishSignIn(user: { id: string, email?: string } | null | undefined) {
    if (!user) return 0
    await session.load(user)
    session.mergeGuest()
    return import.meta.client ? savedDogs.adoptGuest() : 0
  }

  return {
    // Sign-up: create the account; Supabase emails a 6-digit code to confirm the address
    async signUp(email: string, password: string, fullName: string): Promise<Result> {
      const { data, error } = await auth.signUp({ email, password, options: { data: { full_name: fullName } } })
      if (error) return explainAuthError(error)
      // An existing confirmed email comes back as a user with no identities, so we don't leak who has an account
      if (data.user && data.user.identities?.length === 0) return messages.user_already_exists!
      return null
    },

    async confirmSignUp(email: string, code: string): Promise<{ error: Result, moved: number }> {
      const { data, error } = await auth.verifyOtp({ email, token: code, type: 'signup' })
      if (error) return { error: explainAuthError(error), moved: 0 }
      return { error: null, moved: await finishSignIn(data.user) }
    },

    resendSignUpCode: async (email: string): Promise<Result> =>
      explainAuthError((await auth.resend({ type: 'signup', email })).error),

    // Sign-in with email and password. An unconfirmed account gets a fresh confirmation code.
    async signIn(email: string, password: string): Promise<{ error: Result, needsCode: boolean, moved: number }> {
      const { data, error } = await auth.signInWithPassword({ email, password })
      if (error?.code === 'email_not_confirmed') {
        await auth.resend({ type: 'signup', email })
        return { error: null, needsCode: true, moved: 0 }
      }
      if (error) return { error: explainAuthError(error), needsCode: false, moved: 0 }
      return { error: null, needsCode: false, moved: await finishSignIn(data.user) }
    },

    // Sign-in with a code instead of a password (existing accounts only)
    sendSignInCode: async (email: string): Promise<Result> =>
      explainAuthError((await auth.signInWithOtp({ email, options: { shouldCreateUser: false } })).error),

    async confirmSignInCode(email: string, code: string): Promise<{ error: Result, moved: number }> {
      const { data, error } = await auth.verifyOtp({ email, token: code, type: 'email' })
      if (error) return { error: explainAuthError(error), moved: 0 }
      return { error: null, moved: await finishSignIn(data.user) }
    },

    // Forgot password: a code by email signs you in, then you choose a new password
    sendResetCode: async (email: string): Promise<Result> =>
      explainAuthError((await auth.resetPasswordForEmail(email)).error),

    async confirmResetCode(email: string, code: string): Promise<Result> {
      const { data, error } = await auth.verifyOtp({ email, token: code, type: 'recovery' })
      if (error) return explainAuthError(error)
      await finishSignIn(data.user)
      return null
    },

    setPassword: async (password: string): Promise<Result> =>
      explainAuthError((await auth.updateUser({ password })).error),
  }
}
