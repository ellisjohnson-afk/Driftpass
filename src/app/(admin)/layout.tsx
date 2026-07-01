import { AdminShell } from '@/components/admin'
import { requireAdminPage } from '@/lib/admin/require-admin-page'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { profile } = await requireAdminPage()
  const userLabel = profile?.full_name ?? profile?.email ?? undefined

  return <AdminShell userLabel={userLabel}>{children}</AdminShell>
}
