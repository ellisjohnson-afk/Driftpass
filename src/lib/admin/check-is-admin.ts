import { createAdminClient } from '@/lib/supabase/admin'

export async function checkUserIsAdmin(
  userId: string,
  email?: string | null
): Promise<boolean> {
  try {
    const admin = createAdminClient()
    const { data, error } = await admin
      .from('profiles')
      .select('is_admin')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      console.error('[admin] profile lookup failed', { userId, error: error.message })
    }

    if (data?.is_admin === true) {
      return true
    }

    if (email) {
      const { data: byEmail, error: emailError } = await admin
        .from('profiles')
        .select('id, is_admin')
        .eq('email', email)
        .maybeSingle()

      if (emailError) {
        console.error('[admin] email lookup failed', { email, error: emailError.message })
      }

      if (byEmail?.is_admin === true && byEmail.id === userId) {
        return true
      }
    }

    return false
  } catch (error) {
    console.error('[admin] checkUserIsAdmin failed', error)
    return false
  }
}
