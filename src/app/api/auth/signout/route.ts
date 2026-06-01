import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { headers } from 'next/headers'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  // Use request origin so it works on any port (dev or prod)
  const headersList = await headers()
  const origin = headersList.get('origin') ?? process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

  return NextResponse.redirect(`${origin}/`, { status: 303 })
}
