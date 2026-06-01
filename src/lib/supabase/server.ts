import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database.types'

// Server-side Supabase client. Use in Server Components, Route Handlers, Server Actions.
// Uses the anon key + user's session cookie. RLS applies.
//
// NOTE: Cast to SupabaseClient<Database> to ensure TypeScript resolves table/query types
// correctly. The @supabase/ssr package imports GenericSchema from a different internal path
// than @supabase/supabase-js, causing type resolution to break for our Database type.
// At runtime this client is identical — it still handles session cookies correctly.
export async function createClient(): Promise<SupabaseClient<Database>> {
  const cookieStore = await cookies()

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: { name: string; value: string; options: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // Ignore: Server Component can't set cookies.
            // Middleware handles session refresh.
          }
        },
      },
    }
  ) as unknown as SupabaseClient<Database>
}
