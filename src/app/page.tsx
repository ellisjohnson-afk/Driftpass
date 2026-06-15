import { redirect } from 'next/navigation'
import { createClient } from '@/lib/supabase/server'
import { appUrlAt } from '@/lib/auth/canonical-url'
import { getServerAppOrigin } from '@/lib/auth/app-origin.server'
import { OnboardingLanding } from '@/components/marketing/OnboardingLanding'

export default async function PublicHomePage() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (user) {
    const appOrigin = await getServerAppOrigin()
    redirect(appUrlAt(appOrigin, '/home'))
  }

  return <OnboardingLanding />
}
