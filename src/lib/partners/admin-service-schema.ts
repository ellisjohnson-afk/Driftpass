import { z } from 'zod'

export const AdminPartnerServiceSchema = z.object({
  service_type: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9_]+$/, 'Use lowercase letters, numbers, and underscores'),
  name: z.string().min(2).max(120),
  credit_cost: z.number().int().min(1).max(999),
  aud_payout_cents: z.number().int().min(0).max(999_999),
  max_daily_redemptions: z.number().int().min(1).nullable().optional(),
  is_active: z.boolean().default(true),
})

export const AdminPartnerServiceUpdateSchema = AdminPartnerServiceSchema.partial()

export type AdminPartnerServiceInput = z.infer<typeof AdminPartnerServiceSchema>
