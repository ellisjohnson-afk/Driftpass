import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { requireAdminApi } from '@/lib/admin/require-admin'

const UpdateSchema = z.object({
  partner_id: z.string().uuid().nullable().optional(),
  business_name: z.string().min(1).max(120).optional(),
  headline: z.string().min(1).max(160).optional(),
  body: z.string().max(500).nullable().optional(),
  cta_label: z.string().min(1).max(40).optional(),
  cta_href: z.string().min(1).max(500).optional(),
  image_url: z
    .union([z.string().url(), z.literal(''), z.null()])
    .optional()
    .transform((v) => (v === '' ? null : v)),
  placement: z.enum(['home', 'trip_help', 'explore', 'town']).optional(),
  town_slug: z.string().min(1).max(80).optional(),
  sort_order: z.number().int().min(0).optional(),
  starts_at: z.string().datetime().nullable().optional(),
  ends_at: z.string().datetime().nullable().optional(),
  is_active: z.boolean().optional(),
})

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const body = await req.json() as unknown
  const parsed = UpdateSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: 'Invalid update' }, { status: 400 })
  }

  const { data, error } = await auth.admin!
    .from('featured_shoutouts')
    .update(parsed.data)
    .eq('id', params.id)
    .select('*, partners(slug, category)')
    .single()

  if (error || !data) {
    return NextResponse.json({ error: error?.message ?? 'Update failed' }, { status: 500 })
  }

  return NextResponse.json({ data })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await requireAdminApi()
  if ('error' in auth && auth.error) return auth.error

  const { error } = await auth.admin!
    .from('featured_shoutouts')
    .delete()
    .eq('id', params.id)

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ success: true })
}
