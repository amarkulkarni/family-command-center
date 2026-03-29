import { createClient as createSupabaseClient } from '@supabase/supabase-js'

/**
 * Create a basic Supabase client for server-side use
 * For pages/routes that need to verify user auth
 */
export function createClient() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  )
}
