const PERK_CATEGORIES = [
  { emoji: '🏋️', label: 'Gym Deals' },
  { emoji: '☕', label: 'Coffee Perks' },
  { emoji: '💸', label: 'Discounts' },
  { emoji: '🎒', label: 'Travel Perks' },
] as const

export function PassPerkCategories() {
  return (
    <div className="grid grid-cols-4 gap-2">
      {PERK_CATEGORIES.map(({ emoji, label }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-2 rounded-2xl border border-drift-border/40 bg-drift-navy-light/50 px-2 py-4"
        >
          <span className="text-2xl" aria-hidden>
            {emoji}
          </span>
          <span className="text-center text-[10px] font-medium leading-tight text-drift-text-muted">
            {label}
          </span>
        </div>
      ))}
    </div>
  )
}
