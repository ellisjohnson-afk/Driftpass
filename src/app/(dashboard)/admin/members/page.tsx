import { AdminMembersManager } from '@/components/admin/AdminMembersManager'

export const dynamic = 'force-dynamic'

export default function AdminMembersPage() {
  return (
    <div className="max-w-4xl">
      <AdminMembersManager />
    </div>
  )
}
