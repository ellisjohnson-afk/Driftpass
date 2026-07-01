'use client'

import { useCallback, useEffect, useState } from 'react'
import type { AdminMemberRow } from '@/lib/members/admin-members'

type PassFilter = 'all' | 'active' | 'inactive'

interface MemberStats {
  totalMembers: number
  activePasses: number
  admins: number
}

function formatWhen(value: string) {
  return new Date(value).toLocaleString('en-AU', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function AdminMembersManager() {
  const [members, setMembers] = useState<AdminMemberRow[]>([])
  const [stats, setStats] = useState<MemberStats | null>(null)
  const [query, setQuery] = useState('')
  const [passFilter, setPassFilter] = useState<PassFilter>('all')
  const [loading, setLoading] = useState(true)
  const [savingId, setSavingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (query.trim()) params.set('q', query.trim())
      if (passFilter !== 'all') params.set('pass', passFilter)

      const res = await fetch(`/api/admin/members?${params.toString()}`)
      const json = (await res.json()) as {
        data?: { members: AdminMemberRow[]; stats: MemberStats }
        error?: string
      }
      if (!res.ok) throw new Error(json.error ?? 'Failed to load members')
      setMembers(json.data?.members ?? [])
      setStats(json.data?.stats ?? null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load members')
    } finally {
      setLoading(false)
    }
  }, [passFilter, query])

  useEffect(() => {
    const timer = setTimeout(() => {
      void load()
    }, query ? 250 : 0)
    return () => clearTimeout(timer)
  }, [load, query])

  async function runAction(
    memberId: string,
    body: Record<string, unknown>,
    successMessage: string
  ) {
    setSavingId(memberId)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch(`/api/admin/members/${memberId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      const json = (await res.json()) as { error?: string }
      if (!res.ok) throw new Error(json.error ?? 'Update failed')
      setSuccess(successMessage)
      await load()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Update failed')
    } finally {
      setSavingId(null)
    }
  }

  function activateMembership(member: AdminMemberRow) {
    if (
      !confirm(
        `Activate free membership for ${member.email}? They will get a pass PIN immediately.`
      )
    ) {
      return
    }
    void runAction(member.id, { action: 'activate_membership' }, `Membership activated for ${member.email}`)
  }

  function toggleAdmin(member: AdminMemberRow) {
    const next = !member.is_admin
    if (
      !confirm(
        next
          ? `Grant admin access to ${member.email}?`
          : `Remove admin access from ${member.email}?`
      )
    ) {
      return
    }
    void runAction(
      member.id,
      { action: 'set_admin', is_admin: next },
      next ? `${member.email} is now an admin` : `Admin access removed for ${member.email}`
    )
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Members</h1>
        <p className="mt-1 text-sm text-[#6B7280]">
          Search accounts, check pass status, activate membership, and manage admin access.
        </p>
      </div>

      {error ? (
        <div className="rounded-xl border border-red-800/50 bg-red-900/20 px-4 py-3 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      {success ? (
        <div className="rounded-xl border border-[#00FF7F]/30 bg-[#00FF7F]/10 px-4 py-3 text-sm text-[#00FF7F]">
          {success}
        </div>
      ) : null}

      {stats ? (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total accounts', value: stats.totalMembers },
            { label: 'Active passes', value: stats.activePasses, accent: 'text-[#00FF7F]' },
            { label: 'Admins', value: stats.admins, accent: 'text-[#FF6B35]' },
          ].map(({ label, value, accent }) => (
            <div key={label} className="rounded-xl border border-[#2A2A2A] bg-[#1A1A1A] p-4">
              <div className={`text-2xl font-bold ${accent ?? 'text-white'}`}>{value}</div>
              <div className="text-xs text-[#6B7280]">{label}</div>
            </div>
          ))}
        </div>
      ) : null}

      <section className="space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-semibold">Accounts ({members.length})</h2>
          <div className="flex flex-wrap gap-2">
            <input
              type="search"
              placeholder="Search email or name…"
              className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <select
              className="rounded-lg border border-[#2A2A2A] bg-[#0A0A0A] px-3 py-2 text-sm"
              value={passFilter}
              onChange={(e) => setPassFilter(e.target.value as PassFilter)}
            >
              <option value="all">All passes</option>
              <option value="active">Active pass only</option>
              <option value="inactive">No active pass</option>
            </select>
          </div>
        </div>

        {loading ? (
          <p className="text-sm text-[#6B7280]">Loading…</p>
        ) : members.length === 0 ? (
          <p className="text-sm text-[#6B7280]">No members match your search.</p>
        ) : (
          <div className="divide-y divide-[#2A2A2A] rounded-xl border border-[#2A2A2A] bg-[#1A1A1A]">
            {members.map((member) => (
              <div key={member.id} className="space-y-3 px-4 py-4 text-sm">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-medium">{member.full_name ?? member.email}</span>
                      {member.is_admin ? (
                        <span className="rounded-full bg-[#FF6B35]/10 px-2 py-0.5 text-xs text-[#FF6B35]">
                          Admin
                        </span>
                      ) : null}
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs ${
                          member.has_active_pass
                            ? 'bg-[#00FF7F]/10 text-[#00FF7F]'
                            : 'bg-[#2A2A2A] text-[#6B7280]'
                        }`}
                      >
                        {member.has_active_pass ? 'Active pass' : 'No pass'}
                      </span>
                    </div>
                    <p className="mt-1 text-[#9CA3AF]">{member.email}</p>
                  </div>
                  <div className="text-right text-xs text-[#6B7280]">
                    Joined {formatWhen(member.created_at)}
                  </div>
                </div>

                <dl className="grid gap-2 text-xs text-[#9CA3AF] sm:grid-cols-2">
                  <div>
                    <dt className="text-[#6B7280]">Plan</dt>
                    <dd>{member.subscription?.plan_name ?? '—'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280]">Subscription</dt>
                    <dd>{member.subscription?.status ?? 'none'}</dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280]">Traveller type</dt>
                    <dd className="capitalize">
                      {member.traveller_type?.replace('_', ' ') ?? '—'}
                    </dd>
                  </div>
                  <div>
                    <dt className="text-[#6B7280]">Activity</dt>
                    <dd>
                      {member.redemption_count} redemption
                      {member.redemption_count === 1 ? '' : 's'} · {member.order_count} Trip Help
                      order{member.order_count === 1 ? '' : 's'}
                    </dd>
                  </div>
                  <div className="sm:col-span-2">
                    <dt className="text-[#6B7280]">User ID</dt>
                    <dd className="break-all font-mono text-[11px]">{member.id}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap gap-2">
                  {!member.has_active_pass ? (
                    <button
                      type="button"
                      disabled={savingId === member.id}
                      onClick={() => activateMembership(member)}
                      className="rounded-lg bg-[#00FF7F] px-3 py-1.5 text-xs font-bold text-black disabled:opacity-60"
                    >
                      Activate membership
                    </button>
                  ) : null}
                  <button
                    type="button"
                    disabled={savingId === member.id}
                    onClick={() => toggleAdmin(member)}
                    className="rounded-lg border border-[#2A2A2A] px-3 py-1.5 text-xs text-[#9CA3AF] hover:text-white disabled:opacity-60"
                  >
                    {member.is_admin ? 'Remove admin' : 'Make admin'}
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
