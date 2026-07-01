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
        Update: {
          id?: string
          name?: string
          slug?: string
          price_aud_cents?: number
          credits_per_month?: number
          stripe_price_id?: string
          audience_type?: string
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Update: {
          id?: string
          full_name?: string | null
          email?: string
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
        Relationships: []
      }
      subscriptions: {
        Row: {
          id: string
          user_id: string
          plan_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end: boolean
          pin_shard: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          plan_id: string
          stripe_subscription_id: string | null
          stripe_customer_id: string | null
          status: string
          current_period_start: string
          current_period_end: string
          cancel_at_period_end?: boolean
          pin_shard?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          plan_id?: string
          stripe_subscription_id?: string
          stripe_customer_id?: string
          status?: string
          current_period_start?: string
          current_period_end?: string
          cancel_at_period_end?: boolean
          pin_shard?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Update: {
          id?: string
          user_id?: string
          subscription_id?: string | null
          type?: string
          amount?: number
          balance_after?: number
          description?: string
          redemption_id?: string | null
          created_at?: string
        }
        Relationships: []
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
          timezone: string
          opening_hours: Json | null
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
          timezone?: string
          opening_hours?: Json | null
          is_active?: boolean
          is_verified?: boolean
          is_featured?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          description?: string | null
          category?: string
          address?: string
          city?: string
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
          timezone?: string
          opening_hours?: Json | null
          is_active?: boolean
          is_verified?: boolean
          is_featured?: boolean
          deleted_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
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
        Update: {
          id?: string
          partner_id?: string
          service_type?: string
          name?: string
          credit_cost?: number
          aud_payout_cents?: number
          max_daily_redemptions?: number | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_services_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          }
        ]
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
        Update: {
          id?: string
          user_id?: string
          partner_id?: string
          role?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_users_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "partner_users_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      trip_help_products: {
        Row: {
          id: string
          product_type: string
          section: string
          slug: string
          name: string
          short_label: string | null
          tagline: string | null
          description: string
          features: string[]
          partner_id: string | null
          service_type: string | null
          price_aud_cents: number | null
          expiry_hours: number
          price_label: string
          price_subtext: string | null
          hours_label: string | null
          meeting_note: string | null
          emoji: string | null
          hub_slug: string | null
          sort_order: number
          is_active: boolean
          is_purchasable: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          product_type: string
          section?: string
          slug: string
          name: string
          short_label?: string | null
          tagline?: string | null
          description?: string
          features?: string[]
          partner_id?: string | null
          service_type?: string | null
          price_aud_cents?: number | null
          expiry_hours?: number
          price_label?: string
          price_subtext?: string | null
          hours_label?: string | null
          meeting_note?: string | null
          emoji?: string | null
          hub_slug?: string | null
          sort_order?: number
          is_active?: boolean
          is_purchasable?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          product_type?: string
          section?: string
          slug?: string
          name?: string
          short_label?: string | null
          tagline?: string | null
          description?: string
          features?: string[]
          partner_id?: string | null
          service_type?: string | null
          price_aud_cents?: number | null
          expiry_hours?: number
          price_label?: string
          price_subtext?: string | null
          hours_label?: string | null
          meeting_note?: string | null
          emoji?: string | null
          hub_slug?: string | null
          sort_order?: number
          is_active?: boolean
          is_purchasable?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trip_help_products_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          }
        ]
      }
      featured_shoutouts: {
        Row: {
          id: string
          partner_id: string | null
          business_name: string
          headline: string
          body: string | null
          cta_label: string
          cta_href: string
          image_url: string | null
          placement: string
          town_slug: string
          sort_order: number
          starts_at: string | null
          ends_at: string | null
          is_active: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          partner_id?: string | null
          business_name: string
          headline: string
          body?: string | null
          cta_label?: string
          cta_href: string
          image_url?: string | null
          placement: string
          town_slug?: string
          sort_order?: number
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          partner_id?: string | null
          business_name?: string
          headline?: string
          body?: string | null
          cta_label?: string
          cta_href?: string
          image_url?: string | null
          placement?: string
          town_slug?: string
          sort_order?: number
          starts_at?: string | null
          ends_at?: string | null
          is_active?: boolean
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "featured_shoutouts_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          }
        ]
      }
      order_vouchers: {
        Row: {
          id: string
          user_id: string
          partner_id: string | null
          partner_service_id: string | null
          product_type: string
          product_slug: string
          product_name: string
          amount_aud_cents: number
          partner_payout_cents: number
          platform_fee_cents: number
          collection_pin: string
          status: string
          stripe_checkout_session_id: string | null
          stripe_payment_intent_id: string | null
          expires_at: string
          collected_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          partner_id?: string | null
          partner_service_id?: string | null
          product_type: string
          product_slug: string
          product_name: string
          amount_aud_cents: number
          partner_payout_cents?: number
          platform_fee_cents?: number
          collection_pin: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          expires_at: string
          collected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          partner_id?: string | null
          partner_service_id?: string | null
          product_type?: string
          product_slug?: string
          product_name?: string
          amount_aud_cents?: number
          partner_payout_cents?: number
          platform_fee_cents?: number
          collection_pin?: string
          status?: string
          stripe_checkout_session_id?: string | null
          stripe_payment_intent_id?: string | null
          expires_at?: string
          collected_at?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_vouchers_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_vouchers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Update: {
          id?: string
          user_id?: string
          partner_id?: string
          service_id?: string
          subscription_id?: string
          credits_used?: number
          aud_paid_to_partner?: number
          scanned_by_partner_user_id?: string | null
          qr_token_used?: string
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "redemptions_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "partner_services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "redemptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Update: {
          id?: string
          partner_id?: string
          title?: string
          description?: string
          original_price_aud_cents?: number
          subscriber_price_aud_cents?: number
          commission_rate?: number
          total_seats?: number
          seats_remaining?: number
          available_from?: string
          expires_at?: string
          is_active?: boolean
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_deals_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          }
        ]
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
        Update: {
          id?: string
          user_id?: string
          flash_deal_id?: string
          stripe_payment_intent_id?: string | null
          status?: string
          booked_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "flash_bookings_flash_deal_id_fkey"
            columns: ["flash_deal_id"]
            isOneToOne: false
            referencedRelation: "flash_deals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "flash_bookings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
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
        Update: {
          id?: string
          partner_id?: string
          title?: string
          description?: string | null
          starts_at?: string
          ends_at?: string
          is_free?: boolean
          credit_cost?: number
          max_attendees?: number | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_partner_id_fkey"
            columns: ["partner_id"]
            isOneToOne: false
            referencedRelation: "partners"
            referencedColumns: ["id"]
          }
        ]
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
        Update: {
          id?: string
          user_id?: string
          credits_purchased?: number
          aud_charged_cents?: number
          stripe_payment_intent_id?: string | null
          created_at?: string
        }
        Relationships: []
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
        Update: {
          id?: string
          user_id?: string | null
          title?: string
          body?: string
          data?: Json | null
          sent_at?: string
          opened_at?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
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
      add_topup_credits: {
        Args: {
          p_user_id: string
          p_subscription_id: string
          p_amount: number
          p_topup_id: string
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
        Args: Record<PropertyKey, never>
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
