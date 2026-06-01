import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

// GET /api/partners — list partners, with optional geo filter
// Public endpoint — no auth required
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const lat = parseFloat(searchParams.get('lat') ?? '')
  const lng = parseFloat(searchParams.get('lng') ?? '')
  const radius = parseFloat(searchParams.get('radius') ?? '10')
  const category = searchParams.get('category') ?? undefined
  const city = searchParams.get('city') ?? undefined

  const supabase = await createClient()

  // Geo search if lat/lng provided
  if (!isNaN(lat) && !isNaN(lng)) {
    const { data, error } = await supabase.rpc('nearby_partners', {
      lat,
      lng,
      radius_km: radius,
      p_category: category ?? undefined,
    })

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json({ data })
  }

  // City filter fallback
  let query = supabase
    .from('partners')
    .select(`
      id, name, slug, description, category, city, address,
      lat, lng, google_rating, logo_url, is_featured,
      partner_services(id, service_type, name, credit_cost, is_active)
    `)
    .eq('is_active', true)
    .is('deleted_at', null)
    .order('is_featured', { ascending: false })
    .order('name')

  if (city) query = query.eq('city', city)
  if (category) query = query.eq('category', category)

  const { data, error } = await query

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ data })
}

const CreatePartnerSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z.string().min(2).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(500).optional(),
  category: z.enum([
    'gym_fitness', 'cafe_cowork', 'laundry', 'luggage_storage', 'shower',
    'scooter_hire', 'water_fill', 'accommodation', 'restaurant', 'mechanic',
    'kitchen', 'ev_charging', 'events', 'tours', 'other',
  ]),
  address: z.string().min(5),
  city: z.string().min(2),
  state: z.string().default('QLD'),
  lat: z.number().optional(),
  lng: z.number().optional(),
  phone: z.string().optional(),
  email: z.string().email().optional(),
  website: z.string().url().optional(),
  google_rating: z.number().min(0).max(5).optional(),
})

// POST /api/partners — admin only
export async function POST(req: NextRequest) {
  // Check admin secret for simplicity (swap for proper admin role check in Phase 4)
  const adminSecret = req.headers.get('x-admin-secret')
  if (adminSecret !== process.env.ADMIN_SECRET) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
  }

  const body = await req.json() as unknown
  const parsed = CreatePartnerSchema.safeParse(body)

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  const adminClient = createAdminClient()
  const { data, error } = await adminClient
    .from('partners')
    .insert(parsed.data)
    .select()
    .single()

  if (error) {
    if (error.code === '23505') {
      return NextResponse.json({ error: 'Slug already exists' }, { status: 409 })
    }
    return NextResponse.json({ error: error.message }, { status: 500 })
  }

  return NextResponse.json({ data }, { status: 201 })
}
