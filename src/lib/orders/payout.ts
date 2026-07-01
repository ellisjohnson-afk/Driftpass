import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

type AdminClient = SupabaseClient<Database>

/** Marketplace service types that map to partner_services rows in seed data. */
const SERVICE_TYPE_ALIASES: Record<string, string> = {
  gym_day_pass: 'gym_session',
  coffee: 'cafe_session',
}

export function resolveServiceTypeLookup(serviceType: string | null): string[] {
  if (!serviceType) return []
  const alias = SERVICE_TYPE_ALIASES[serviceType]
  return alias ? [serviceType, alias] : [serviceType]
}

export async function resolvePartnerPayoutCents(
  admin: AdminClient,
  params: {
    partnerId: string | null
    partnerServiceId: string | null
    amountAudCents: number
    serviceType: string | null
  }
): Promise<{ partnerPayoutCents: number; platformFeeCents: number }> {
  const { partnerId, partnerServiceId, amountAudCents, serviceType } = params

  if (partnerServiceId) {
    const { data: service } = await admin
      .from('partner_services')
      .select('aud_payout_cents')
      .eq('id', partnerServiceId)
      .maybeSingle()

    if (service) {
      const partnerPayoutCents = service.aud_payout_cents
      return {
        partnerPayoutCents,
        platformFeeCents: Math.max(amountAudCents - partnerPayoutCents, 0),
      }
    }
  }

  if (partnerId && serviceType) {
    for (const lookupType of resolveServiceTypeLookup(serviceType)) {
      const { data: service } = await admin
        .from('partner_services')
        .select('aud_payout_cents')
        .eq('partner_id', partnerId)
        .eq('service_type', lookupType)
        .eq('is_active', true)
        .maybeSingle()

      if (service) {
        const partnerPayoutCents = service.aud_payout_cents
        return {
          partnerPayoutCents,
          platformFeeCents: Math.max(amountAudCents - partnerPayoutCents, 0),
        }
      }
    }
  }

  const partnerPayoutCents = Math.floor(amountAudCents * 0.8)
  return {
    partnerPayoutCents,
    platformFeeCents: amountAudCents - partnerPayoutCents,
  }
}
