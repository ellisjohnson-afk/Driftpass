import { createAdminClient } from '@/lib/supabase/admin'
import { AdminShoutoutsManager } from '@/components/admin/AdminShoutoutsManager'

export const dynamic = 'force-dynamic'

export default async function AdminShoutoutsPage() {
  const admin = createAdminClient()
  const { data: partners } = await admin
    .from('partners')
    .select('id, name, slug')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return (
    <div className="max-w-3xl">
      <AdminShoutoutsManager partners={partners ?? []} />
    </div>
  )
}
