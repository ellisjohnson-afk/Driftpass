'use client'

import { useEffect, useState } from 'react'
import { BottomNav } from '@/components/layout/BottomNav'
import { MembershipCard } from '@/components/pass/MembershipCard'
import { PinDisplay } from '@/components/pass/PinDisplay'
import { Button } from '@/components/ui/Button'
import { StatusPill } from '@/components/ui/StatusPill'
import { EmptyStatesPreview } from '@/components/ui/EmptyStatesPreview'

export function DesignPreviewContent() {
  const [secondsLeft, setSecondsLeft] = useState(47)

  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsLeft((s) => (s <= 0 ? 59 : s - 1))
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="space-y-10 animate-fade-in">
      <header>
        <p className="text-xs uppercase tracking-widest text-drift-teal">Phase A</p>
        <h1 className="mt-1 text-2xl font-bold">Design system preview</h1>
        <p className="mt-2 text-sm text-drift-text-muted">
          Figma source: docs/figma/
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-drift-text-muted">
          Buttons
        </h2>
        <div className="flex flex-wrap gap-3">
          <Button variant="gold">Start Saving</Button>
          <Button variant="teal">Show My Pass</Button>
          <Button variant="outline">Dismiss</Button>
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-drift-text-muted">
          Status pills
        </h2>
        <div className="flex flex-wrap gap-2">
          <StatusPill label="Active Member" />
          <StatusPill label="Available Now" tone="available" />
          <StatusPill label="Open Now" tone="neutral" />
        </div>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-drift-text-muted">
          MembershipCard — compact (Home)
        </h2>
        <MembershipCard
          variant="compact"
          memberName="Ellis Drift"
          memberSince="Jan 2026"
        />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-drift-text-muted">
          MembershipCard + PinDisplay — full (My Pass)
        </h2>
        <MembershipCard variant="full" memberName="Ellis Drift">
          <PinDisplay pin="829461" secondsLeft={secondsLeft} />
        </MembershipCard>
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-drift-text-muted">
          Empty states — Figma #10
        </h2>
        <EmptyStatesPreview />
      </section>

      <section className="space-y-3">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-drift-text-muted">
          BottomNav (standalone)
        </h2>
        <div className="relative overflow-hidden rounded-2xl border border-drift-border bg-drift-navy-deep pb-24">
          <p className="p-4 text-center text-xs text-drift-text-muted">
            Preview container — nav is position-fixed in production
          </p>
          <BottomNav />
        </div>
      </section>
    </div>
  )
}
