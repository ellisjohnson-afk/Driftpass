import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { checkUserIsAdmin } from '@/lib/admin/check-is-admin'

export async function resolveAdminAccess() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return { kind: 'login' as const }
  }

  const isAdmin = await checkUserIsAdmin(user.id, user.email)
  if (!isAdmin) {
    return {
      kind: 'denied' as const,
      userId: user.id,
      email: user.email ?? 'unknown',
    }
  }

  const admin = createAdminClient()
  const { data: profile } = await admin
    .from('profiles')
    .select('is_admin, full_name, email')
    .eq('id', user.id)
    .maybeSingle()

  return {
    kind: 'ok' as const,
    user,
    profile,
    userLabel: profile?.full_name ?? profile?.email ?? user.email ?? undefined,
  }
}
