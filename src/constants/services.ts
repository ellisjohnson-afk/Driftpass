// ============================================================
// DriftPass Service Credit Costs + Partner Payouts
// Model: 1 credit = A$1 in redemption value.
//        Partner receives 80%, DriftPass keeps 20% commission.
//        Gym agreed flat rate: A$12 = 80% of 15cr ✓
// ============================================================

export interface ServiceDefinition {
  type: string
  name: string
  credit_cost: number
  aud_payout_cents: number   // what partner receives (80% of credit value)
  period_cap: number | null  // max redemptions per 2-week pass period (null = unlimited)
  description: string
  phase: 1 | 2 | 3 | 4
}

export const SERVICES: ServiceDefinition[] = [
  // Phase 1
  {
    type: 'gym_session',
    name: 'Gym Day Pass',
    credit_cost: 14,
    aud_payout_cents: 1100,  // A$11.00 — gym sells at A$14, DriftPass keeps A$3 (21%)
    period_cap: 2,           // max 2 gym visits per 2-week period
    description: 'Full day gym access',
    phase: 1,
  },
  {
    type: 'fitness_class',
    name: 'Fitness Class',
    credit_cost: 12,
    aud_payout_cents: 960,   // A$9.60 (80% of A$12)
    period_cap: null,
    description: 'Group fitness, yoga, or wellness class',
    phase: 1,
  },
  {
    type: 'cafe_session',
    name: 'Café Work Session',
    credit_cost: 8,
    aud_payout_cents: 640,   // A$6.40 (80% of A$8)
    period_cap: null,
    description: 'Reserved seat + WiFi + drink of choice',
    phase: 1,
  },
  {
    type: 'laundry',
    name: 'Laundry (Wash + Dry)',
    credit_cost: 6,
    aud_payout_cents: 480,   // A$4.80 (80% of A$6)
    period_cap: null,
    description: 'One full wash and dry cycle',
    phase: 1,
  },
  {
    type: 'luggage_storage',
    name: 'Luggage Storage (per bag/day)',
    credit_cost: 5,
    aud_payout_cents: 400,   // A$4.00 (80% of A$5)
    period_cap: null,
    description: 'Secure bag storage for the day',
    phase: 1,
  },
  {
    type: 'restaurant_discount',
    name: 'Restaurant Discount',
    credit_cost: 4,
    aud_payout_cents: 0,     // restaurant earns via foot traffic, no direct payout
    period_cap: null,
    description: 'Unlock 20% off at partner restaurants',
    phase: 1,
  },
  // Phase 2
  {
    type: 'shower',
    name: 'Shower Access',
    credit_cost: 5,
    aud_payout_cents: 400,   // A$4.00 (80% of A$5)
    period_cap: null,
    description: 'Hot shower + towel (10am–3pm)',
    phase: 2,
  },
  {
    type: 'water_fill',
    name: 'Water Tank Refill',
    credit_cost: 4,
    aud_payout_cents: 320,   // A$3.20 (80% of A$4)
    period_cap: null,
    description: 'Fresh water fill for van tank',
    phase: 2,
  },
  // Phase 3
  {
    type: 'overnight_pitch',
    name: 'Overnight Pitch',
    credit_cost: 10,
    aud_payout_cents: 800,   // A$8.00 (80% of A$10)
    period_cap: null,
    description: 'Verified overnight van/campervan location',
    phase: 3,
  },
  // Phase 4
  {
    type: 'kitchen_access',
    name: 'Kitchen Access',
    credit_cost: 6,
    aud_payout_cents: 480,   // A$4.80 (80% of A$6)
    period_cap: null,
    description: 'Shared kitchen access for cooking',
    phase: 4,
  },
  {
    type: 'ev_charging',
    name: 'EV Charging',
    credit_cost: 8,
    aud_payout_cents: 640,   // A$6.40 (80% of A$8)
    period_cap: null,
    description: 'Electric van/campervan charging session',
    phase: 4,
  },
]

export const SERVICE_BY_TYPE = Object.fromEntries(
  SERVICES.map((s) => [s.type, s])
) as Record<string, ServiceDefinition>
