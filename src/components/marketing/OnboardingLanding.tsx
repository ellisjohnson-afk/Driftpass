import Image from 'next/image'
import Link from 'next/link'

const FEATURES = [
  { emoji: '🧳', label: 'Trip Help' },
  { emoji: '🚢', label: 'Tours' },
  { emoji: '🏷️', label: 'Member Deals' },
  { emoji: '📍', label: 'Local Guide' },
] as const

const HERO_IMAGE =
  'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1200&q=80'

export function OnboardingLanding() {
  return (
    <main className="min-h-screen bg-drift-navy-deep text-white">
      <div className="relative mx-auto max-w-lg">
        <div className="relative h-[42vh] min-h-[280px] w-full overflow-hidden">
          <Image
            src={HERO_IMAGE}
            alt=""
            fill
            priority
            className="object-cover"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-drift-navy-deep/20 via-transparent to-drift-navy-deep" />

          <div className="absolute left-0 right-0 top-6 flex items-center justify-center gap-2">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-white/20 bg-white/10 text-lg">
              🌊
            </span>
            <span className="text-sm font-bold uppercase tracking-[0.2em]">Drift Pass</span>
          </div>
        </div>

        <div className="px-6 pb-10 pt-4">
          <div className="mb-6 flex justify-center gap-2">
            <span className="h-2 w-2 rounded-full bg-drift-gold-mid" />
            {Array.from({ length: 4 }).map((_, index) => (
              <span key={index} className="h-2 w-2 rounded-full bg-drift-border" />
            ))}
          </div>

          <h1 className="text-center text-3xl font-bold leading-tight">
            Save More.
            <br />
            Travel Better.
          </h1>
          <p className="mx-auto mt-3 max-w-sm text-center text-sm leading-relaxed text-drift-text-muted">
            Free membership for the Whitsundays and beyond — member deals, Trip Help essentials, tours,
            and local discovery.
          </p>

          <div className="mt-8 grid grid-cols-4 gap-3">
            {FEATURES.map(({ emoji, label }) => (
              <div key={label} className="text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full border border-drift-border/60 bg-drift-navy-light text-xl">
                  {emoji}
                </div>
                <p className="mt-2 text-[10px] leading-tight text-drift-text-muted">{label}</p>
              </div>
            ))}
          </div>

          <Link
            href="/signup"
            className="mt-8 flex w-full items-center justify-center gap-2 rounded-2xl bg-drift-gold-gradient px-6 py-4 text-base font-bold text-drift-navy-deep shadow-drift-card transition-all hover:brightness-105"
          >
            Start Saving
            <span aria-hidden>→</span>
          </Link>

          <p className="mt-4 text-center text-xs text-drift-text-muted">
            Free membership · Pay for add-ons when you need them
          </p>

          <p className="mt-6 text-center text-sm text-drift-text-muted">
            Already a member?{' '}
            <Link href="/login" className="font-semibold text-drift-gold-mid hover:text-white">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </main>
  )
}
