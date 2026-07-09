import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase service-role client for server-side access.
 *
 * @returns A Supabase client configured with the service role key.
 * @throws Error if the Supabase URL or service role key environment variable is missing.
 */
export function createServiceClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error('Missing Supabase Service Role environment variables.')
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  })
}
