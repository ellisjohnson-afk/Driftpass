import type { ReactNode } from 'react'

function IconCircle({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mb-5 flex h-20 w-20 items-center justify-center rounded-full border border-drift-border/40 bg-drift-navy-deep/80 shadow-drift-card">
      {children}
    </div>
  )
}

export function MapEmptyIcon() {
  return (
    <IconCircle>
      <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-drift-gold-mid" aria-hidden>
        <path
          d="M9 18 4 21V6l5-3 6 3 5-3v15l-5 3-6-3-5 3Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
        <path d="M9 3v15M15 6v15" stroke="currentColor" strokeWidth="1.5" />
      </svg>
    </IconCircle>
  )
}

export function CompassEmptyIcon() {
  return (
    <IconCircle>
      <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-drift-gold-mid" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path
          d="m14.5 9.5-1 4-4 1 1-4 4-1Z"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinejoin="round"
        />
      </svg>
    </IconCircle>
  )
}

export function PassEmptyIcon() {
  return (
    <IconCircle>
      <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-drift-gold-mid" aria-hidden>
        <rect x="4" y="6" width="16" height="12" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <path d="M8 10h8M8 14h5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </IconCircle>
  )
}

export function HistoryEmptyIcon() {
  return (
    <IconCircle>
      <svg viewBox="0 0 24 24" fill="none" className="h-9 w-9 text-drift-gold-mid" aria-hidden>
        <circle cx="12" cy="12" r="8" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 8v4l2.5 2.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    </IconCircle>
  )
}

export function RefreshIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4" aria-hidden>
      <path
        d="M20 12a8 8 0 1 1-2.3-5.7M20 4v6h-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
