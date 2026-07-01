'use client'

import Link from 'next/link'
import { useCallback, useEffect, useMemo, useState } from 'react'
import type { PartnerCategory } from '@/types'
import type { AdminPartnerRow } from '@/lib/partners/admin-fetch'
import { formatPartnerCategory, PARTNER_CATEGORIES } from '@/lib/partners/categories'
import { AdminPartnerOnboardingPanel } from '@/components/admin/AdminPartnerOnboardingPanel'

function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

const EMPTY_FORM = {
  name: '',
  slug: '',
  description: '',
  category: 'restaurant' as PartnerCategory,
  address: '',
  city: 'Airlie Beach',
  state: 'QLD',
  phone: '',
  email: '',
  website: '',
  lat: '',
  lng: '',
  is_active: true,
  is_verified: false,
  is_featured: false,
}

const inputClassName =
  'mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-white'

export function AdminPartnersManager() {
  const [rows, setRows] = useState<AdminPartnerRow[]>([])
  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [onboardingId, setOnboardingId] = useState<string | null>(null)
  const [slugTouched, setSlugTouched] = useState(false)
  const [query, setQuery] = useState('')
  const [showInactive, setShowInactive] = useState(true)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/admin/partners')
      const json = (await res.json()) as { data?: AdminPartnerRow[]; error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load')
      setRows(json.data ?? [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load partners')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const filteredRows = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    return rows.filter((row) => {
      if (!showInactive && !row.is_active) return false
      if (!normalized) return true
      return (
        row.name.toLowerCase().includes(normalized) ||
        row.slug.toLowerCase().includes(normalized) ||
        row.city.toLowerCase().includes(normalized) ||
        row.category.toLowerCase().includes(normalized)
      )
    })
  }, [query, rows, showInactive])

  function startEdit(row: AdminPartnerRow) {
    setOnboardingId(null)
    setEditingId(row.id)
    setSlugTouched(true)
    setForm({
      name: row.name,
      slug: row.slug,
      description: row.description ?? '',
      category: row.category as PartnerCategory,
      address: row.address,
      city: row.city,
      state: row.state,
      phone: row.phone ?? '',
      email: row.email ?? '',
      website: row.website ?? '',
      lat: row.lat?.toString() ?? '',
      lng: row.lng?.toString() ?? '',
      is_active: row.is_active,
      is_verified: row.is_verified,
      is_featured: row.is_featured,
    })
  }

  function startOnboarding(row: AdminPartnerRow) {
    setEditingId(null)
    setOnboardingId(row.id)
    setSlugTouched(false)
    setForm(EMPTY_FORM)
  }

  function resetForm() {
    setEditingId(null)
    setOnboardingId(null)
    setSlugTouched(false)
    setForm(EMPTY_FORM)
  }

  function updateName(name: string) {
    setForm((current) => ({
      ...current,
      name,
      slug: !slugTouched && !editingId ? slugifyName(name) : current.slug,
    }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    const payload = {
      name: form.name,
      slug: form.slug,
      description: form.description || null,
      category: form.category,
      address: form.address,
      city: form.city,
      state: form.state,
      phone: form.phone || null,
      email: form.email || null,
      website: form.website || null,
      lat: form.lat === '' ? null : Number(form.lat),
      lng: form.lng === '' ? null : Number(form.lng),
      is_active: form.is_active,
      is_verified: form.is_verified,
      is_featured: form.is_featured,
    }

    try {
      const res = await fetch(editingId ? `/api/admin/partners/${editingId}` : '/api/admin/partners', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
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

  async function patchPartner(id: string, updates: Record<string, boolean>) {
    await fetch(`/api/admin/partners/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    await load()
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Partners</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Add businesses, configure services & payouts, and launch them on Trip Help.
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
        <h2 className="font-semibold">{editingId ? 'Edit partner' : 'New partner'}</h2>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Business name</span>
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
            <span className="text-[#9CA3AF]">Category</span>
            <select
              className={inputClassName}
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as PartnerCategory })}
            >
              {PARTNER_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {formatPartnerCategory(category)}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">City</span>
            <input
              required
              className={inputClassName}
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Address</span>
            <input
              required
              className={inputClassName}
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Description (optional)</span>
            <textarea
              rows={2}
              className={inputClassName}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Phone (optional)</span>
            <input
              className={inputClassName}
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Email (optional)</span>
            <input
              type="email"
              className={inputClassName}
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </label>

          <label className="block text-sm sm:col-span-2">
            <span className="text-[#9CA3AF]">Website (optional)</span>
            <input
              className={inputClassName}
              value={form.website}
              onChange={(e) => setForm({ ...form, website: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Latitude (optional)</span>
            <input
              type="number"
              step="any"
              className={inputClassName}
              value={form.lat}
              onChange={(e) => setForm({ ...form, lat: e.target.value })}
            />
          </label>

          <label className="block text-sm">
            <span className="text-[#9CA3AF]">Longitude (optional)</span>
            <input
              type="number"
              step="any"
              className={inputClassName}
              value={form.lng}
              onChange={(e) => setForm({ ...form, lng: e.target.value })}
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
              checked={form.is_verified}
              onChange={(e) => setForm({ ...form, is_verified: e.target.checked })}
            />
            Verified
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.is_featured}
              onChange={(e) => setForm({ ...form, is_featured: e.target.checked })}
            />
            Featured
          </label>
        </div>

        <div className="flex gap-3">
          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00FF7F] px-4 py-2 text-sm font-bold text-black disabled:opacity-60"
          >
            {saving ? 'Saving…' : editingId ? 'Update partner' : 'Create partner'}
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

      {onboardingId ? (
        <AdminPartnerOnboardingPanel
          partnerId={onboardingId}
          partnerName={rows.find((row) => row.id === onboardingId)?.name ?? 'Partner'}
          partnerSlug={rows.find((row) => row.id === onboardingId)?.slug ?? ''}
        />
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">All partners ({filteredRows.length})</h2>
          <div className="flex flex-wrap items-center gap-3">
            <input
              type="search"
              placeholder="Search name, slug, city…"
              className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <label className="flex items-center gap-2 text-sm text-[#9CA3AF]">
              <input
                type="checkbox"
                checked={showInactive}
                onChange={(e) => setShowInactive(e.target.checked)}
              />
              Show inactive
            </label>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : filteredRows.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No partners match your filters.</p>
        ) : (
          <div className="divide-y divide-[#2A2A2A] rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            {filteredRows.map((row) => {
              const activeServices = row.partner_services?.filter((service) => service.is_active).length ?? 0
              return (
                <div
                  key={row.id}
                  className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
                >
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{row.name}</span>
                      <span className="text-xs text-[#6B7280]">{formatPartnerCategory(row.category)}</span>
                      {row.is_featured ? (
                        <span className="rounded-full bg-[#FF6B35]/10 px-2 py-0.5 text-xs text-[#FF6B35]">
                          Featured
                        </span>
                      ) : null}
                      {row.is_verified ? (
                        <span className="rounded-full bg-[#00FF7F]/10 px-2 py-0.5 text-xs text-[#00FF7F]">
                          Verified
                        </span>
                      ) : null}
                    </div>
                    <p className="text-[#9CA3AF]">
                      {row.city} · {row.slug} · {activeServices} active service
                      {activeServices === 1 ? '' : 's'}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      type="button"
                      onClick={() => void patchPartner(row.id, { is_active: !row.is_active })}
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
                      onClick={() => startOnboarding(row)}
                      className="rounded-lg border border-[#FF6B35]/40 px-2 py-1 text-xs font-semibold text-[#FF6B35] hover:bg-[#FF6B35]/10"
                    >
                      Onboard
                    </button>
                    <Link
                      href={`/perks/${row.slug}`}
                      className="text-[#9CA3AF] hover:text-white"
                      target="_blank"
                    >
                      View
                    </Link>
                    <button
                      type="button"
                      onClick={() => startEdit(row)}
                      className="text-[#9CA3AF] hover:text-white"
                    >
                      Edit
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </section>
    </div>
  )
}
