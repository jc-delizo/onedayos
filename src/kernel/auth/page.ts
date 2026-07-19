import 'server-only'
import { redirect } from 'next/navigation'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import { createSupabaseServerClient } from './server'

export async function requirePageAuth(): Promise<SupabaseUser> {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getUser()

  if (!data.user) {
    redirect('/login')
  }

  return data.user
}
