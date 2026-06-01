import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Service-role admin client. ONLY use in:
// - Stripe webhook handlers
// - Background jobs
// - Admin API routes (behind ADMIN_SECRET check)
// NEVER expose to client or use in user-facing routes.
export function createAdminClient() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set')
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
