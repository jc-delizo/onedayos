import { describe, expect, it } from 'vitest'
import { resolveSupabaseAdminApiKey } from './supabase-admin-key'

function legacyJwt(role = 'service_role', algorithm = 'HS256'): string {
  const header = Buffer.from(JSON.stringify({ alg: algorithm, typ: 'JWT' })).toString('base64url')
  const payload = Buffer.from(JSON.stringify({ role, ref: 'sandbox' })).toString('base64url')
  return `${header}.${payload}.test-signature`
}

describe('Supabase admin API key resolution', () => {
  it('prefers the canonical opaque secret key without JWT decoding', () => {
    const secret = 'sb_secret_canonical-test-value'

    expect(resolveSupabaseAdminApiKey({
      SUPABASE_SECRET_KEY: secret,
      SUPABASE_SERVICE_ROLE_KEY: legacyJwt(),
    })).toBe(secret)
  })

  it('falls back to a legacy HS256 service-role JWT', () => {
    const legacy = legacyJwt()

    expect(resolveSupabaseAdminApiKey({ SUPABASE_SERVICE_ROLE_KEY: legacy })).toBe(legacy)
  })

  it.each([
    {},
    { SUPABASE_SECRET_KEY: 'sb_publishable_not-an-admin-key' },
    { SUPABASE_SECRET_KEY: legacyJwt('anon') },
    { SUPABASE_SECRET_KEY: legacyJwt('service_role', 'ES256') },
    { SUPABASE_SECRET_KEY: 'arbitrary-access-token' },
  ])('rejects missing, publishable, user, ES256, and arbitrary keys safely', (env) => {
    expect(() => resolveSupabaseAdminApiKey(env)).toThrow('Supabase admin API key is missing or invalid')
  })

  it('does not include rejected key material in its error', () => {
    const rejected = 'sb_publishable_sensitive-test-material'

    try {
      resolveSupabaseAdminApiKey({ SUPABASE_SECRET_KEY: rejected })
      throw new Error('Expected the key resolver to reject a publishable key.')
    } catch (error) {
      expect(error).toBeInstanceOf(Error)
      expect((error as Error).message).not.toContain(rejected)
    }
  })
})
