'use client'

import { useCallback, useEffect, useMemo, useState } from 'react'
import type { TripHelpProductWithPartner } from '@/lib/trip-help/product-types'

interface PartnerOption {
  id: string
  name: string
  slug: string
}

const EMPTY_FORM = {
  product_type: 'trip_help' as 'trip_help' | 'marketplace',
  section: 'utilities' as 'utilities' | 'marketplace',
  slug: '',
  name: '',
  short_label: '',
  tagline: '',
  description: '',
  features: '',
  partner_id: '',
  service_type: '',
  price_aud: '',
  expiry_hours: '24',
  price_label: '',
  price_subtext: '',
  hours_label: '',
  meeting_note: '',
  emoji: '',
  hub_slug: '',
  sort_order: '0',
  is_active: true,
  is_purchasable: true,
}

const inputClassName =
  'mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-white'

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function formatAud(cents: number | null) {
  if (cents == null) return '—'
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function centsToDollarsInput(cents: number | null): string {
  if (cents == null) return ''
  return (cents / 100).toFixed(2).replace(/\.00$/, '')
}

export function AdminTripHelpProductsManager({ partners }: { partners: PartnerOption[] }) {
  const [rows, setRows] = useState<TripHelpProductWithPartner[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [filter, setFilter] = useState<'all' | 'utilities' | 'marketplace'>('all')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/trip-help-products')
      const json = (await res.json()) as { data?: TripHelpProductWithPartner[]; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load products')
      setRows(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load products')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredRows = useMemo(() => {
    if (filter === 'all') return rows
    return rows.filter((row) => row.section === filter)
  }, [filter, rows])

  function startEdit(row: TripHelpProductWithPartner) {
    setEditingId(row.id)
    setSlugTouched(true)
    setForm({
      product_type: row.product_type,
      section: row.section,
      slug: row.slug,
      name: row.name,
      short_label: row.short_label ?? '',
      tagline: row.tagline ?? '',
      description: row.description,
      features: (row.features ?? []).join('\n'),
      partner_id: row.partner_id ?? '',
      service_type: row.service_type ?? '',
      price_aud: centsToDollarsInput(row.price_aud_cents),
      expiry_hours: String(row.expiry_hours),
      price_label: row.price_label,
      price_subtext: row.price_subtext ?? '',
      hours_label: row.hours_label ?? '',
      meeting_note: row.meeting_note ?? '',
      emoji: row.emoji ?? '',
      hub_slug: row.hub_slug ?? '',
      sort_order: String(row.sort_order),
      is_active: row.is_active,
      is_purchasable: row.is_purchasable,
    })
  }

  function resetForm() {
    setEditingId(null)
    setSlugTouched(false)
    setForm(EMPTY_FORM)
  }

  function updateName(name: string) {
    setForm((current) => ({
      ...current,
      name,
      slug: !slugTouched && !editingId ? slugifyName(name) : current.slug,
      price_label:
        !slugTouched && !editingId && current.price_aud
          ? `$${current.price_aud}`
          : current.price_label,
    }))
  }

  function buildPayload() {
    const priceAud = form.price_aud.trim()
    const priceAudCents =
      priceAud === '' ? null : Math.round(Number.parseFloat(priceAud) * 100)

    return {
      product_type: form.product_type,
      section: form.section,
      slug: form.slug,
      name: form.name,
      short_label: form.short_label || null,
      tagline: form.tagline || null,
      description: form.description,
      features: form.features,
      partner_id: form.partner_id || null,
      service_type: form.service_type || null,
      price_aud_cents: priceAudCents,
      expiry_hours: Number(form.expiry_hours) || 0,
      price_label: form.price_label,
      price_subtext: form.price_subtext || null,
      hours_label: form.hours_label || null,
      meeting_note: form.meeting_note || null,
      emoji: form.emoji || null,
      hub_slug: form.hub_slug || null,
      sort_order: Number(form.sort_order) || 0,
      is_active: form.is_active,
      is_purchasable: form.is_purchasable,
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(
        editingId ? `/api/admin/trip-help-products/${editingId}` : '/api/admin/trip-help-products',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload()),
        }
      )
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Save failed')
      resetForm()
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  async function patchProduct(id: string, updates: Record<string, boolean>) {
    await fetch(`/api/admin/trip-help-products/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    await load()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Trip Help products</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Set member prices, copy, and partner links — changes apply at checkout after save.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5"
      >
        <h2 className="font-semibold">{editingId ? 'Edit product' : 'New product'}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Section</span>
            <select
              className={inputClassName}
              value={form.section}
              onChange={(e) => {
                const section = e.target.value as 'utilities' | 'marketplace'
                setForm({
                  ...form,
                  section,
                  product_type: section === 'utilities' ? 'trip_help' : 'marketplace',
                })
              }}
            >
              <option value="utilities">Utilities grid</option>
              <option value="marketplace">Marketplace list</option>
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Partner</span>
            <select
              className={inputClassName}
              value={form.partner_id}
              onChange={(e) => setForm({ ...form, partner_id: e.target.value })}
            >
              <option value="">None (hub / browse only)</option>
              {partners.map((partner) => (
                <option key={partner.id} value={partner.id}>
                  {partner.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Name</span>
            <input
              required
              className={inputClassName}
              value={form.name}
              onChange={(e) => updateName(e.target.value)}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Slug</span>
            <input
              required
              pattern="[a-z0-9-]+"
              className={inputClassName}
              value={form.slug}
              onChange={(e) => {
                setSlugTouched(true)
                setForm({ ...form, slug: e.target.value })
              }}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Short label (grid)</span>
            <input
              className={inputClassName}
              value={form.short_label}
              onChange={(e) => setForm({ ...form, short_label: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Service type (payout link)</span>
            <input
              className={inputClassName}
              placeholder="shower, laundry, tour_reef_day…"
              value={form.service_type}
              onChange={(e) => setForm({ ...form, service_type: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Member price (AUD)</span>
            <input
              type="number"
              min="0"
              step="0.01"
              className={inputClassName}
              placeholder="5.00"
              value={form.price_aud}
              onChange={(e) => {
                const price_aud = e.target.value
                setForm((current) => ({
                  ...current,
                  price_aud,
                  price_label: price_aud ? `$${price_aud}` : current.price_label,
                }))
              }}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Display price label</span>
            <input
              required
              className={inputClassName}
              placeholder="$5"
              value={form.price_label}
              onChange={(e) => setForm({ ...form, price_label: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Price subtext</span>
            <input
              className={inputClassName}
              placeholder="per shower"
              value={form.price_subtext}
              onChange={(e) => setForm({ ...form, price_subtext: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">PIN expiry (hours)</span>
            <input
              type="number"
              min="0"
              className={inputClassName}
              value={form.expiry_hours}
              onChange={(e) => setForm({ ...form, expiry_hours: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Sort order</span>
            <input
              type="number"
              min="0"
              className={inputClassName}
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Tagline</span>
            <input
              className={inputClassName}
              value={form.tagline}
              onChange={(e) => setForm({ ...form, tagline: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Description</span>
            <textarea
              rows={3}
              className={inputClassName}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Features (one per line)</span>
            <textarea
              rows={3}
              className={inputClassName}
              value={form.features}
              onChange={(e) => setForm({ ...form, features: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Hours label</span>
            <input
              className={inputClassName}
              value={form.hours_label}
              onChange={(e) => setForm({ ...form, hours_label: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Emoji (marketplace)</span>
            <input
              className={inputClassName}
              value={form.emoji}
              onChange={(e) => setForm({ ...form, emoji: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Hub slug (tours under a hub)</span>
            <input
              className={inputClassName}
              placeholder="tours-experiences"
              value={form.hub_slug}
              onChange={(e) => setForm({ ...form, hub_slug: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Meeting note (tours)</span>
            <input
              className={inputClassName}
              value={form.meeting_note}
              onChange={(e) => setForm({ ...form, meeting_note: e.target.value })}
            />
          </label>
        </div>

        <div className="flex flex-wrap gap-4 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
            />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_purchasable}
              onChange={(e) => setForm({ ...form, is_purchasable: e.target.checked })}
            />
            Purchasable at checkout
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00FF7F] px-4 py-2 text-sm font-bold text-black disabled:opacity-60"
          >
            {saving ? 'Saving…' : editingId ? 'Update product' : 'Create product'}
          </button>
          {editingId ? (
            <button
              type="button"
              onClick={resetForm}
              className="rounded-lg border border-[#2A2A2A] px-4 py-2 text-sm"
            >
              Cancel
            </button>
          ) : null}
        </div>
      </form>

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">All products ({filteredRows.length})</h2>
          <select
            className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm"
            value={filter}
            onChange={(e) => setFilter(e.target.value as typeof filter)}
          >
            <option value="all">All sections</option>
            <option value="utilities">Utilities</option>
            <option value="marketplace">Marketplace</option>
          </select>
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No products yet.</p>
        ) : (
          <div className="divide-y divide-[#2A2A2A] rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            {filteredRows.map((row) => (
              <div
                key={row.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-medium">{row.name}</span>
                    <span className="text-xs text-[#6B7280]">{row.section}</span>
                    {row.is_purchasable ? (
                      <span className="rounded-full bg-[#00FF7F]/10 px-2 py-0.5 text-xs text-[#00FF7F]">
                        {formatAud(row.price_aud_cents)}
                      </span>
                    ) : (
                      <span className="rounded-full bg-[#2A2A2A] px-2 py-0.5 text-xs text-[#6B7280]">
                        Browse only
                      </span>
                    )}
                  </div>
                  <p className="text-[#9CA3AF]">
                    {row.partners?.name ?? 'No partner'} · {row.slug}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void patchProduct(row.id, { is_active: !row.is_active })}
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      row.is_active
                        ? 'bg-[#00FF7F]/10 text-[#00FF7F]'
                        : 'bg-[#2A2A2A] text-[#6B7280]'
                    }`}
                  >
                    {row.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() => startEdit(row)}
                    className="text-[#9CA3AF] hover:text-white"
                  >
                    Edit
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
