'use client'

import Link from 'next/link'
import { useCallback, useEffect, useState } from 'react'
import { SERVICE_BY_TYPE, SERVICES } from '@/constants/services'
import type { PartnerOnboardingChecklist } from '@/lib/partners/onboarding-status'

export interface AdminPartnerServiceRow {
  id: string
  service_type: string
  name: string
  credit_cost: number
  aud_payout_cents: number
  max_daily_redemptions: number | null
  is_active: boolean
}

const EMPTY_SERVICE = {
  service_type: 'shower',
  name: 'Shower Access',
  credit_cost: '5',
  aud_payout_cents: '400',
  max_daily_redemptions: '',
  is_active: true,
}

const inputClassName =
  'mt-1 w-full rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm text-white'

function formatAud(cents: number) {
  return new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

function ChecklistItem({ done, label, detail }: { done: boolean; label: string; detail?: string }) {
  return (
    <li className="flex gap-3 text-sm">
      <span
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
          done ? 'bg-[#00FF7F]/15 text-[#00FF7F]' : 'bg-[#2A2A2A] text-[#6B7280]'
        }`}
        aria-hidden
      >
        {done ? '✓' : '·'}
      </span>
      <div>
        <div className={done ? 'text-white' : 'text-[#9CA3AF]'}>{label}</div>
        {detail ? <p className="mt-0.5 text-xs text-[#6B7280]">{detail}</p> : null}
      </div>
    </li>
  )
}

export function AdminPartnerOnboardingPanel({
  partnerId,
  partnerName,
  partnerSlug,
}: {
  partnerId: string
  partnerName: string
  partnerSlug: string
}) {
  const [services, setServices] = useState<AdminPartnerServiceRow[]>([])
  const [checklist, setChecklist] = useState<PartnerOnboardingChecklist | null>(null)
  const [form, setForm] = useState(EMPTY_SERVICE)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const [servicesRes, checklistRes] = await Promise.all([
        fetch(`/api/admin/partners/${partnerId}/services`),
        fetch(`/api/admin/partners/${partnerId}/onboarding`),
      ])

      const servicesJson = (await servicesRes.json()) as {
        data?: AdminPartnerServiceRow[]
        error?: string
      }
      const checklistJson = (await checklistRes.json()) as {
        data?: PartnerOnboardingChecklist
        error?: string
      }

      if (!servicesRes.ok) throw new Error(servicesJson.error ?? 'Failed to load services')
      if (!checklistRes.ok) throw new Error(checklistJson.error ?? 'Failed to load checklist')

      setServices(servicesJson.data ?? [])
      setChecklist(checklistJson.data ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load onboarding data')
    } finally {
      setLoading(false)
    }
  }, [partnerId])

  useEffect(() => {
    void load()
  }, [load])

  function applyServicePreset(serviceType: string) {
    const preset = SERVICE_BY_TYPE[serviceType]
    if (!preset) {
      setForm((current) => ({ ...current, service_type: serviceType }))
      return
    }

    setForm({
      service_type: preset.type,
      name: preset.name,
      credit_cost: String(preset.credit_cost),
      aud_payout_cents: String(preset.aud_payout_cents),
      max_daily_redemptions: preset.period_cap ? String(preset.period_cap) : '',
      is_active: true,
    })
  }

  async function createService(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    setError(null)

    try {
      const res = await fetch(`/api/admin/partners/${partnerId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          service_type: form.service_type,
          name: form.name,
          credit_cost: Number(form.credit_cost),
          aud_payout_cents: Number(form.aud_payout_cents),
          max_daily_redemptions: form.max_daily_redemptions
            ? Number(form.max_daily_redemptions)
            : null,
          is_active: form.is_active,
        }),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Failed to add service')

      setForm(EMPTY_SERVICE)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add service')
    } finally {
      setSaving(false)
    }
  }

  async function patchService(serviceId: string, updates: Record<string, unknown>) {
    setError(null)
    const res = await fetch(`/api/admin/partners/${partnerId}/services/${serviceId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    })
    const json = (await res.json()) as { error?: string }
    if (!res.ok) throw new Error(json.error ?? 'Update failed')
    await load()
  }

  async function removeService(serviceId: string) {
    if (!confirm('Remove this service from the partner?')) return
    setError(null)
    const res = await fetch(`/api/admin/partners/${partnerId}/services/${serviceId}`, {
      method: 'DELETE',
    })
    const json = (await res.json()) as { error?: string }
    if (!res.ok) throw new Error(json.error ?? 'Delete failed')
    await load()
  }

  if (loading) {
    return <p className="text-sm text-[#6B7280]">Loading onboarding…</p>
  }

  return (
    <div className="space-y-6 rounded-xl border border-[#FF6B35]/30 bg-[#FF6B35]/5 p-5">
      <div>
        <h3 className="font-semibold">Onboarding — {partnerName}</h3>
        <p className="mt-1 text-sm text-[#6B7280]">
          Add services, confirm Trip Help listings, then hand the partner their scan tablet link.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {checklist ? (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <h4 className="text-sm font-semibold">Launch checklist</h4>
            <span
              className={`rounded-full px-2 py-0.5 text-xs font-semibold ${
                checklist.readyToLaunch
                  ? 'bg-[#00FF7F]/15 text-[#00FF7F]'
                  : 'bg-[#2A2A2A] text-[#9CA3AF]'
              }`}
            >
              {checklist.readyToLaunch ? 'Ready to launch' : 'In progress'}
            </span>
          </div>
          <ul className="space-y-3">
            <ChecklistItem done={checklist.profileComplete} label="Profile complete (name, slug, address)" />
            <ChecklistItem done={checklist.isActive} label="Partner marked active" />
            <ChecklistItem
              done={checklist.hasActiveService}
              label="At least one active service"
              detail="Needed for payout amounts on Trip Help orders"
            />
            <ChecklistItem
              done={checklist.hasPayoutConfigured}
              label="Partner payout amount set"
              detail="aud_payout_cents on each sellable service"
            />
            <ChecklistItem
              done={checklist.catalogProducts.length > 0}
              label="Trip Help / marketplace listing wired"
              detail={
                checklist.catalogProducts.length > 0
                  ? checklist.catalogProducts
                      .map((product) => `${product.name} (${formatAud(product.priceAudCents)})`)
                      .join(' · ')
                  : `No catalog entry references slug "${partnerSlug}" yet — needs a code update in trip-help constants`
              }
            />
            <ChecklistItem done={checklist.isVerified} label="Verified badge (optional)" />
          </ul>
        </section>
      ) : null}

      <section className="space-y-3">
        <h4 className="text-sm font-semibold">Services & payouts</h4>

        {services.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No services yet — add what this partner fulfils.</p>
        ) : (
          <div className="divide-y divide-[#2A2A2A] rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            {services.map((service) => (
              <div
                key={service.id}
                className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm"
              >
                <div>
                  <div className="font-medium">{service.name}</div>
                  <p className="text-xs text-[#6B7280]">
                    {service.service_type} · partner gets {formatAud(service.aud_payout_cents)}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() =>
                      void patchService(service.id, { is_active: !service.is_active }).catch((err) =>
                        setError(err instanceof Error ? err.message : 'Update failed')
                      )
                    }
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      service.is_active
                        ? 'bg-[#00FF7F]/10 text-[#00FF7F]'
                        : 'bg-[#2A2A2A] text-[#6B7280]'
                    }`}
                  >
                    {service.is_active ? 'Active' : 'Inactive'}
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      void removeService(service.id).catch((err) =>
                        setError(err instanceof Error ? err.message : 'Delete failed')
                      )
                    }
                    className="text-xs text-[#6B7280] hover:text-red-400"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={(e) => void createService(e)} className="space-y-3 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
          <p className="text-sm font-medium">Add service</p>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="block text-sm">
              <span className="text-[#9CA3AF]">Service type</span>
              <select
                className={inputClassName}
                value={form.service_type}
                onChange={(e) => applyServicePreset(e.target.value)}
              >
                {SERVICES.map((service) => (
                  <option key={service.type} value={service.type}>
                    {service.name} ({service.type})
                  </option>
                ))}
                <option value="tour_reef_day">Tour — Reef day (tour_reef_day)</option>
                <option value="tour_island_sail">Tour — Island sail (tour_island_sail)</option>
                <option value="tour_sunset_sail">Tour — Sunset sail (tour_sunset_sail)</option>
                <option value="gym_day_pass">Gym day pass (gym_day_pass)</option>
                <option value="coworking">Coworking (coworking)</option>
              </select>
            </label>

            <label className="block text-sm">
              <span className="text-[#9CA3AF]">Display name</span>
              <input
                required
                className={inputClassName}
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </label>

            <label className="block text-sm">
              <span className="text-[#9CA3AF]">Credit cost</span>
              <input
                required
                type="number"
                min={1}
                className={inputClassName}
                value={form.credit_cost}
                onChange={(e) => setForm({ ...form, credit_cost: e.target.value })}
              />
            </label>

            <label className="block text-sm">
              <span className="text-[#9CA3AF]">Partner payout (cents)</span>
              <input
                required
                type="number"
                min={0}
                className={inputClassName}
                value={form.aud_payout_cents}
                onChange={(e) => setForm({ ...form, aud_payout_cents: e.target.value })}
              />
            </label>
          </div>

          <button
            type="submit"
            disabled={saving}
            className="rounded-lg bg-[#00FF7F] px-4 py-2 text-sm font-bold text-black disabled:opacity-60"
          >
            {saving ? 'Adding…' : 'Add service'}
          </button>
        </form>
      </section>

      <section className="space-y-2 rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4 text-sm">
        <h4 className="font-semibold">Partner handoff</h4>
        <p className="text-[#9CA3AF]">
          Bookmark on their counter tablet — no login needed. They enter the member&apos;s{' '}
          <strong className="text-white">collection PIN</strong> from the receipt.
        </p>
        <div className="space-y-2 text-xs">
          <div>
            <span className="text-[#6B7280]">Scan tablet</span>
            <div className="mt-1 break-all font-mono text-[#00FF7F]">
              {checklist?.scanUrl ?? 'https://www.driftpass.com.au/scan'}
            </div>
          </div>
          <div>
            <span className="text-[#6B7280]">Public profile</span>
            <div className="mt-1">
              <Link
                href={`/perks/${partnerSlug}`}
                target="_blank"
                className="text-[#00FF7F] hover:underline"
              >
                {checklist?.perksUrl ?? `/perks/${partnerSlug}`}
              </Link>
            </div>
          </div>
        </div>
        <p className="text-xs text-[#6B7280]">
          After they fulfil an order, mark it <strong className="text-[#9CA3AF]">collected</strong> in{' '}
          <Link href="/admin/orders" className="text-[#00FF7F] hover:underline">
            Trip Help orders
          </Link>{' '}
          before paying them out.
        </p>
      </section>
    </div>
  )
}
