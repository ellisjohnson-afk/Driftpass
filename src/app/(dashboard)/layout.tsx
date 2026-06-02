import Link from 'next/link'
import { headers } from 'next/headers'
import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'
import { redirect } from 'next/navigation'
import { PASS_ACTIVE_STATUSES } from '@/lib/subscriptions/active-status'
import { canonicalAppUrl } from '@/lib/auth/canonical-url'

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    const pathname = (await headers()).get('x-pathname') ?? '/account'
    redirect(canonicalAppUrl('/login', { next: pathname }))
  }

  const admin = createAdminClient()
  const { data: sub } = await admin
    .from('subscriptions')
    .select('status')
    .eq('user_id', user.id)
    .in('status', [...PASS_ACTIVE_STATUSES])
    .maybeSingle()

  const hasActivePass = Boolean(sub)

  const { data: profile } = await supabase
    .from('profiles')
    .select('full_name')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-[#0A0A0A]">
      {!hasActivePass && (
        <div className="bg-[#00FF7F]/10 border-b border-[#00FF7F]/30 px-4 py-3">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-3">
            <p className="text-sm text-[#00FF7F]">Activate your pass to get credits and your PIN.</p>
            <Link
              href="/pricing"
              className="shrink-0 bg-[#00FF7F] text-[#0A0A0A] px-4 py-2 rounded-lg text-sm font-bold hover:bg-[#00E070] transition-colors"
            >
              Choose a plan
            </Link>
          </div>
        </div>
      )}

      <nav className="border-b border-[#2A2A2A] sticky top-0 bg-[#0A0A0A]/95 backdrop-blur-sm z-40">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={hasActivePass ? '/dashboard' : '/account'} className="font-display text-lg font-bold">
            <span className="text-white">Drift</span>
            <span className="text-[#00FF7F]">Pass</span>
          </Link>

          <div className="flex items-center gap-1">
            <span className="text-xs text-[#6B7280] mr-2 hidden sm:block">
              {profile?.full_name ?? user.email}
            </span>
            <Link
              href="/account"
              className="w-8 h-8 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full flex items-center justify-center text-xs font-bold text-[#00FF7F]"
            >
              {(profile?.full_name ?? user.email ?? 'D')[0]?.toUpperCase()}
            </Link>
          </div>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 py-6">
        {children}
      </main>

      <nav className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] border-t border-[#2A2A2A] pb-safe">
        <div className="max-w-2xl mx-auto px-4 h-16 flex items-center justify-around">
          <TabLink href="/account" icon="👤" label="Account" />
          {hasActivePass ? (
            <>
              <TabLink href="/pass" icon="🎫" label="Pass" />
              <TabLink href="/dashboard" icon="🏠" label="Home" />
            </>
          ) : (
            <TabLink href="/pricing" icon="✨" label="Get pass" />
          )}
        </div>
      </nav>

      <div className="h-16" />
    </div>
  )
}

function TabLink({ href, icon, label }: { href: string; icon: string; label: string }) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center gap-1 text-[#6B7280] hover:text-[#00FF7F] transition-colors min-w-[52px]"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-[10px] uppercase tracking-wide">{label}</span>
    </Link>
  )
}
