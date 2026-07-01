import { z } from 'zod'

const partnerCategorySchema = z.enum([
  'gym_fitness',
  'cafe_cowork',
  'laundry',
  'luggage_storage',
  'shower',
  'scooter_hire',
  'water_fill',
  'accommodation',
  'restaurant',
  'mechanic',
  'kitchen',
  'ev_charging',
  'events',
  'tours',
  'other',
])

const optionalUrl = z
  .union([z.string().url(), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value))

const optionalEmail = z
  .union([z.string().email(), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value))

const optionalText = z
  .union([z.string(), z.literal(''), z.null()])
  .optional()
  .transform((value) => (value === '' || value === undefined ? null : value))

const optionalLatLng = z
  .union([z.number(), z.literal(''), z.null()])
  .optional()
  .transform((value) => {
    if (value === '' || value === undefined || value === null) return null
    return value
  })

export const AdminPartnerSchema = z.object({
  name: z.string().min(2).max(100),
  slug: z
    .string()
    .min(2)
    .max(100)
    .regex(/^[a-z0-9-]+$/, 'Slug must be lowercase letters, numbers, and hyphens'),
  description: optionalText,
  category: partnerCategorySchema,
  address: z.string().min(5).max(200),
  city: z.string().min(2).max(80),
  state: z.string().min(2).max(20).default('QLD'),
  country: z.string().min(2).max(2).default('AU'),
  lat: optionalLatLng,
  lng: optionalLatLng,
  phone: optionalText,
  email: optionalEmail,
  website: optionalUrl,
  logo_url: optionalUrl,
  timezone: z.string().min(1).default('Australia/Brisbane'),
  is_active: z.boolean().default(true),
  is_verified: z.boolean().default(false),
  is_featured: z.boolean().default(false),
})

export const AdminPartnerUpdateSchema = AdminPartnerSchema.partial()

export type AdminPartnerInput = z.infer<typeof AdminPartnerSchema>
