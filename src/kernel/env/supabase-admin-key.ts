type SupabaseAdminKeyEnv = {
  SUPABASE_SECRET_KEY?: string
  SUPABASE_SERVICE_ROLE_KEY?: string
}

const SAFE_ADMIN_KEY_ERROR =
  'Supabase admin API key is missing or invalid. Configure SUPABASE_SECRET_KEY or a legacy service-role key.'

function isLegacyServiceRoleJwt(value: string): boolean {
  const segments = value.split('.')
  if (segments.length !== 3) return false

  try {
    const header = JSON.parse(Buffer.from(segments[0] ?? '', 'base64url').toString('utf8')) as {
      alg?: unknown
    }
    const payload = JSON.parse(Buffer.from(segments[1] ?? '', 'base64url').toString('utf8')) as {
      role?: unknown
    }

    return header.alg === 'HS256' && payload.role === 'service_role'
  } catch {
    return false
  }
}

export function resolveSupabaseAdminApiKey(env: SupabaseAdminKeyEnv): string {
  const key = env.SUPABASE_SECRET_KEY?.trim() || env.SUPABASE_SERVICE_ROLE_KEY?.trim()

  if (!key || key.startsWith('sb_publishable_')) {
    throw new Error(SAFE_ADMIN_KEY_ERROR)
  }

  if (key.startsWith('sb_secret_')) {
    return key
  }

  if (isLegacyServiceRoleJwt(key)) {
    return key
  }

  throw new Error(SAFE_ADMIN_KEY_ERROR)
}

export function getSupabaseAdminApiKey(): string {
  return resolveSupabaseAdminApiKey({
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
  })
}
