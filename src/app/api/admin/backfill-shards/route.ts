import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { userPinShard } from '@/lib/qr/generator'

// POST /api/admin/backfill-shards
// One-time backfill of pin_shard on all subscriptions.
// Protected by ADMIN_SECRET env var — hit this once after adding the column.

export async function POST(req: Request) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const { data: subs, error } = await admin
    .from('subscriptions')
    .select('id, user_id')
    .is('pin_shard', null)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  if (!subs?.length) return NextResponse.json({ updated: 0, message: 'Nothing to backfill' })

  let updated = 0
  for (const sub of subs) {
    await admin
      .from('subscriptions')
      .update({ pin_shard: userPinShard(sub.user_id) })
      .eq('id', sub.id)
    updated++
  }

  return NextResponse.json({ updated, message: `Backfilled ${updated} subscriptions` })
}
