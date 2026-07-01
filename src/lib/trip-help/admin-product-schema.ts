import { z } from 'zod'

const optionalText = z
  .union([z.string(), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value))

const optionalFeatures = z
  .union([z.array(z.string()), z.string()])
  .optional()
  .transform((value) => {
    if (Array.isArray(value)) return value.filter(Boolean)
    if (!value?.trim()) return []
    return value
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
  })

export const AdminTripHelpProductSchema = z.object({
  product_type: z.enum(['trip_help', 'marketplace']),
  section: z.enum(['utilities', 'marketplace']),
  slug: z
    .string()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  name: z.string().min(2).max(120),
  short_label: optionalText,
  tagline: optionalText,
  description: z.string().max(2000).default(''),
  features: optionalFeatures,
  partner_id: z.string().uuid().nullable().optional(),
  service_type: optionalText,
  price_aud_cents: z.number().int().min(0).nullable().optional(),
  expiry_hours: z.number().int().min(0).default(24),
  price_label: z.string().min(1).max(40),
  price_subtext: optionalText,
  hours_label: optionalText,
  meeting_note: optionalText,
  emoji: optionalText,
  hub_slug: optionalText,
  sort_order: z.number().int().min(0).default(0),
  is_active: z.boolean().default(true),
  is_purchasable: z.boolean().default(true),
})

export const AdminTripHelpProductUpdateSchema = AdminTripHelpProductSchema.partial()

export type AdminTripHelpProductInput = z.infer<typeof AdminTripHelpProductSchema>
