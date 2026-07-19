import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiErrors } from '@/kernel/api/errors'

const { mockPrisma, mockRequireApiAuth } = vi.hoisted(() => ({
  mockRequireApiAuth: vi.fn(),
  mockPrisma: {
    user: {
      findUnique: vi.fn(),
    },
    organization: {
      findUnique: vi.fn(),
    },
    userRole: {
      findMany: vi.fn(),
    },
  },
}))

vi.mock('@/kernel/auth/api', () => ({
  requireApiAuth: mockRequireApiAuth,
}))

vi.mock('@/kernel/db/client', () => ({
  prisma: mockPrisma,
}))

describe('PlatformContext resolution', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApiAuth.mockResolvedValue({ id: 'user_a', email: 'a@example.com' })
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user_a',
      orgId: 'org_a',
      name: 'User A',
      email: 'a@example.com',
      isActive: true,
    })
    mockPrisma.organization.findUnique.mockResolvedValue({
      id: 'org_a',
      slug: 'acme',
      name: 'Acme',
      status: 'ACTIVE',
      isActive: true,
      subscription: { status: 'TRIAL', plan: 'foundation' },
      modules: [{ moduleId: 'inventory' }],
    })
    mockPrisma.userRole.findMany.mockResolvedValue([
      {
        role: {
          id: 'role_admin',
          name: 'Admin',
          isSystem: true,
          isActive: true,
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
        },
      },
    ])
  })

  it('creates verified context only after matching user and organization', async () => {
    const { requireApiOrgContext } = await import('./api-org-context')
    const ctx = await requireApiOrgContext('acme', { requestId: 'req_a' })

    expect(ctx.user.orgId).toBe('org_a')
    expect(ctx.org.id).toBe('org_a')
    expect(ctx.permissions).toHaveLength(1)
    expect(ctx.enabledModules).toEqual(['inventory'])
  })

  it('returns safe 404 for wrong-org access', async () => {
    mockPrisma.organization.findUnique.mockResolvedValueOnce({
      id: 'org_b',
      slug: 'beta',
      name: 'Beta',
      status: 'ACTIVE',
      isActive: true,
      subscription: { status: 'TRIAL', plan: 'foundation' },
      modules: [],
    })
    const { requireApiOrgContext } = await import('./api-org-context')

    await expect(requireApiOrgContext('beta')).rejects.toMatchObject({
      code: 'ORG_NOT_FOUND',
      status: 404,
    })
  })

  it('prevents user from Org A accessing Org B', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user_a',
      orgId: 'org_a',
      name: 'User A',
      email: 'a@example.com',
      isActive: true,
    })
    mockPrisma.organization.findUnique.mockResolvedValueOnce({
      id: 'org_b',
      slug: 'beta',
      name: 'Beta',
      status: 'ACTIVE',
      isActive: true,
      subscription: { status: 'TRIAL', plan: 'foundation' },
      modules: [],
    })
    const { requireApiOrgContext } = await import('./api-org-context')

    await expect(requireApiOrgContext('beta')).rejects.toMatchObject({
      code: 'ORG_NOT_FOUND',
      status: 404,
    })
  })

  it('keeps module enablement separate from permission', async () => {
    mockPrisma.organization.findUnique.mockResolvedValueOnce({
      id: 'org_a',
      slug: 'acme',
      name: 'Acme',
      status: 'ACTIVE',
      isActive: true,
      subscription: { status: 'TRIAL', plan: 'foundation' },
      modules: [],
    })
    const { requireApiOrgContext } = await import('./api-org-context')

    await expect(requireApiOrgContext('acme', { moduleId: 'inventory' })).rejects.toMatchObject({
      code: 'MODULE_DISABLED',
      status: 403,
    })
  })

  it('returns JSON-mappable 403 when the platform user is inactive', async () => {
    mockPrisma.user.findUnique.mockResolvedValueOnce({
      id: 'user_a',
      orgId: 'org_a',
      name: 'User A',
      email: 'a@example.com',
      isActive: false,
    })
    const { requireApiOrgContext } = await import('./api-org-context')

    await expect(requireApiOrgContext('acme')).rejects.toMatchObject({
      code: apiErrors.userInactive().code,
      status: 403,
    })
  })
})
