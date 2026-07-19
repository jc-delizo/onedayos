'use client'

import { createBrowserClient } from '@supabase/ssr'
import { getSdkClientEnv } from './client-env'
import type { ApiResponse } from './api-types'

function createClientSupabase() {
  const env = getSdkClientEnv()
  return createBrowserClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY)
}

async function getCurrentUser() {
  const response = await fetch('/api/kernel/auth/me', {
    headers: {
      accept: 'application/json',
    },
  })

  return (await response.json()) as ApiResponse<unknown>
}

export const sdkClient = {
  auth: {
    createClient: createClientSupabase,
    getCurrentUser,
  },
}
