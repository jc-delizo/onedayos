import { describe, expect, it } from 'vitest'
import type { PlatformContext } from './types'
import { markPlatformContext } from '@/kernel/context/platform-context'
import { sdk } from './server'

function makeCtx(): PlatformContext {
  return markPlatformContext({
    requestId: 'req_a',
    auth: { provider: 'supabase', userId: 'user_a', email: 'a@example.com' },
    user: { id: 'user_a', orgId: 'org_a', name: 'A', email: 'a@example.com', isActive: true },
    org: {
      id: 'org_a',
      slug: 'acme',
      name: 'Acme',
      isActive: true,
      status: 'ACTIVE',
      subscriptionStatus: 'TRIAL',
      plan: 'foundation',
    },
    roles: [],
    permissions: [],
    enabledModules: [],
  })
}

describe('server SDK', () => {
  it('returns tenant database access for verified PlatformContext', () => {
    const db = sdk.getDb(makeCtx())

    expect(db.orgId).toBe('org_a')
    expect(db.prisma).toBeDefined()
  })

  it('blocks sdk.getDb with a loose orgId string', () => {
    expect(() => sdk.getDb('org_a' as never)).toThrow('verified PlatformContext')
  })

  it('blocks similarly-shaped fake PlatformContext objects without Kernel branding', () => {
    const fakeCtx = {
      ...makeCtx(),
    }

    expect(() => sdk.getDb(fakeCtx)).toThrow('verified PlatformContext')
  })
})
