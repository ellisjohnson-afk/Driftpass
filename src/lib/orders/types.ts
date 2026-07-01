export type OrderProductType = 'trip_help' | 'marketplace'
export type PurchasableProductType = OrderProductType
export type OrderVoucherStatus = 'pending' | 'paid' | 'collected' | 'expired' | 'refunded' | 'canceled'

export interface OrderVoucher {
  id: string
  user_id: string
  partner_id: string | null
  partner_service_id: string | null
  product_type: OrderProductType
  product_slug: string
  product_name: string
  amount_aud_cents: number
  partner_payout_cents: number
  platform_fee_cents: number
  collection_pin: string
  status: OrderVoucherStatus
  stripe_checkout_session_id: string | null
  stripe_payment_intent_id: string | null
  expires_at: string
  collected_at: string | null
  created_at: string
  updated_at: string
}

export interface OrderVoucherWithPartner extends OrderVoucher {
  partners: {
    name: string
    slug: string
    address: string
    city: string
    state?: string | null
    lat?: number | null
    lng?: number | null
    google_place_id?: string | null
  } | null
}
