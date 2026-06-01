// ============================================================
// DriftPass — Supabase Database Types
// Regenerate with: npm run db:types
// This is a hand-written approximation for initial development.
// Replace with generated output once Supabase project is linked.
// ============================================================

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export interface Database {
  public: {
    Tables: {
      plans: {
        Row: {
          id: string
          name: string
          slug: string
          price_aud_cents: number
          credits_per_month: number
          stripe_price_id: string
          audience_type: string
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          price_aud_cents: number
          credits_per_month: number
          stripe_price_id: string
          audience_type: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['plans']['Insert']>
      }
      profiles: {
        Row: {
          id: string
          full_name: string | null
          email: string
          avatar_url: string | null
          traveller_type: string | null
          push_token: string | null
          location_lat: number | null
          location_lng: number | null
          is_partner_user: boolean
          is_admin: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          full_name?: string | null
          email: string
          avatar_url?: string | null
          traveller_type?: string | null
          push_token?: string | null
          location_lat?: number | null
          location_lng?: number | null
          is_partner_user?: boolean
          is_admin?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          stripe_subscription_id: string
          stripe_customer_id: string
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['subscriptions']['Insert']>
      }
      credit_transactions: {
        Row: {
          id: string
          user_id: string
          subscription_id: string | null
          type: string
          amount: number
          balance_after: number
          description: string
          redemption_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          subscription_id?: string | null
          type: string
          amount: number
          balance_after: number
          description: string
          redemption_id?: string | null
          created_at?: string
        }
        Update: never  // immutable ledger
      }
      partners: {
        Row: {
          id: string
          name: string
          slug: string
          description: string | null
          category: string
          address: string
          city: string
          state: string
          country: string
          lat: number | null
          lng: number | null
          phone: string | null
          email: string | null
          website: string | null
          google_rating: number | null
          google_place_id: string | null
          stripe_connect_account_id: string | null
          logo_url: string | null
          is_active: boolean
          is_verified: boolean
          is_featured: boolean
          deleted_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          description?: string | null
          category: string
          address: string
          city: string
          state?: string
          country?: string
          lat?: number | null
          lng?: number | null
          phone?: string | null
          email?: string | null
          website?: string | null
          google_rating?: number | null
          google_place_id?: string | null
          stripe_connect_account_id?: string | null
          logo_url?: string | null
          is_active?: boolean
          is_verified?: boolean
          is_featured?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['partners']['Insert']>
      }
      partner_services: {
        Row: {
          id: string
          partner_id: string
          service_type: string
          name: string
          credit_cost: number
          aud_payout_cents: number
          max_daily_redemptions: number | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          partner_id: string
          service_type: string
          name: string
          credit_cost: number
          aud_payout_cents: number
          max_daily_redemptions?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['partner_services']['Insert']>
      }
      partner_users: {
        Row: {
          id: string
          user_id: string
          partner_id: string
          role: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          partner_id: string
          role?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['partner_users']['Insert']>
      }
      redemptions: {
        Row: {
          id: string
          user_id: string
          partner_id: string
          service_id: string
          subscription_id: string
          credits_used: number
          aud_paid_to_partner: number
          scanned_by_partner_user_id: string | null
          qr_token_used: string
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          partner_id: string
          service_id: string
          subscription_id: string
          credits_used: number
          aud_paid_to_partner: number
          scanned_by_partner_user_id?: string | null
          qr_token_used: string
          status?: string
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['redemptions']['Insert']>
      }
      flash_deals: {
        Row: {
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
          created_at: string
        }
        Insert: {
          id?: string
          partner_id: string
          title: string
          description: string
          original_price_aud_cents: number
          subscriber_price_aud_cents: number
          commission_rate?: number
          total_seats: number
          seats_remaining: number
          available_from: string
          expires_at: string
          is_active?: boolean
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['flash_deals']['Insert']>
      }
      flash_bookings: {
        Row: {
          id: string
          user_id: string
          flash_deal_id: string
          stripe_payment_intent_id: string | null
          status: string
          booked_at: string
        }
        Insert: {
          id?: string
          user_id: string
          flash_deal_id: string
          stripe_payment_intent_id?: string | null
          status?: string
          booked_at?: string
        }
        Update: Partial<Database['public']['Tables']['flash_bookings']['Insert']>
      }
      events: {
        Row: {
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
          updated_at: string
        }
        Insert: {
          id?: string
          partner_id: string
          title: string
          description?: string | null
          starts_at: string
          ends_at: string
          is_free?: boolean
          credit_cost?: number
          max_attendees?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: Partial<Database['public']['Tables']['events']['Insert']>
      }
      credit_topups: {
        Row: {
          id: string
          user_id: string
          credits_purchased: number
          aud_charged_cents: number
          stripe_payment_intent_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          credits_purchased: number
          aud_charged_cents: number
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
        Update: Partial<Database['public']['Tables']['credit_topups']['Insert']>
      }
      notification_logs: {
        Row: {
          id: string
          user_id: string | null
          title: string
          body: string
          data: Json | null
          sent_at: string
          opened_at: string | null
        }
        Insert: {
          id?: string
          user_id?: string | null
          title: string
          body: string
          data?: Json | null
          sent_at?: string
          opened_at?: string | null
        }
        Update: Partial<Database['public']['Tables']['notification_logs']['Insert']>
      }
    }
    Views: Record<string, never>
    Functions: {
      get_credit_balance: {
        Args: { p_user_id: string }
        Returns: number
      }
      deduct_credits: {
        Args: {
          p_user_id: string
          p_subscription_id: string
          p_amount: number
          p_description: string
          p_redemption_id?: string
        }
        Returns: number
      }
      credit_monthly_allowance: {
        Args: {
          p_user_id: string
          p_subscription_id: string
          p_plan_id: string
        }
        Returns: number
      }
      nearby_partners: {
        Args: {
          lat: number
          lng: number
          radius_km?: number
          p_category?: string
        }
        Returns: Array<{
          id: string
          name: string
          slug: string
          category: string
          city: string
          address: string
          lat: number
          lng: number
          google_rating: number
          logo_url: string
          is_featured: boolean
          distance_km: number
        }>
      }
      claim_flash_seat: {
        Args: { p_deal_id: string }
        Returns: boolean
      }
      is_admin: {
        Args: Record<never, never>
        Returns: boolean
      }
    }
    Enums: Record<string, never>
  }
}
