import { createClient } from '@/lib/supabase/server'
import { NextResponse } from 'next/server'
import { canonicalAppUrl } from '@/lib/auth/canonical-url'

export async function POST() {
  const supabase = await createClient()
  await supabase.auth.signOut()

  return NextResponse.redirect(canonicalAppUrl('/'), { status: 303 })
}
