import { describe, expect, it } from 'vitest'
import type { ModuleManifest, PlatformContext } from '@/sdk'
import { createModuleRegistry, validateModuleManifests } from './registry'

function makeManifest(overrides: Partial<ModuleManifest> = {}): ModuleManifest {
  const id = overrides.id ?? 'sample-module'
  const readPermission = {
    module: id,
    resource: 'sample_record',
    action: 'read',
    label: 'Read sample records',
    description: 'Allows reading sample records.',
  }

  return {
    schemaVersion: '1',
    id,
    label: 'Sample Module',
    description: 'Sample module.',
    version: '0.1.0',
    lifecycle: 'draft',
    compatibility: {
      platform: { min: '0.1.0', max: null },
      sdk: { min: '0.1.0', max: null },
      manifest: { min: '1.0.0', max: null },
    },
    icon: 'Box',
    dependencies: [],
    businessObjectsUsed: [],
    ownedEntities: [],
    permissions: [readPermission],
    navItems: [
      {
        key: `${id}.home`,
        label: 'Sample Module',
        href: `/${id}`,
        icon: 'Box',
        requiredPermission: readPermission,
      },
    ],
    routes: [
      {
        kind: 'page',
        path: `/${id}`,
        label: 'Sample Module',
        requiredPermission: readPermission,
      },
    ],
    apis: [
      {
        method: 'GET',
        path: `/api/orgs/[orgSlug]/${id}`,
        requiredPermission: readPermission,
      },
    ],
    events: {
      emits: [{ name: `${id}.sample_record.created`, description: 'Sample record was created.' }],
      listens: [],
    },
    settings: [],
    aiContext: {
      description: 'Sample module.',
      businessPurpose: 'Testing.',
      commonQuestions: [],
      supportedActions: [],
      forbiddenActions: [],
    },
    docs: {
      readme: `src/modules/${id}/README.md`,
      manual: `src/modules/${id}/docs.md`,
    },
    ...overrides,
  }
}

function makeCtx(overrides: Partial<PlatformContext> = {}): PlatformContext {
  return {
    requestId: 'req_a',
    auth: { provider: 'supabase', userId: 'user_a', email: 'a@example.com' },
    user: { id: 'user_a', orgId: 'org_a', name: 'User A', email: 'a@example.com', isActive: true },
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
    enabledModules: ['sample-module'],
    ...overrides,
  }
}

describe('module registry', () => {
  it('validates a declarative manifest contract', () => {
    expect(validateModuleManifests([makeManifest()])).toEqual({ ok: true, errors: [] })
  })

  it('rejects action arrays, wildcard permissions, invalid events, and unsafe API routes', () => {
    const result = validateModuleManifests([
      makeManifest({
        permissions: ['read'] as never,
        apis: [
          {
            method: 'GET',
            path: '/api/sample-module',
            requiredPermission: { module: 'sample-module', resource: '*', action: 'read' },
          },
        ],
        events: {
          emits: [{ name: 'sample-module.createRecord', description: 'Invalid event.' }],
          listens: [],
        },
      }),
      makeManifest({
        id: 'wild-module',
        permissions: [
          {
            module: 'wild-module',
            resource: '*',
            action: 'read',
            label: 'Wildcard read',
            description: 'Invalid wildcard permission.',
          },
        ],
      }),
    ])

    expect(result.ok).toBe(false)
    expect(result.errors.map((error) => error.message)).toEqual(
      expect.arrayContaining([
        'permissions[0] must use a full permission object.',
        'permissions[0] must not declare wildcard permissions.',
        'apis[0] must use the tenant-scoped module API route.',
        'apis[0] requiredPermission must be declared by the manifest.',
        'Event sample-module.createRecord must follow namespace.entity.past_tense_verb.',
      ]),
    )
  })

  it('keeps code registration separate from database enablement and permissions', async () => {
    const registry = createModuleRegistry([makeManifest(), makeManifest({ id: 'other-module' })])
    const ctx = makeCtx({
      enabledModules: ['sample-module'],
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
    })

    await expect(registry.getEnabledForOrg(ctx)).resolves.toHaveLength(1)
    await expect(registry.getVisibleForUser(ctx)).resolves.toEqual([
      expect.objectContaining({
        manifest: expect.objectContaining({ id: 'sample-module' }),
      }),
    ])
    await expect(registry.assertEnabled(ctx, 'other-module')).rejects.toMatchObject({
      code: 'MODULE_DISABLED',
    })
  })

  it('rejects missing dependencies and duplicate ids', () => {
    const result = validateModuleManifests([
      makeManifest({ dependencies: ['missing-module'] }),
      makeManifest({ id: 'sample-module' }),
    ])

    expect(result.ok).toBe(false)
    expect(result.errors.map((error) => error.message)).toEqual(
      expect.arrayContaining(['Dependency missing-module is not registered.', 'Module id must be unique.']),
    )
  })
})
