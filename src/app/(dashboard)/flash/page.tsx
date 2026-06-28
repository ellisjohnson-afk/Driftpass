import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { formatAUD } from '@/lib/utils/format'
import type { FlashDeal } from '@/types'

export const dynamic = 'force-dynamic'

const PHASE = parseInt(process.env.NEXT_PUBLIC_PHASE ?? '2')

export default async function FlashPage() {
  if (PHASE < 3) {
    return <ComingSoon />
  }

  const supabase = await createClient()
  const { data: deals } = await supabase
    .from('flash_deals')
    .select(`*, partners(name, city, logo_url)`)
    .eq('is_active', true)
    .gt('seats_remaining', 0)
    .gt('expires_at', new Date().toISOString())
    .order('expires_at', { ascending: true })

  return (
    <div className="animate-fade-in space-y-4 pb-2">
      <div className="flex items-center gap-2">
        <span className="text-2xl" aria-hidden>
          ⚡
        </span>
        <div>
          <h1 className="text-xl font-bold">Flash Passes</h1>
          <p className="text-xs text-drift-text-muted">Last-minute deals · updated daily</p>
        </div>
      </div>

      {!deals || deals.length === 0 ? (
        <div className="rounded-2xl border border-drift-border/60 bg-drift-navy-light px-6 py-10 text-center">
          <div className="mb-3 text-4xl" aria-hidden>
            ⚡
          </div>
          <p className="text-sm text-drift-text-muted">No flash deals right now</p>
          <p className="mt-1 text-sm text-drift-text-subtle">
            Check back tonight — deals drop at 6pm
          </p>
          <Link
            href="/town/airlie-beach"
            className="mt-4 inline-flex text-sm font-semibold text-drift-gold-mid hover:text-white"
          >
            ← Back to Airlie Beach guide
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {deals.map((deal) => (
            <FlashDealCard key={deal.id} deal={deal as unknown as FlashDeal} />
          ))}
        </div>
      )}
    </div>
  )
}

function FlashDealCard({ deal }: { deal: FlashDeal }) {
  const discount = Math.round(
    ((deal.original_price_aud_cents - deal.subscriber_price_aud_cents) /
      deal.original_price_aud_cents) *
      100
  )

  const expiresAt = new Date(deal.expires_at)
  const hoursLeft = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60 * 60))
  const minutesLeft = Math.floor((expiresAt.getTime() - Date.now()) / (1000 * 60)) % 60

  const partner = deal.partner as { name?: string; city?: string } | undefined

  return (
    <div className="rounded-2xl border border-orange-500/40 bg-drift-navy-light p-5">
      <div className="mb-3 flex items-start justify-between">
        <div>
          <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-orange-400">
            ⚡ Flash Deal
          </div>
          <h3 className="font-bold text-white">{deal.title}</h3>
          <p className="text-sm text-drift-text-muted">
            {partner?.name} · {partner?.city}
          </p>
        </div>
        <div className="rounded-full bg-orange-500 px-3 py-1 text-sm font-bold text-white">
          -{discount}%
        </div>
      </div>

      <p className="mb-4 text-sm text-drift-text-muted">{deal.description}</p>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">
              {formatAUD(deal.subscriber_price_aud_cents)}
            </span>
            <span className="text-sm text-drift-text-subtle line-through">
              {formatAUD(deal.original_price_aud_cents)}
            </span>
          </div>
          <div className="mt-0.5 text-xs text-drift-text-muted">
            {deal.seats_remaining} seat{deal.seats_remaining !== 1 ? 's' : ''} left
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-drift-text-muted">Expires in</div>
          <div className="flash-pulse font-mono text-sm font-bold text-orange-400">
            {hoursLeft > 0 ? `${hoursLeft}h ` : ''}
            {minutesLeft}m
          </div>
        </div>
      </div>

      <button
        type="button"
        className="mt-4 w-full rounded-2xl bg-orange-500 py-3 font-bold text-white transition-colors hover:bg-orange-600"
      >
        Book Now
      </button>
    </div>
  )
}

function ComingSoon() {
  return (
    <div className="flex min-h-[60vh] animate-fade-in flex-col items-center justify-center px-4 text-center">
      <div className="mb-4 text-5xl" aria-hidden>
        ⚡
      </div>
      <h1 className="mb-2 text-2xl font-bold">Flash Passes</h1>
      <p className="max-w-xs text-drift-text-muted">
        Last-minute tour seats at member prices. Launching soon — check the Airlie Beach guide for
        tour highlights in the meantime.
      </p>
      <Link
        href="/town/airlie-beach"
        className="mt-6 rounded-2xl bg-drift-gold-gradient px-5 py-2.5 text-sm font-bold text-drift-navy-deep"
      >
        Airlie Beach guide
      </Link>
    </div>
  )
}
