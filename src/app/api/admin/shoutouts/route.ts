import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/admin/require-admin'
import { fetchAllShoutoutsForAdmin } from '@/lib/shoutouts/fetch'

const ShoutoutSchema = z.object({
  partner_id: z.string().uuid().nullable().optional(),
  business_name: z.string().min(1).max(120),
  headline: z.string().min(1).max(160),
  body: z.string().max(500).nullable().optional(),
  cta_label: z.string().min(1).max(40).default('Learn more'),
  cta_href: z.string().min(1).max(500),
  image_url: z
    .union([z.string().url(), z.literal(''), z.null()])
    .optional()
    .transform((v) => (v === '' || v === undefined ? null : v)),
  placement: z.enum(['home', 'trip_help', 'explore', 'town']),
  town_slug: z.string().min(1).max(80).default('airlie-beach'),
  sort_order: z.number().int().min(0).default(0),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().default(true),
})

export async function GET() {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  try {
    const rows = await fetchAllShoutoutsForAdmin(auth.admin!)
    return NextResponse.json({ data: rows })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to load shoutouts'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const body = await req.json() as unknown
  const parsed = ShoutoutSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid shoutout' }, { status: 400 })
  }

  const { data, error } = await auth.admin!
    .from('featured_shoutouts')
    .insert(parsed.data)
    .select('*, partners(slug, category)')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Insert failed' }, { status: 500 })
  }

  return NextResponse.json({ data })
}
