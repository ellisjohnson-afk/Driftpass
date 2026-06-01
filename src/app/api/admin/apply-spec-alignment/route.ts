import { NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { userPinShard } from '@/lib/qr/generator'

const PLAN_UPDATES = [
  { slug: 'wanderer', price_aud_cents: 2000, credits_per_month: 25 },
  { slug: 'explorer', price_aud_cents: 3500, credits_per_month: 42 },
  { slug: 'nomad', price_aud_cents: 5900, credits_per_month: 70 },
  { slug: 'van_lifer', price_aud_cents: 2200, credits_per_month: 25 },
] as const

// POST /api/admin/apply-spec-alignment
// One-time: align plan pricing/credits + partner name + pin_shard backfill.
// Requires pin_shard column (migration 005). Protected by x-admin-secret.
export async function POST(req: Request) {
  const secret = req.headers.get('x-admin-secret')
  if (secret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const admin = createAdminClient()
  const results: Record<string, unknown> = { plans: [], pin_shard: null }

  for (const plan of PLAN_UPDATES) {
    const { error } = await admin
      .from('plans')
      .update({
        price_aud_cents: plan.price_aud_cents,
        credits_per_month: plan.credits_per_month,
      })
      .eq('slug', plan.slug)
    results.plans = [...(results.plans as string[]), error ? `${plan.slug}: ${error.message}` : plan.slug]
  }

  await admin
    .from('partners')
    .update({ name: 'Airlie Beach Fit' })
    .eq('slug', 'ailey-beach-fit')

  const { data: subs, error: subsError } = await admin
    .from('subscriptions')
    .select('id, user_id')
    .is('pin_shard', null)

  if (subsError?.message?.includes('pin_shard')) {
    return NextResponse.json(
      {
        error: 'pin_shard column missing — run migration 005 via Supabase SQL editor or npm run db:push',
        results,
      },
      { status: 500 }
    )
  }

  let backfilled = 0
  for (const sub of subs ?? []) {
    await admin
      .from('subscriptions')
      .update({ pin_shard: userPinShard(sub.user_id) })
      .eq('id', sub.id)
    backfilled++
  }

  results.pin_shard = { backfilled }

  return NextResponse.json({ ok: true, results })
}
