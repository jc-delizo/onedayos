import 'server-only'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './server'
import { apiErrors } from '@/kernel/api/errors'

export async function getApiAuthUser(): Promise<SupabaseUser | null> {
  const supabase = await createSupabaseServerClient()
  const { data, error } = await supabase.auth.getUser()

  if (error || !data.user) {
    return null
  }

  return data.user
}

export async function requireApiAuth(): Promise<SupabaseUser> {
  const user = await getApiAuthUser()

  if (!user) {
    throw apiErrors.unauthenticated()
  }

  return user
}
