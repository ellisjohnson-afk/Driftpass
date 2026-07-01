import { AdminTripHelpProductsManager } from '@/components/admin/AdminTripHelpProductsManager'
import { createAdminClient } from '@/lib/supabase/admin'

export const dynamic = 'force-dynamic'

export default async function AdminTripHelpProductsPage() {
  const admin = createAdminClient()
  const { data: partners } = await admin
    .from('partners')
    .select('id, name, slug')
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return (
    <div className="max-w-4xl">
      <AdminTripHelpProductsManager partners={partners ?? []} />
    </div>
  )
}
