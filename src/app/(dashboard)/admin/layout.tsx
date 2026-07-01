import { redirect } from 'next/navigation'
import { AdminShell } from '@/components/admin'
import { AdminAccessDenied } from '@/components/admin/AdminAccessDenied'
import { resolveAdminAccess } from '@/lib/admin/resolve-admin-access'

export const dynamic = 'force-dynamic'

export default async function AdminSectionLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const access = await resolveAdminAccess()

  if (access.kind === 'login') {
    redirect('/login?next=/admin')
  }

  if (access.kind === 'denied') {
    return <AdminAccessDenied userId={access.userId} email={access.email} />
  }

  return <AdminShell userLabel={access.userLabel}>{children}</AdminShell>
}
