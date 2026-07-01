'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { OrderProductType, OrderVoucherStatus } from '@/lib/orders/types'
import type { PartnerSalesSummary } from '@/lib/orders/partner-sales-report'
import type { AdminOrderRow } from '@/lib/orders/admin-orders'

const STATUS_OPTIONS: Array<{ value: OrderVoucherStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  { value: 'paid', label: 'Paid (awaiting pickup)' },
  { value: 'collected', label: 'Collected' },
  { value: 'pending', label: 'Pending' },
  { value: 'expired', label: 'Expired' },
  { value: 'refunded', label: 'Refunded' },
  { value: 'canceled', label: 'Canceled' },
]

const PRODUCT_OPTIONS: Array<{ value: OrderProductType | 'all'; label: string }> = [
  { value: 'all', label: 'All products' },
  { value: 'trip_help', label: 'Trip Help utilities' },
  { value: 'marketplace', label: 'Marketplace / tours' },
]

function formatAud(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(cents / 100)
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function statusClass(status: OrderVoucherStatus) {
  switch (status) {
    case 'collected':
      return 'bg-[#00FF7F]/10 text-[#00FF7F]'
    case 'paid':
      return 'bg-[#FF6B35]/10 text-[#FF6B35]'
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400'
    case 'expired':
    case 'canceled':
    case 'refunded':
      return 'bg-[#2A2A2A] text-[#6B7280]'
    default:
      return 'bg-[#2A2A2A] text-[#6B7280]'
  }
}

export function AdminTripHelpOrdersManager() {
  const [orders, setOrders] = useState<AdminOrderRow[]>([])
  const [summaries, setSummaries] = useState<PartnerSalesSummary[]>([])
  const [statusFilter, setStatusFilter] = useState<OrderVoucherStatus | 'all'>('all')
  const [productFilter, setProductFilter] = useState<OrderProductType | 'all'>('all')
  const [partnerFilter, setPartnerFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [recoverSessionId, setRecoverSessionId] = useState('')
  const [recovering, setRecovering] = useState(false)
  const [recoverMessage, setRecoverMessage] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (statusFilter !== 'all') params.set('status', statusFilter)
      if (productFilter !== 'all') params.set('productType', productFilter)
      if (partnerFilter !== 'all') params.set('partner', partnerFilter)

      const res = await fetch(`/api/admin/orders?${params.toString()}`)
      const json = (await res.json()) as {
        data?: { orders: AdminOrderRow[]; summaries: PartnerSalesSummary[] }
        error?: string
      }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load orders')
      setOrders(json.data?.orders ?? [])
      setSummaries(json.data?.summaries ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders')
    } finally {
      setLoading(false)
    }
  }, [partnerFilter, productFilter, statusFilter])

  useEffect(() => {
    void load()
  }, [load])

  const partnerOptions = useMemo(() => {
    const slugs = new Map<string, string>()
    for (const order of orders) {
      if (order.partner) slugs.set(order.partner.slug, order.partner.name)
    }
    return Array.from(slugs.entries()).sort((a, b) => a[1].localeCompare(b[1]))
  }, [orders])

  const filteredOrders = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    if (!normalized) return orders
    return orders.filter((order) => {
      const haystack = [
        order.product_name,
        order.product_slug,
        order.partner?.name,
        order.partner?.slug,
        order.member?.email,
        order.member?.full_name,
        order.collection_pin,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
      return haystack.includes(normalized)
    })
  }, [orders, query])

  const totalPayable = summaries.reduce((sum, row) => sum + row.payableAudCents, 0)

  async function markCollected(orderId: string) {
    if (!confirm('Mark this order as collected? Use when the partner has fulfilled the service.')) {
      return
    }

    setSavingId(orderId)
    setError(null)
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'mark_collected' }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Update failed')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSavingId(null)
    }
  }

  async function recoverCheckout(e: React.FormEvent) {
    e.preventDefault()
    setRecovering(true)
    setRecoverMessage(null)
    setError(null)
    try {
      const res = await fetch('/api/admin/orders/fulfill', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId: recoverSessionId.trim() }),
      })
      const json = (await res.json()) as { data?: { product_name?: string }; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Recovery failed')
      setRecoverMessage(`Recovered: ${json.data?.product_name ?? 'order'}`)
      setRecoverSessionId('')
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Recovery failed')
    } finally {
      setRecovering(false)
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Trip Help orders</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Paid upsells and marketplace bookings — pay partners when status is collected.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {recoverMessage ? (
        <div className="rounded-xl border border-[#00FF7F]/30 bg-[#00FF7F]/10 px-4 py-3 text-sm text-[#00FF7F]">
          {recoverMessage}
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex items-baseline justify-between gap-3">
          <h2 className="font-semibold">Partner payouts</h2>
          <span className="text-sm font-medium text-[#00FF7F]">{formatAud(totalPayable)} payable</span>
        </div>
        {summaries.length === 0 ? (
          <div className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] px-4 py-6 text-sm text-[#6B7280]">
            No partner orders yet.
          </div>
        ) : (
          <div className="divide-y divide-[#2A2A2A] rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            {summaries.map((summary) => (
              <div
                key={summary.partnerSlug}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <span className="font-medium">{summary.partnerName}</span>
                  <span className="ml-2 text-[#6B7280]">
                    {summary.collectedCount}/{summary.orderCount} collected
                  </span>
                </div>
                <div className="text-right">
                  <div className="font-medium text-[#00FF7F]">{formatAud(summary.payableAudCents)}</div>
                  <div className="text-xs text-[#6B7280]">{formatAud(summary.grossAudCents)} gross</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      <form
        onSubmit={(e) => void recoverCheckout(e)}
        className="space-y-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5"
      >
        <h2 className="font-semibold">Recover paid checkout</h2>
        <p className="text-sm text-[#6B7280]">
          If Stripe charged but no order appeared, paste the Checkout Session ID (
          <code className="text-[#9CA3AF]">cs_...</code>).
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            className="flex-1 rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm"
            placeholder="cs_test_..."
            value={recoverSessionId}
            onChange={(e) => setRecoverSessionId(e.target.value)}
          />
          <button
            type="submit"
            disabled={recovering || !recoverSessionId.trim().startsWith('cs_')}
            className="rounded-lg bg-[#00FF7F] px-4 py-2 text-sm font-bold text-black disabled:opacity-60"
          >
            {recovering ? 'Recovering…' : 'Recover order'}
          </button>
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Orders ({filteredOrders.length})</h2>
          <div className="flex flex-wrap gap-2">
            <select
              className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as OrderVoucherStatus | 'all')}
            >
              {STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm"
              value={productFilter}
              onChange={(e) => setProductFilter(e.target.value as OrderProductType | 'all')}
            >
              {PRODUCT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <select
              className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm"
              value={partnerFilter}
              onChange={(e) => setPartnerFilter(e.target.value)}
            >
              <option value="all">All partners</option>
              {partnerOptions.map(([slug, name]) => (
                <option key={slug} value={slug}>
                  {name}
                </option>
              ))}
            </select>
            <input
              type="search"
              placeholder="Search…"
              className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : filteredOrders.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No orders match your filters.</p>
        ) : (
          <div className="divide-y divide-[#2A2A2A] rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            {filteredOrders.map((order) => (
              <div key={order.id} className="space-y-3 px-4 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{order.product_name}</span>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${statusClass(order.status)}`}>
                        {order.status}
                      </span>
                      <span className="text-xs text-[#6B7280]">
                        {order.product_type === 'marketplace' ? 'Marketplace' : 'Trip Help'}
                      </span>
                    </div>
                    <p className="mt-1 text-[#9CA3AF]">
                      {order.partner?.name ?? 'Unknown partner'} ·{' '}
                      {order.member?.full_name ?? order.member?.email ?? 'Member'}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{formatAud(order.amount_aud_cents)}</div>
                    <div className="text-xs text-[#6B7280]">
                      partner {formatAud(order.partner_payout_cents)}
                    </div>
                  </div>
                </div>

                <dl className="grid gap-2 text-xs text-[#9CA3AF] sm:grid-cols-2">
                  <div>
                    <dt className="text-[#6B7280]">Ordered</dt>
                    <dd>{formatWhen(order.created_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280]">Expires</dt>
                    <dd>{formatWhen(order.expires_at)}</dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280]">Collection PIN</dt>
                    <dd className="font-mono text-white">{order.collection_pin}</dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280]">Member email</dt>
                    <dd>{order.member?.email ?? '—'}</dd>
                  </div>
                  {order.collected_at ? (
                    <div>
                      <dt className="text-[#6B7280]">Collected</dt>
                      <dd>{formatWhen(order.collected_at)}</dd>
                    </div>
                  ) : null}
                  {order.stripe_checkout_session_id ? (
                    <div className="sm:col-span-2">
                      <dt className="text-[#6B7280]">Stripe session</dt>
                      <dd className="break-all font-mono text-[11px]">{order.stripe_checkout_session_id}</dd>
                    </div>
                  ) : null}
                </dl>

                {order.status === 'paid' ? (
                  <button
                    type="button"
                    disabled={savingId === order.id}
                    onClick={() => void markCollected(order.id)}
                    className="rounded-lg border border-[#00FF7F]/40 px-3 py-1.5 text-xs font-semibold text-[#00FF7F] hover:bg-[#00FF7F]/10 disabled:opacity-60"
                  >
                    {savingId === order.id ? 'Saving…' : 'Mark collected'}
                  </button>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
