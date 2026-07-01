'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { SHOUTOUT_PLACEMENTS } from '@/lib/shoutouts/constants'
import type { FeaturedShoutoutWithPartner, ShoutoutPlacement } from '@/lib/shoutouts/types'

interface PartnerOption {
  id: string
  name: string
  slug: string
}

const EMPTY_FORM = {
  partner_id: '',
  business_name: '',
  headline: '',
  body: '',
  cta_label: 'Learn more',
  cta_href: '',
  image_url: '',
  placement: 'home' as ShoutoutPlacement,
  town_slug: 'airlie-beach',
  sort_order: 0,
  is_active: true,
}

export function AdminShoutoutsManager({ partners }: { partners: PartnerOption[] }) {
  const [rows, setRows] = useState<FeaturedShoutoutWithPartner[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/shoutouts')
      const json = (await res.json()) as { data?: FeaturedShoutoutWithPartner[]; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load')
      setRows(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load shoutouts')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  function applyPartner(partnerId: string) {
    const partner = partners.find((p) => p.id === partnerId)
    setForm((current) => ({
      ...current,
      partner_id: partnerId,
      business_name: partner?.name ?? current.business_name,
      cta_href: partner ? `/perks/${partner.slug}` : current.cta_href,
    }))
  }

  function startEdit(row: FeaturedShoutoutWithPartner) {
    setEditingId(row.id)
    setForm({
      partner_id: row.partner_id ?? '',
      business_name: row.business_name,
      headline: row.headline,
      body: row.body ?? '',
      cta_label: row.cta_label,
      cta_href: row.cta_href,
      image_url: row.image_url ?? '',
      placement: row.placement,
      town_slug: row.town_slug,
      sort_order: row.sort_order,
      is_active: row.is_active,
    })
  }

  function resetForm() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      partner_id: form.partner_id || null,
      business_name: form.business_name,
      headline: form.headline,
      body: form.body || null,
      cta_label: form.cta_label,
      cta_href: form.cta_href,
      image_url: form.image_url || null,
      placement: form.placement,
      town_slug: form.town_slug,
      sort_order: form.sort_order,
      is_active: form.is_active,
    }

    try {
      const res = await fetch(
        editingId ? `/api/admin/shoutouts/${editingId}` : '/api/admin/shoutouts',
        {
          method: editingId ? 'PATCH' : 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
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

  async function toggleActive(row: FeaturedShoutoutWithPartner) {
    await fetch(`/api/admin/shoutouts/${row.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: !row.is_active }),
    })
    await load()
  }

  async function remove(id: string) {
    if (!confirm('Delete this shoutout?')) return
    await fetch(`/api/admin/shoutouts/${id}`, { method: 'DELETE' })
    if (editingId === id) resetForm()
    await load()
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <div>
          <Link href="/admin" className="text-sm text-[#9CA3AF] hover:text-white">
            ← Admin
          </Link>
          <h1 className="mt-2 text-2xl font-bold">Featured shoutouts</h1>
          <p className="mt-1 text-sm text-[#6B7280]">
            Sell placement slots to local businesses — home, Trip Help, Explore, town guide.
          </p>
        </div>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
          {error.includes('featured_shoutouts') ? (
            <span className="block mt-1 text-xs">Run migration 017 in Supabase SQL editor.</span>
          ) : null}
        </div>
      ) : null}

      <form
        onSubmit={(e) => void handleSubmit(e)}
        className="space-y-4 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-5"
      >
        <h2 className="font-semibold">{editingId ? 'Edit shoutout' : 'New shoutout'}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Partner (optional)</span>
            <select
              className="mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2"
              value={form.partner_id}
              onChange={(e) => applyPartner(e.target.value)}
            >
              <option value="">Custom business</option>
              {partners.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Business name</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2"
              value={form.business_name}
              onChange={(e) => setForm({ ...form, business_name: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Headline</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2"
              value={form.headline}
              onChange={(e) => setForm({ ...form, headline: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Body (optional)</span>
            <textarea
              rows={2}
              className="mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2"
              value={form.body}
              onChange={(e) => setForm({ ...form, body: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">CTA label</span>
            <input
              required
              className="mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2"
              value={form.cta_label}
              onChange={(e) => setForm({ ...form, cta_label: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">CTA link</span>
            <input
              required
              placeholder="/perks/le-shack or https://..."
              className="mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2"
              value={form.cta_href}
              onChange={(e) => setForm({ ...form, cta_href: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Image URL (optional)</span>
            <input
              className="mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2"
              value={form.image_url}
              onChange={(e) => setForm({ ...form, image_url: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Placement</span>
            <select
              className="mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2"
              value={form.placement}
              onChange={(e) =>
                setForm({ ...form, placement: e.target.value as ShoutoutPlacement })
              }
            >
              {SHOUTOUT_PLACEMENTS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label} — {p.description}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Sort order (lower = first)</span>
            <input
              type="number"
              min={0}
              className="mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2"
              value={form.sort_order}
              onChange={(e) => setForm({ ...form, sort_order: Number(e.target.value) })}
            />
          </label>
        </div>

        <label className="flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.is_active}
            onChange={(e) => setForm({ ...form, is_active: e.target.checked })}
          />
          Active (visible to members)
        </label>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00FF7F] px-4 py-2 text-sm font-bold text-black disabled:opacity-60"
          >
            {saving ? 'Saving…' : editingId ? 'Update shoutout' : 'Create shoutout'}
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

      <section>
        <h2 className="font-semibold mb-3">All placements</h2>
        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : rows.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No shoutouts yet. Create one above.</p>
        ) : (
          <div className="divide-y divide-[#2A2A2A] rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            {rows.map((row) => (
              <div key={row.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
                <div>
                  <span className="font-medium">{row.business_name}</span>
                  <span className="ml-2 text-xs text-[#6B7280]">{row.placement}</span>
                  <p className="text-[#9CA3AF]">{row.headline}</p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void toggleActive(row)}
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      row.is_active ? 'bg-[#00FF7F]/10 text-[#00FF7F]' : 'bg-[#2A2A2A] text-[#6B7280]'
                    }`}
                  >
                    {row.is_active ? 'Active' : 'Paused'}
                  </button>
                  <button type="button" onClick={() => startEdit(row)} className="text-[#9CA3AF] hover:text-white">
                    Edit
                  </button>
                  <button type="button" onClick={() => void remove(row.id)} className="text-red-400 hover:text-red-300">
                    Delete
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
