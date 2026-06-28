'use client'

import Link from 'next/link'
import { cn } from '@/lib/utils/cn'
import type { TownEssentialFaq } from '@/lib/towns/constants'

export interface EssentialsFaqProps {
  items: TownEssentialFaq[]
  className?: string
}

export function EssentialsFaq({ items, className }: EssentialsFaqProps) {
  const categories = [...new Set(items.map((item) => item.category))]

  return (
    <div className={cn('space-y-6', className)}>
      <p className="text-sm text-drift-text-muted">
        Quick answers for water, WiFi, parking, showers, and van-life basics in Airlie Beach.
        Where we have a Trip Help utility, you can buy and collect on the spot.
      </p>

      {categories.map((category) => {
        const categoryItems = items.filter((item) => item.category === category)

        return (
          <section key={category} className="space-y-2">
            <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-drift-gold-mid">
              {category}
            </h2>
            <div className="space-y-2">
              {categoryItems.map((item) => (
                <details
                  key={item.id}
                  className="group rounded-2xl border border-drift-border/60 bg-drift-navy-light px-4 py-3"
                >
                  <summary className="cursor-pointer list-none font-medium text-white marker:content-none [&::-webkit-details-marker]:hidden">
                    <span className="flex items-start justify-between gap-3">
                      <span>{item.question}</span>
                      <span className="shrink-0 text-drift-gold-mid transition-transform group-open:rotate-45">
                        +
                      </span>
                    </span>
                  </summary>
                  <p className="mt-3 text-sm leading-relaxed text-drift-text-muted">{item.answer}</p>
                  {item.utilityHref ? (
                    <Link
                      href={item.utilityHref}
                      className="mt-3 inline-flex text-sm font-semibold text-drift-gold-mid hover:text-white"
                    >
                      Open in Trip Help →
                    </Link>
                  ) : null}
                </details>
              ))}
            </div>
          </section>
        )
      })}
    </div>
  )
}
