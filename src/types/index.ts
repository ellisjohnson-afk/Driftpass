// ============================================================
// DriftPass — Application Types
// Central type definitions. Import from here, not from DB types directly.
// ============================================================

export type TravellerType = 'backpacker' | 'digital_nomad' | 'van_lifer'

export type SubscriptionStatus =
  | 'active'
  | 'trialing'
  | 'past_due'
  | 'canceled'
  | 'unpaid'
  | 'incomplete'

export type CreditTransactionType = 'credit' | 'debit' | 'topup' | 'refund'

export type RedemptionStatus = 'pending' | 'confirmed' | 'refunded'

export type PartnerCategory =
  | 'gym_fitness'
  | 'cafe_cowork'
  | 'laundry'
  | 'luggage_storage'
  | 'shower'
  | 'scooter_hire'
  | 'water_fill'
  | 'accommodation'
  | 'restaurant'
  | 'mechanic'
  | 'kitchen'
  | 'ev_charging'
  | 'events'
  | 'tours'
  | 'other'

export type PlanSlug = 'membership' | 'wanderer' | 'explorer' | 'nomad' | 'van_lifer'

export type PlanBillingPeriod = 'week' | 'fortnight'

// ---- Plan ----
export interface Plan {
  id: string
  name: string
  slug: PlanSlug
  price_aud_cents: number
  credits_per_month: number
  stripe_price_id: string
  audience_type: TravellerType
  billing_period?: PlanBillingPeriod
  features: string[]
  is_active?: boolean
  is_popular?: boolean
}

// ---- Profile ----
export interface Profile {
  id: string
  full_name: string | null
  email: string
  avatar_url: string | null
  traveller_type: TravellerType | null
  push_token: string | null
  location_lat: number | null
  location_lng: number | null
  created_at: string
}

// ---- Subscription ----
export interface Subscription {
  id: string
  user_id: string
  plan_id: string
  plan?: Plan
  stripe_subscription_id: string
  stripe_customer_id: string
  status: SubscriptionStatus
  current_period_start: string
  current_period_end: string
  cancel_at_period_end: boolean
  created_at: string
}

// ---- Credits ----
export interface CreditBalance {
  total_credits: number
  used_credits: number
  remaining_credits: number
  period_end: string
}

export interface CreditTransaction {
  id: string
  user_id: string
  type: CreditTransactionType
  amount: number
  balance_after: number
  description: string
  redemption_id: string | null
  created_at: string
}

// ---- Partner ----
export interface Partner {
  id: string
  name: string
  slug: string
  description: string | null
  category: PartnerCategory
  address: string
  city: string
  state: string
  lat: number | null
  lng: number | null
  phone: string | null
  email: string | null
  website: string | null
  google_rating: number | null
  stripe_connect_account_id: string | null
  is_active: boolean
  is_verified: boolean
  created_at: string
  // joined
  services?: PartnerService[]
  distance_km?: number
}

// ---- Partner Service ----
export interface PartnerService {
  id: string
  partner_id: string
  service_type: string
  name: string
  credit_cost: number
  aud_payout_to_partner: number  // in cents
  max_daily_redemptions: number | null
  is_active: boolean
}

// ---- Redemption ----
export interface Redemption {
  id: string
  user_id: string
  partner_id: string
  service_id: string
  credits_used: number
  aud_paid_to_partner: number
  qr_token_used: string
  status: RedemptionStatus
  created_at: string
  // joined
  partner?: Pick<Partner, 'name' | 'category'>
  service?: Pick<PartnerService, 'name'>
}

// ---- Flash Deal (Phase 3) ----
export interface FlashDeal {
  id: string
  partner_id: string
  title: string
  description: string
  original_price_aud_cents: number
  subscriber_price_aud_cents: number
  commission_rate: number
  total_seats: number
  seats_remaining: number
  available_from: string
  expires_at: string
  is_active: boolean
  partner?: Pick<Partner, 'name' | 'city'>
}

// ---- Event (Phase 2) ----
export interface Event {
  id: string
  partner_id: string
  title: string
  description: string | null
  starts_at: string
  ends_at: string
  is_free: boolean
  credit_cost: number
  max_attendees: number | null
  created_at: string
  partner?: Pick<Partner, 'name' | 'city'>
}

// ---- API Response types ----
export interface ApiSuccess<T = unknown> {
  data: T
  error: null
}

export interface ApiError {
  data: null
  error: {
    message: string
    code?: string
  }
}

export type ApiResponse<T = unknown> = ApiSuccess<T> | ApiError

// ---- QR Pass ----
export interface PassToken {
  userId: string
  subscriptionId: string
  generatedAt: number
  expiresAt: number  // 30 seconds from generation
  nonce: string
}
