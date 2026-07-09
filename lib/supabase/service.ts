import { createClient } from '@supabase/supabase-js'

/**
 * Creates a Supabase client using the SERVICE_ROLE key.
 * ⚠️ WARNING: This client bypasses Row Level Security (RLS).
 * Only use this in secure server environments (Server Actions, API Routes)
 * for actions that the regular user client cannot perform (e.g. administrative tasks,
 * system-level checks, or initial storage provisioning).
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
