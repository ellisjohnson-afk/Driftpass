import type { User } from '@supabase/supabase-js'
import { getClientAppOrigin } from '@/lib/auth/app-origin'

/** Supabase returns an empty identities array when the email is already registered. */
export function isDuplicateSignupUser(user: User | null): boolean {
  return Boolean(user?.identities && user.identities.length === 0)
}

export function formatSignInError(message: string): string {
  const lower = message.toLowerCase()
  if (lower.includes('invalid login credentials')) {
    return 'Invalid email or password. If you use Google sign-in, click Continue with Google. Otherwise use Forgot password to set a new password.'
  }
  if (lower.includes('email not confirmed')) {
    return 'Sign in failed. Confirm your email first, or resend the confirmation link below.'
  }
  return message
}

export function confirmationRedirectUrl(): string {
  return `${getClientAppOrigin()}/callback`
}

/** Password reset — uses /callback?next=/reset-password (requires callback/** in Supabase Redirect URLs). */
export function passwordRecoveryRedirectUrl(): string {
  const origin = getClientAppOrigin()
  return `${origin}/callback?next=${encodeURIComponent('/reset-password')}`
}

export function passwordResetPageUrl(): string {
  return `${getClientAppOrigin()}/reset-password`
}
