import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { generatePassToken, generateQRDataURL, generatePassPIN, pinExpiresInMs } from '@/lib/qr/generator'
import { getCreditBalance } from '@/lib/credits/engine'

// GET /api/pass/token — generate a fresh QR token for the subscriber's pass
// Called every 25 seconds by the pass page client
export async function GET() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // Get active subscription — use admin client to bypass RLS
  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('id, plans(name, credits_per_month)')
    .eq('user_id', user.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false })
    .limit(1)
    .single()

  if (!sub) {
    return NextResponse.json({ error: 'No active subscription' }, { status: 403 })
  }

  const { data: profile } = await admin
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  // Generate a signed, short-lived token + 6-digit PIN
  const token = generatePassToken(user.id, sub.id)
  const qrDataUrl = await generateQRDataURL(token)
  const pin = generatePassPIN(user.id, sub.id)
  const pinExpiresIn = pinExpiresInMs()
  const balance = await getCreditBalance(user.id)
  const plan = sub.plans as { name?: string } | null

  return NextResponse.json({
    qrDataUrl,
    pin,
    pinExpiresIn,
    credits: balance.remaining_credits,
    planName: plan?.name ?? 'DriftPass',
    userName: profile?.full_name ?? user.email ?? 'Drifter',
  })
}
