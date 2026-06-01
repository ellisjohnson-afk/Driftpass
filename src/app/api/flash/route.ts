import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/flash — list active flash deals for authenticated subscribers
export async function GET(_req: NextRequest) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { data, error } = await supabase
    .from('flash_deals')
    .select(`
      *,
      partners(name, city, category, logo_url)
    `)
    .eq('is_active', true)
    .gt('seats_remaining', 0)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

const CreateFlashSchema = z.object({
  partner_id: z.string().uuid(),
  title: z.string().min(5).max(100),
  description: z.string().min(10).max(500),
  original_price_aud_cents: z.number().int().positive(),
  subscriber_price_aud_cents: z.number().int().positive(),
  commission_rate: z.number().min(0).max(1).default(0.20),
  total_seats: z.number().int().positive(),
  available_from: z.string().datetime(),
  expires_at: z.string().datetime(),
})

// POST /api/flash — admin creates a flash deal
export async function POST(req: NextRequest) {
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as unknown
  const parsed = CreateFlashSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('flash_deals')
    .insert({
      ...parsed.data,
      seats_remaining: parsed.data.total_seats,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data }, { status: 201 })
}

