import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { apiErrors } from '@/kernel/api/errors'
import type { PlatformContext } from '@/sdk'
import {
  createBusinessObjectCollectionHandlers,
  createBusinessObjectItemHandlers,
} from '../shared/api-routes'
import { CUSTOMER_PERMISSIONS } from '../customer'
import { createCustomerSchema, customerListQuerySchema, updateCustomerSchema } from '../customer/schema'

const { mockRequireApiOrgContext, mockRequirePermission } = vi.hoisted(() => ({
  mockRequireApiOrgContext: vi.fn(),
  mockRequirePermission: vi.fn(),
}))

vi.mock('@/sdk/server', async () => {
  const route = await vi.importActual<typeof import('@/kernel/api/route')>('@/kernel/api/route')
  const response = await vi.importActual<typeof import('@/kernel/api/response')>('@/kernel/api/response')
  const json = await vi.importActual<typeof import('@/kernel/api/json')>('@/kernel/api/json')

  return {
    sdk: {
      auth: {
        requireApiOrgContext: mockRequireApiOrgContext,
      },
      permissions: {
        require: mockRequirePermission,
      },
      api: {
        handle: route.withApiHandler,
        ok: response.apiSuccess,
        created: response.apiCreated,
        parseJsonBody: json.parseStrictJsonBody,
        parseSearchParams: json.parseStrictSearchParams,
      },
    },
  }
})

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init))
}

function routeContext(params: { orgSlug: string }) {
  return {
    params: Promise.resolve(params),
  }
}

function itemRouteContext(params: { orgSlug: string; id: string }) {
  return {
    params: Promise.resolve(params),
  }
}

function makeCtx(): PlatformContext {
  return {
    requestId: 'req_api',
    auth: { provider: 'supabase', userId: 'user_a', email: 'a@example.com' },
    user: { id: 'user_a', orgId: 'org_a', name: 'A', email: 'a@example.com', isActive: true },
    org: {
      id: 'org_a',
      slug: 'acme',
      name: 'Acme',
      isActive: true,
      status: 'ACTIVE',
      subscriptionStatus: 'ACTIVE',
      plan: 'foundation',
    },
    roles: [],
    permissions: [],
    enabledModules: [],
  }
}

describe('Business Object API behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApiOrgContext.mockResolvedValue(makeCtx())
    mockRequirePermission.mockResolvedValue(undefined)
  })

  it('returns JSON 401 without redirect when unauthenticated', async () => {
    mockRequireApiOrgContext.mockRejectedValue(apiErrors.unauthenticated())
    const service = { list: vi.fn(), create: vi.fn() }
    const handlers = createBusinessObjectCollectionHandlers({
      listSchema: customerListQuerySchema,
      createSchema: createCustomerSchema,
      service,
      permissions: CUSTOMER_PERMISSIONS,
    })

    const response = await handlers.GET(
      makeRequest('http://localhost:1320/api/orgs/acme/objects/customers'),
      routeContext({ orgSlug: 'acme' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(payload.error.code).toBe('UNAUTHENTICATED')
    expect(service.list).not.toHaveBeenCalled()
  })

  it('returns JSON 403 when permission is missing', async () => {
    mockRequirePermission.mockRejectedValue(apiErrors.forbidden())
    const service = { list: vi.fn(), create: vi.fn() }
    const handlers = createBusinessObjectCollectionHandlers({
      listSchema: customerListQuerySchema,
      createSchema: createCustomerSchema,
      service,
      permissions: CUSTOMER_PERMISSIONS,
    })

    const response = await handlers.GET(
      makeRequest('http://localhost:1320/api/orgs/acme/objects/customers'),
      routeContext({ orgSlug: 'acme' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(payload.error.code).toBe('FORBIDDEN')
    expect(service.list).not.toHaveBeenCalled()
  })

  it('rejects client-supplied tenant identity before service calls', async () => {
    const service = { list: vi.fn(), create: vi.fn() }
    const handlers = createBusinessObjectCollectionHandlers({
      listSchema: customerListQuerySchema,
      createSchema: createCustomerSchema,
      service,
      permissions: CUSTOMER_PERMISSIONS,
    })

    const response = await handlers.POST(
      makeRequest('http://localhost:1320/api/orgs/acme/objects/customers', {
        method: 'POST',
        body: JSON.stringify({ name: 'Acme', orgId: 'org_b' }),
      }),
      routeContext({ orgSlug: 'acme' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error.code).toBe('TENANT_ID_NOT_ALLOWED')
    expect(service.create).not.toHaveBeenCalled()
  })

  it('returns safe JSON 404 for wrong-org or missing records', async () => {
    const service = {
      getById: vi.fn().mockRejectedValue(apiErrors.notFound()),
      update: vi.fn(),
      softDelete: vi.fn(),
    }
    const handlers = createBusinessObjectItemHandlers({
      updateSchema: updateCustomerSchema,
      service,
      permissions: CUSTOMER_PERMISSIONS,
    })

    const response = await handlers.GET(
      makeRequest('http://localhost:1320/api/orgs/acme/objects/customers/customer_b'),
      itemRouteContext({ orgSlug: 'acme', id: 'customer_b' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error.code).toBe('NOT_FOUND')
    expect(service.getById).toHaveBeenCalledWith(expect.anything(), 'customer_b')
  })

  it('maps invalid route params to VALIDATION_ERROR', async () => {
    const service = { getById: vi.fn(), update: vi.fn(), softDelete: vi.fn() }
    const handlers = createBusinessObjectItemHandlers({
      updateSchema: z.strictObject({ name: z.string() }),
      service,
      permissions: CUSTOMER_PERMISSIONS,
    })

    const response = await handlers.GET(
      makeRequest('http://localhost:1320/api/orgs/acme/objects/customers/%20'),
      itemRouteContext({ orgSlug: 'acme', id: '' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error.code).toBe('VALIDATION_ERROR')
    expect(service.getById).not.toHaveBeenCalled()
  })
})
