import { z } from 'zod'

// Sign-in and sign-up validation, shared by the forms and (later) the API

export const emailSignInSchema = z.object({
  email: z.string({ required_error: 'Enter the email address you signed up with.' })
    .trim()
    .min(1, 'Enter the email address you signed up with.')
    .email('That email address doesn\'t look right. Check for typos.'),
  password: z.string({ required_error: 'Enter your password.' })
    .min(1, 'Enter your password.')
    .min(8, 'Passwords are at least 8 characters.'),
})

export const emailCodeSchema = emailSignInSchema.pick({ email: true })

// Nigerian mobile numbers without the leading 0, e.g. 803 123 4567
export const phoneSignInSchema = z.object({
  phone: z.string({ required_error: 'Enter your phone number.' })
    .transform(v => v.replace(/\D/g, '').replace(/^0/, ''))
    .refine(v => v.length === 10, 'Enter your 10-digit number without the leading 0, like 803 123 4567.'),
})

export type EmailSignIn = z.infer<typeof emailSignInSchema>
export type PhoneSignIn = z.infer<typeof phoneSignInSchema>

export function formatNigerianPhone(digits: string) {
  const d = digits.replace(/\D/g, '').replace(/^0/, '')
  return `+234 ${d.slice(0, 3)} ${d.slice(3, 6)} ${d.slice(6)}`.trim()
}

export const signUpSchema = z.object({
  fullName: z.string({ required_error: 'Enter your full name.' })
    .trim()
    .min(1, 'Enter your full name.')
    .refine(v => v.split(/\s+/).filter(Boolean).length >= 2, 'Enter your first and last name.'),
  email: z.string({ required_error: 'Enter your email address.' })
    .trim()
    .min(1, 'Enter your email address.')
    .email('That email address doesn\'t look right. Check for typos.'),
  phone: phoneSignInSchema.shape.phone,
  password: z.string({ required_error: 'Create a password.' })
    .min(1, 'Create a password.')
    .min(8, 'Use at least 8 characters.')
    .regex(/\d/, 'Add at least one number.'),
  terms: z.literal(true, { errorMap: () => ({ message: 'Agree to the terms to create your account.' }) }),
})

export type SignUp = z.infer<typeof signUpSchema>

// Opening a store: the same account, plus the kennel's name and city
export const storeSignUpSchema = signUpSchema.extend({
  storeName: z.string({ required_error: 'Enter your store or kennel name.' })
    .trim()
    .min(2, 'Enter your store or kennel name.'),
  city: z.string({ required_error: 'Enter the city your kennel is in.' })
    .trim()
    .min(2, 'Enter the city your kennel is in.'),
})

// 0–4: length, a number, upper and lower case, a symbol
export function passwordStrength(pw: string) {
  if (!pw) return 0
  return [pw.length >= 8, /\d/.test(pw), /[a-z]/.test(pw) && /[A-Z]/.test(pw), /[^A-Za-z0-9]/.test(pw)].filter(Boolean).length
}

// Forgot password: a new password follows the same rules as sign-up
export const newPasswordSchema = signUpSchema.pick({ password: true })
