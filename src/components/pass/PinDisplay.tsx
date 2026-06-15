'use client'

import { cn } from '@/lib/utils/cn'

export interface PinDisplayProps {
  pin: string | null
  secondsLeft: number
  loading?: boolean
  className?: string
}

function formatCountdown(totalSeconds: number): string {
  const safe = Math.max(0, totalSeconds)
  const minutes = Math.floor(safe / 60)
  const seconds = safe % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function normalizePin(pin: string | null): string[] {
  if (!pin) return ['', '', '', '', '', '']
  const digits = pin.replace(/\D/g, '').slice(0, 6).padEnd(6, '·').split('')
  return digits
}

function PinDigit({ digit }: { digit: string }) {
  return (
    <div className="flex h-12 w-11 items-center justify-center rounded-2xl bg-drift-navy-deep/15 text-xl font-bold text-drift-navy-deep shadow-inner sm:h-14 sm:w-12 sm:text-2xl">
      {digit}
    </div>
  )
}

export function PinDisplay({ pin, secondsLeft, loading = false, className }: PinDisplayProps) {
  const digits = normalizePin(pin)

  return (
    <div className={cn('w-full', className)}>
      <div className="flex justify-center gap-2 sm:gap-3">
        {digits.map((digit, index) => (
          <PinDigit key={`${index}-${digit}`} digit={loading ? '·' : digit} />
        ))}
      </div>

      <p className="mt-5 text-center text-xs text-drift-navy-deep/70">
        <span className="mr-1.5 inline-block h-1.5 w-1.5 rounded-full bg-drift-navy-deep/40" />
        Code refreshes in {formatCountdown(secondsLeft)}
      </p>
    </div>
  )
}
