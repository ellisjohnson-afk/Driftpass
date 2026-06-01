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
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center gap-2">
        <span className="text-2xl">⚡</span>
        <div>
          <h1 className="text-xl font-bold">Flash Passes</h1>
          <p className="text-xs text-[#6B7280]">Last-minute deals · updated daily</p>
        </div>
      </div>

      {(!deals || deals.length === 0) ? (
        <div className="bg-[#1A1A1A] border border-[#2A2A2A] rounded-xl p-8 text-center">
          <div className="text-4xl mb-3">⚡</div>
          <p className="text-[#9CA3AF]">No flash deals right now</p>
          <p className="text-sm text-[#6B7280] mt-1">Check back tonight — deals drop at 6pm</p>
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
  const now = new Date()
  const hoursLeft = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60))
  const minutesLeft = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60)) % 60

  const partner = deal.partner as { name?: string; city?: string } | undefined

  return (
    <div className="bg-[#1A1A1A] border border-[#FF6B35]/40 rounded-xl p-5">
      <div className="flex items-start justify-between mb-3">
        <div>
          <div className="text-xs text-[#FF6B35] font-semibold uppercase tracking-wide mb-1">
            ⚡ Flash Deal
          </div>
          <h3 className="font-bold">{deal.title}</h3>
          <p className="text-sm text-[#9CA3AF]">{partner?.name} · {partner?.city}</p>
        </div>
        <div className="bg-[#FF6B35] text-white text-sm font-bold px-3 py-1 rounded-full">
          -{discount}%
        </div>
      </div>

      <p className="text-sm text-[#9CA3AF] mb-4">{deal.description}</p>

      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-white">
              {formatAUD(deal.subscriber_price_aud_cents)}
            </span>
            <span className="text-sm text-[#6B7280] line-through">
              {formatAUD(deal.original_price_aud_cents)}
            </span>
          </div>
          <div className="text-xs text-[#6B7280] mt-0.5">
            {deal.seats_remaining} seat{deal.seats_remaining !== 1 ? 's' : ''} left
          </div>
        </div>

        <div className="text-right">
          <div className="text-xs text-[#6B7280]">Expires in</div>
          <div className="text-sm font-mono text-[#FF6B35] font-bold flash-pulse">
            {hoursLeft > 0 ? `${hoursLeft}h ` : ''}{minutesLeft}m
          </div>
        </div>
      </div>

      <button className="w-full mt-4 bg-[#FF6B35] text-white py-3 rounded-lg font-bold hover:bg-[#E55A25] transition-colors">
        Book Now
      </button>
    </div>
  )
}

function ComingSoon() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4 animate-fade-in">
      <div className="text-5xl mb-4">⚡</div>
      <h1 className="text-2xl font-bold mb-2">Flash Passes</h1>
      <p className="text-[#9CA3AF] max-w-xs">
        Last-minute tour seats at 10% off. Launching in Phase 3 — coming soon.
      </p>
    </div>
  )
}
