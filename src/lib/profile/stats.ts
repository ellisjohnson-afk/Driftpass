export interface ProfileStats {
  dealsClaimed: number
  citiesVisited: number
  daysTraveling: number
  lifetimeSavingsCents: number
}

interface RedemptionPartnerRow {
  partners: { city: string } | { city: string }[] | null
}

/** Rough member savings estimate until retail amounts are stored per redemption. */
const ESTIMATED_SAVINGS_PER_DEAL_CENTS = 1800

export function computeProfileStats(
  memberSince: string | null | undefined,
  redemptions: Array<{ partners: RedemptionPartnerRow['partners'] }>
): ProfileStats {
  const dealsClaimed = redemptions.length

  const cities = new Set<string>()
  for (const redemption of redemptions) {
    const partner = redemption.partners
    const city = Array.isArray(partner) ? partner[0]?.city : partner?.city
    if (city) cities.add(city)
  }

  const citiesVisited = cities.size
  const daysTraveling = memberSince
    ? Math.max(1, Math.ceil((Date.now() - new Date(memberSince).getTime()) / 86_400_000))
    : 0

  return {
    dealsClaimed,
    citiesVisited,
    daysTraveling,
    lifetimeSavingsCents: dealsClaimed * ESTIMATED_SAVINGS_PER_DEAL_CENTS,
  }
}

export function formatMemberSince(date: string | null | undefined): string | null {
  if (!date) return null
  return new Intl.DateTimeFormat('en-AU', { month: 'short', year: 'numeric' }).format(
    new Date(date)
  )
}

export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return 'DP'
  if (parts.length === 1) return (parts[0] ?? 'DP').slice(0, 2).toUpperCase()
  const first = parts[0]?.[0] ?? ''
  const last = parts[parts.length - 1]?.[0] ?? ''
  return `${first}${last}`.toUpperCase() || 'DP'
}
