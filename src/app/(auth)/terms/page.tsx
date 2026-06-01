import Link from 'next/link'

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0A0A0A] px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <Link href="/signup" className="text-sm text-[#9CA3AF] hover:text-[#00FF7F] transition-colors">
          ← Back to signup
        </Link>

        <h1 className="font-display text-3xl font-bold text-white mt-8 mb-2">Terms of Service</h1>
        <p className="text-[#9CA3AF] text-sm mb-10">Last updated: June 2026</p>

        <div className="space-y-6 text-[#D1D5DB] text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-semibold mb-2">1. DriftPass membership</h2>
            <p>
              DriftPass is a fortnightly subscription service that provides members with a credit allowance
              redeemable at participating partner businesses in regional Australia. Credits refresh each
              billing period and do not roll over unless stated otherwise.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">2. Billing</h2>
            <p>
              Subscriptions are billed every two weeks via Stripe. You may cancel at any time through your
              account page; access continues until the end of the current billing period.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">3. Redemptions</h2>
            <p>
              Credits are deducted when a partner accepts your pass at point of redemption. Your rotating
              6-digit PIN is valid for 60 seconds and must be presented at the partner terminal. Credits
              cannot be transferred, refunded for cash, or redeemed outside the DriftPass partner network.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">4. Partner services</h2>
            <p>
              Partner availability, service offerings, and credit costs may change. DriftPass is not
              responsible for partner service quality or availability beyond the credit redemption system.
            </p>
          </section>

          <section>
            <h2 className="text-white font-semibold mb-2">5. Contact</h2>
            <p>
              Questions? Email{' '}
              <a href="mailto:hello@driftpass.com.au" className="text-[#00FF7F] hover:underline">
                hello@driftpass.com.au
              </a>
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
