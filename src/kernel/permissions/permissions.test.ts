import { describe, expect, it } from 'vitest'
import type { PlatformContext } from '@/sdk'
import { markPlatformContext } from '@/kernel/context/platform-context'
import { can } from './match'
import { requirePermission } from './enforce'

function makeCtx(overrides: Partial<PlatformContext> = {}): PlatformContext {
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
    roles: [{ id: 'role_admin', name: 'Admin', isSystem: true }],
    permissions: [
      {
        id: 'perm_admin',
        roleId: 'role_admin',
        orgId: 'org_a',
        module: '*',
        resource: '*',
        action: '*',
        conditions: null,
      },
    ],
    enabledModules: ['inventory'],
    ...overrides,
  })
}

describe('permissions', () => {
  it('allows wildcard Admin permission inside the verified tenant', () => {
    const ctx = makeCtx()

    expect(can(ctx, { module: 'inventory', resource: 'product', action: 'delete' })).toBe(true)
  })

  it('does not let wildcard permissions bypass tenant isolation', () => {
    const ctx = makeCtx({
      permissions: [
        {
          id: 'perm_other',
          roleId: 'role_other',
          orgId: 'org_b',
          module: '*',
          resource: '*',
          action: '*',
          conditions: null,
        },
      ],
    })

    expect(can(ctx, { module: 'inventory', resource: 'product', action: 'read' })).toBe(false)
  })

  it('denies conditional permissions until ABAC exists', () => {
    const ctx = makeCtx({
      permissions: [
        {
          id: 'perm_conditional',
          roleId: 'role_limited',
          orgId: 'org_a',
          module: 'inventory',
          resource: 'product',
          action: 'read',
          conditions: { scope: 'own_branch' },
        },
      ],
    })

    expect(can(ctx, { module: 'inventory', resource: 'product', action: 'read' })).toBe(false)
  })

  it('throws JSON-mappable 403 for missing permission', async () => {
    const ctx = makeCtx({ permissions: [] })

    await expect(requirePermission(ctx, { module: 'kernel', resource: 'users', action: 'manage' })).rejects.toMatchObject({
      code: 'FORBIDDEN',
      status: 403,
    })
  })
})
