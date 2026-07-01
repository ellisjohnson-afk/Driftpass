import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { AdminShoutoutsManager } from '@/components/admin/AdminShoutoutsManager'

export const dynamic = 'force-dynamic'

export default async function AdminShoutoutsPage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) redirect('/login')

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()

  if (!profile?.is_admin) redirect('/perks')

  const admin = createAdminClient()
  const { data: partners } = await admin
    .from('partners')
    .select('id, name, slug')
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('name', { ascending: true })

  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-8">
      <div className="max-w-3xl mx-auto">
        <AdminShoutoutsManager partners={partners ?? []} />
      </div>
    </div>
  )
}
