import { describe, expect, it, vi } from 'vitest'
import { ApiException } from '@/kernel/api/errors'
import { parseStrictJsonBody } from '@/kernel/api/json'
import { registerFoundationAccount, registerInputSchema, type RegistrationDeps } from './registration'

function makeDeps(overrides: Partial<RegistrationDeps> = {}) {
  const created = {
    organization: vi.fn(async () => ({ id: 'org_a', slug: 'acme-abc123', name: 'Acme' })),
    user: vi.fn(async () => ({ id: 'auth_a', name: 'Admin User', email: 'admin@example.com' })),
    role: vi.fn(async () => ({ id: 'role_admin', name: 'Admin' })),
    permission: vi.fn(async () => ({
      id: 'perm_admin',
      module: '*',
      resource: '*',
      action: '*',
    })),
    userRole: vi.fn(async () => ({})),
  }
  const tx = {
    organization: { create: created.organization },
    user: { create: created.user },
    role: { create: created.role },
    permission: { create: created.permission },
    userRole: { create: created.userRole },
  }
  const deps: RegistrationDeps & { created: typeof created } = {
    admin: {
      auth: {
        admin: {
          createUser: vi.fn(async () => ({ data: { user: { id: 'auth_a', email: 'admin@example.com' } }, error: null })),
          deleteUser: vi.fn(async () => ({ error: null })),
        },
      },
    },
    db: {
      $transaction: vi.fn(async (callback) => callback(tx)),
    },
    slugSuffix: () => 'abc123',
    created,
    ...overrides,
  }

  return deps
}

describe('server-owned registration', () => {
  it('rejects unknown keys through the strict registration schema', () => {
    const parsed = registerInputSchema.safeParse({
      orgName: 'Acme',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password-123',
      unexpected: true,
    })

    expect(parsed.success).toBe(false)
  })

  it('rejects submitted orgId before registration starts', async () => {
    const request = new Request('http://localhost:1320/api/kernel/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        orgName: 'Acme',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password-123',
        orgId: 'org_a',
      }),
    })

    await expect(parseStrictJsonBody(request, registerInputSchema)).rejects.toMatchObject({
      code: 'TENANT_ID_NOT_ALLOWED',
    })
  })

  it('creates organization, subscription, user, Admin role, assignment, and wildcard permission', async () => {
    const deps = makeDeps()
    const result = await registerFoundationAccount(
      {
        orgName: 'Acme',
        name: 'Admin User',
        email: 'admin@example.com',
        password: 'password-123',
      },
      deps,
    )

    expect(deps.admin.auth.admin.createUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email: 'admin@example.com',
        email_confirm: true,
      }),
    )
    expect(deps.created.organization).toHaveBeenCalledWith({
      data: expect.objectContaining({
        name: 'Acme',
        slug: 'acme-abc123',
        subscription: { create: { plan: 'foundation', status: 'TRIAL' } },
      }),
    })
    expect(deps.created.permission).toHaveBeenCalledWith({
      data: {
        orgId: 'org_a',
        roleId: 'role_admin',
        module: '*',
        resource: '*',
        action: '*',
        conditions: null,
      },
    })
    expect(deps.created.userRole).toHaveBeenCalledWith({
      data: {
        orgId: 'org_a',
        userId: 'auth_a',
        roleId: 'role_admin',
        createdBy: 'auth_a',
      },
    })
    expect(result.role.name).toBe('Admin')
  })

  it('rolls back the Supabase Auth user when the Prisma transaction fails', async () => {
    const deps = makeDeps({
      db: {
        $transaction: vi.fn(async () => {
          throw new Error('database failed')
        }),
      },
    })

    await expect(
      registerFoundationAccount(
        {
          orgName: 'Acme',
          name: 'Admin User',
          email: 'admin@example.com',
          password: 'password-123',
        },
        deps,
      ),
    ).rejects.toBeInstanceOf(ApiException)
    expect(deps.admin.auth.admin.deleteUser).toHaveBeenCalledWith('auth_a')
  })
})
