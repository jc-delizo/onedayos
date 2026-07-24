import 'server-only'
import { createClient } from '@supabase/supabase-js'
import { getServerEnv } from '@/kernel/env/server'
import { resolveSupabaseAdminApiKey } from '@/kernel/env/supabase-admin-key'

export function createSupabaseAdminClient() {
  const env = getServerEnv()

  return createClient(env.NEXT_PUBLIC_SUPABASE_URL, resolveSupabaseAdminApiKey(env), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })
}
