import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { fulfillOrderFromCheckoutSession } from '@/lib/orders/fulfillment'

export const dynamic = 'force-dynamic'

function isCheckoutSessionId(value: string | undefined): boolean {
  return Boolean(value && value.startsWith('cs_') && !value.includes('{'))
}

export default async function TripHelpReceiptPage({
  searchParams,
}: {
  searchParams: { session_id?: string }
}) {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  const appOrigin = await getServerAppOrigin()

  if (!user) {
    redirect(appUrlAt(appOrigin, '/login', { next: '/trip-help' }))
  }

  const sessionId = searchParams.session_id
  if (!sessionId || !isCheckoutSessionId(sessionId)) {
    redirect('/trip-help/orders')
  }

  try {
    const voucher = await fulfillOrderFromCheckoutSession(sessionId, user.id)
    if (voucher) {
      redirect(`/trip-help/orders/${voucher.id}`)
    }
  } catch (error) {
    console.error('[TripHelp receipt] fulfillment failed', error)
  }

  redirect('/trip-help/orders')
}
