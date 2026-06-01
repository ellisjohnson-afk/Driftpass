import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { verifyPassToken, verifyPassPIN, InvalidTokenError, ExpiredTokenError } from '@/lib/qr/generator'
import { deductCredits, InsufficientCreditsError } from '@/lib/credits/engine'
import { sendRedemptionConfirmationEmail } from '@/lib/email/resend'

const PinRedemptionSchema = z.object({
  pin: z.string().length(6),
  serviceId: z.string().uuid(),
})

const TokenRedemptionSchema = z.object({
  token: z.string().min(1),
  serviceId: z.string().uuid(),
})

type ServiceRow = {
  id: string
  name: string
  credit_cost: number
  aud_payout_cents: number
  partner_id: string
  max_daily_redemptions: number | null
}

// POST /api/redemptions
export async function POST(req: NextRequest) {
  const adminClient = createAdminClient()
  const body = await req.json() as Record<string, unknown>

  // ── PIN path (primary — no partner login needed) ──────────────
  if ('pin' in body) {
    const parsed = PinRedemptionSchema.safeParse(body)
    if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    const { pin, serviceId } = parsed.data

    const { data: service } = await adminClient
      .from('partner_services')
      .select('id, name, credit_cost, aud_payout_cents, partner_id, max_daily_redemptions')
      .eq('id', serviceId).eq('is_active', true).single()
    if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

    // Find the subscriber whose PIN matches — shard pre-filters to ~1% of subscribers
    const shard = pin.slice(0, 2)
    const { data: subs } = await adminClient
      .from('subscriptions')
      .select('id, user_id')
      .eq('status', 'active')
      .eq('pin_shard', shard)
    const matched = subs?.find((s) => verifyPassPIN(pin, s.user_id, s.id))
    if (!matched) return NextResponse.json({ error: 'Invalid or expired PIN' }, { status: 401 })

    return processRedemption({ userId: matched.user_id, subscriptionId: matched.id, serviceId, service: service as ServiceRow, adminClient })
  }

  // ── QR Token path (legacy) ────────────────────────────────────
  const parsed = TokenRedemptionSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: 'Invalid request' }, { status: 400 })

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: partnerUser } = await supabase
    .from('partner_users').select('id, partner_id').eq('user_id', user.id).single()
  if (!partnerUser) return NextResponse.json({ error: 'Not a partner user' }, { status: 403 })

  let passToken
  try { passToken = verifyPassToken(parsed.data.token) } catch (err) {
    if (err instanceof ExpiredTokenError) return NextResponse.json({ error: 'QR code expired' }, { status: 400 })
    if (err instanceof InvalidTokenError) return NextResponse.json({ error: 'Invalid QR code' }, { status: 400 })
    return NextResponse.json({ error: 'Token error' }, { status: 400 })
  }

  const { data: service } = await adminClient
    .from('partner_services')
    .select('id, name, credit_cost, aud_payout_cents, partner_id, max_daily_redemptions')
    .eq('id', parsed.data.serviceId).eq('partner_id', partnerUser.partner_id).eq('is_active', true).single()
  if (!service) return NextResponse.json({ error: 'Service not found' }, { status: 404 })

  return processRedemption({ userId: passToken.userId, subscriptionId: passToken.subscriptionId, serviceId: parsed.data.serviceId, service: service as ServiceRow, adminClient })
}

async function processRedemption({ userId, subscriptionId, serviceId, service, adminClient }: {
  userId: string; subscriptionId: string; serviceId: string
  service: ServiceRow; adminClient: ReturnType<typeof createAdminClient>
}) {
  const { data: subscription } = await adminClient
    .from('subscriptions').select('id, user_id')
    .eq('id', subscriptionId).eq('user_id', userId).eq('status', 'active').single()
  if (!subscription) return NextResponse.json({ error: 'No active subscription' }, { status: 403 })

  // Period cap check
  if (service.max_daily_redemptions) {
    const periodStart = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString()
    const { count } = await adminClient.from('redemptions')
      .select('*', { count: 'exact', head: true })
      .eq('service_id', serviceId).eq('user_id', userId).gte('created_at', periodStart)
    if (count !== null && count >= service.max_daily_redemptions)
      return NextResponse.json({ error: `Limit reached — max ${service.max_daily_redemptions}x per period` }, { status: 429 })
  }

  const { data: redemption, error: rdErr } = await adminClient
    .from('redemptions').insert({
      user_id: userId, partner_id: service.partner_id, service_id: serviceId,
      subscription_id: subscription.id, credits_used: service.credit_cost,
      aud_paid_to_partner: service.aud_payout_cents, status: 'confirmed',
      qr_token_used: 'pin-redemption',
    }).select().single()
  if (rdErr || !redemption) return NextResponse.json({ error: 'Failed to record redemption' }, { status: 500 })

  let newBalance: number
  try {
    newBalance = await deductCredits({
      userId, subscriptionId: subscription.id, amount: service.credit_cost,
      description: `${service.name} @ Partner`, redemptionId: redemption.id,
    })
  } catch (err) {
    await adminClient.from('redemptions').delete().eq('id', redemption.id)
    if (err instanceof InsufficientCreditsError)
      return NextResponse.json({ error: `Not enough credits — need ${service.credit_cost}` }, { status: 402 })
    return NextResponse.json({ error: 'Credit deduction failed' }, { status: 500 })
  }

  const { data: profile } = await adminClient.from('profiles').select('email, full_name').eq('id', userId).single()
  const { data: partner } = await adminClient.from('partners').select('name').eq('id', service.partner_id).single()
  if (profile && partner) {
    sendRedemptionConfirmationEmail({
      to: profile.email, name: profile.full_name ?? 'Drifter',
      serviceName: service.name, partnerName: partner.name,
      creditsUsed: service.credit_cost, creditsRemaining: newBalance,
    }).catch(console.error)
  }

  return NextResponse.json({
    success: true, redemptionId: redemption.id,
    creditsUsed: service.credit_cost, creditsRemaining: newBalance,
    serviceName: service.name, memberName: profile?.full_name ?? 'DriftPass Member',
  })
}

// GET /api/redemptions — history for current user
export async function GET(req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const limit = Math.min(parseInt(req.nextUrl.searchParams.get('limit') ?? '20'), 50)
  const offset = parseInt(req.nextUrl.searchParams.get('offset') ?? '0')

  const { data, error } = await supabase
    .from('redemptions')
    .select('id, credits_used, status, created_at, partners(name, category), partner_services(name)')
    .eq('user_id', user.id).order('created_at', { ascending: false }).range(offset, offset + limit - 1)

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}
