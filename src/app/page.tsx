import Link from 'next/link'
import { MEMBERSHIP_INCLUSIONS, MEMBERSHIP_PLAN } from '@/constants/plans'

// Marketing landing page — Server Component, no auth required
export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0A0A0A]">
      <Nav />
      <Hero />
      <Partners />
      <HowItWorks />
      <Pricing />
      <Footer />
    </main>
  )
}

function Nav() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-[#0A0A0A]/90 backdrop-blur-sm border-b border-[#2A2A2A]">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <span className="font-display text-xl font-bold">
          <span className="text-white">Drift</span>
          <span className="text-[#00FF7F]">Pass</span>
        </span>
        <div className="flex items-center gap-6">
          <Link href="#how-it-works" className="text-sm text-[#9CA3AF] hover:text-white transition-colors hidden sm:block">
            How it works
          </Link>
          <Link href="#pricing" className="text-sm text-[#9CA3AF] hover:text-white transition-colors hidden sm:block">
            Pricing
          </Link>
          <Link
            href="/login"
            className="text-sm text-[#9CA3AF] hover:text-white transition-colors"
          >
            Login
          </Link>
          <Link
            href="/signup"
            className="bg-[#00FF7F] text-[#0A0A0A] px-4 py-2 rounded-lg text-sm font-semibold hover:bg-[#00E070] transition-colors"
          >
            Get Started
          </Link>
        </div>
      </div>
    </nav>
  )
}

function Hero() {
  return (
    <section className="pt-32 pb-24 px-6">
      <div className="max-w-4xl mx-auto text-center">
        <div className="inline-flex items-center gap-2 bg-[#1A1A1A] border border-[#2A2A2A] rounded-full px-4 py-2 text-sm text-[#9CA3AF] mb-8">
          <span className="w-2 h-2 bg-[#00FF7F] rounded-full animate-pulse" />
          Now live in Airlie Beach · 4 partners
        </div>

        <h1 className="font-display text-5xl sm:text-7xl font-bold leading-tight mb-6">
          <span className="text-[#9CA3AF]">The ultimate</span>
          <br />
          <span className="italic text-[#00FF7F]">travel companion</span>
          <br />
          <span className="text-white">for the modern</span>
          <br />
          <span className="italic text-[#FF6B35]">wanderer.</span>
        </h1>

        <p className="text-xl text-[#9CA3AF] max-w-2xl mx-auto mb-10 leading-relaxed">
          One membership. Every city. Gyms, cafés, tours, laundry, and local deals —
          wherever you roam.{' '}
          <span className="text-white font-semibold">A$7.99 per week.</span>
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-[#00FF7F] text-[#0A0A0A] px-8 py-4 rounded-xl font-bold text-lg hover:bg-[#00E070] transition-colors"
          >
            Get Your Pass
          </Link>
          <Link
            href="#how-it-works"
            className="border border-[#2A2A2A] text-white px-8 py-4 rounded-xl font-semibold text-lg hover:border-[#00FF7F] hover:text-[#00FF7F] transition-colors"
          >
            How it works
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-2 sm:grid-cols-4 gap-8 text-center">
          {[
            { value: '4', label: 'Partners live' },
            { value: 'A$7.99', label: 'Per week' },
            { value: '6', label: 'Build phases' },
            { value: '∞', label: 'Potential' },
          ].map(({ value, label }) => (
            <div key={label}>
              <div className="text-3xl font-bold text-[#00FF7F] mb-1">{value}</div>
              <div className="text-sm text-[#6B7280] uppercase tracking-wide">{label}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Partners() {
  const partners = [
    { name: 'Ailey Beach Fit', type: 'Gym + Fitness', emoji: '🏋️' },
    { name: 'Le Shack', type: 'Scooter + Café + Storage', emoji: '🛵' },
    { name: 'Frequencies', type: 'Nomad Café + Events', emoji: '💻' },
    { name: 'Frozen Yogurt Place', type: 'Food + Deals', emoji: '🍦' },
  ]

  return (
    <section className="py-16 px-6 border-y border-[#2A2A2A]">
      <div className="max-w-4xl mx-auto">
        <p className="text-center text-sm text-[#6B7280] uppercase tracking-widest mb-8">
          Founding partners — Airlie Beach
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {partners.map((p) => (
            <div
              key={p.name}
              className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-4 text-center partner-card"
            >
              <div className="text-3xl mb-2">{p.emoji}</div>
              <div className="font-semibold text-sm text-white mb-1">{p.name}</div>
              <div className="text-xs text-[#6B7280]">{p.type}</div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function HowItWorks() {
  const steps = [
    {
      step: '01',
      title: 'Pick your plan',
      description: 'One Drift Pass membership at $7.99 per week. Cancel anytime.',
    },
    {
      step: '02',
      title: 'Open your pass',
      description: 'Your digital QR pass lives in the app. No plastic. No wallet needed.',
    },
    {
      step: '03',
      title: 'Scan and go',
      description: 'Partner staff scan your code. Credits deduct instantly. You\'re in.',
    },
    {
      step: '04',
      title: 'Drift anywhere',
      description: 'Same pass works at every DriftPass partner from Brisbane to Cairns.',
    },
  ]

  return (
    <section id="how-it-works" className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <h2 className="font-display text-4xl font-bold text-center mb-4">
          How DriftPass works
        </h2>
        <p className="text-[#9CA3AF] text-center mb-16 max-w-xl mx-auto">
          Built like ClassPass — but for every traveller need, in every town you visit.
        </p>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map(({ step, title, description }) => (
            <div key={step} className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-6">
              <div className="text-[#00FF7F] font-mono text-sm mb-4">{step}</div>
              <h3 className="font-bold text-lg mb-2">{title}</h3>
              <p className="text-[#9CA3AF] text-sm leading-relaxed">{description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

function Pricing() {
  return (
    <section id="pricing" className="py-24 px-6 bg-[#0F0F0F]">
      <div className="max-w-lg mx-auto">
        <h2 className="font-display text-4xl font-bold text-center mb-4">
          One membership. All the access.
        </h2>
        <p className="text-[#9CA3AF] text-center mb-12">
          A$7.99 per week. Cancel anytime. No lock-in.
        </p>

        <div className="relative bg-gradient-to-br from-[#E8C872] via-[#F5D78E] to-[#C9A227] rounded-3xl p-8 text-[#0D1B2A] shadow-2xl">
          <div className="absolute right-4 top-4 rounded-full bg-[#0D1B2A]/80 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-[#F5D78E]">
            ★ Popular
          </div>

          <h3 className="text-xl font-bold pr-16">{MEMBERSHIP_PLAN.name}</h3>
          <p className="mt-1 text-sm opacity-75">One membership for the traveller lifestyle</p>

          <div className="mt-6 flex items-end gap-1">
            <span className="text-5xl font-bold">$7.99</span>
            <span className="mb-1 text-lg opacity-70">/week</span>
          </div>

          <ul className="mt-6 space-y-2">
            {MEMBERSHIP_INCLUSIONS.map((f) => (
              <li key={f} className="flex items-start gap-2 text-sm">
                <span className="mt-0.5 opacity-70">✓</span>
                {f}
              </li>
            ))}
          </ul>

          <Link
            href="/pricing"
            className="mt-8 block w-full rounded-2xl bg-[#C9A227]/40 py-4 text-center text-base font-bold transition-colors hover:bg-[#C9A227]/55"
          >
            Start Membership
          </Link>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="py-12 px-6 border-t border-[#2A2A2A]">
      <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <span className="font-display text-lg font-bold">
            <span className="text-white">Drift</span>
            <span className="text-[#00FF7F]">Pass</span>
          </span>
          <p className="text-sm text-[#6B7280] mt-1">Drift further. Spend less.</p>
        </div>
        <div className="flex gap-6 text-sm text-[#6B7280]">
          <a href="mailto:hello@driftpass.com.au" className="hover:text-white transition-colors">
            hello@driftpass.com.au
          </a>
          <Link href="/privacy" className="hover:text-white transition-colors">Privacy</Link>
          <Link href="/terms" className="hover:text-white transition-colors">Terms</Link>
        </div>
      </div>
    </footer>
  )
}
