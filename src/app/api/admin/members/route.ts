import { NextRequest, NextResponse } from 'next/server'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { fetchAdminMemberStats, fetchAdminMembers } from '@/lib/members/admin-members'

export async function GET(req: NextRequest) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { searchParams } = new URL(req.url)
  const query = searchParams.get('q') ?? undefined
  const passFilter = (searchParams.get('pass') ?? 'all') as 'all' | 'active' | 'inactive'

  try {
    const [members, stats] = await Promise.all([
      fetchAdminMembers({ query, passFilter }),
      fetchAdminMemberStats(),
    ])
    return NextResponse.json({ data: { members, stats } })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load members'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
