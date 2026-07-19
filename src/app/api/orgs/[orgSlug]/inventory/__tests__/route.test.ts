import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiErrors } from '@/kernel/api/errors'
import type { PlatformContext } from '@/sdk'

const {
  mockCreateStockAdjustment,
  mockGetStockAdjustment,
  mockIsInventoryServiceError,
  mockListStockAdjustments,
  mockRequireApiModuleContext,
} = vi.hoisted(() => ({
  mockCreateStockAdjustment: vi.fn(),
  mockGetStockAdjustment: vi.fn(),
  mockIsInventoryServiceError: vi.fn(),
  mockListStockAdjustments: vi.fn(),
  mockRequireApiModuleContext: vi.fn(),
}))

class FakeInventoryServiceError extends Error {
  constructor(
    message: string,
    public readonly code = 'VALIDATION_ERROR',
    public readonly status = 400,
  ) {
    super(message)
  }
}

vi.mock('@/sdk/server', async () => {
  const route = await vi.importActual<typeof import('@/kernel/api/route')>('@/kernel/api/route')
  const response = await vi.importActual<typeof import('@/kernel/api/response')>('@/kernel/api/response')
  const json = await vi.importActual<typeof import('@/kernel/api/json')>('@/kernel/api/json')

  return {
    sdk: {
      auth: {
        requireApiModuleContext: mockRequireApiModuleContext,
      },
      api: {
        handle: route.withApiHandler,
        ok: response.apiSuccess,
        created: response.apiCreated,
        failure: response.apiFailure,
        parseJsonBody: json.parseStrictJsonBody,
        parseRouteParams: json.parseStrictRouteParams,
        parseSearchParams: json.parseStrictSearchParams,
      },
    },
  }
})

vi.mock('@/modules/inventory/service', () => ({
  InventoryService: {
    createStockAdjustment: mockCreateStockAdjustment,
    getStockAdjustment: mockGetStockAdjustment,
    listStockAdjustments: mockListStockAdjustments,
  },
  isInventoryServiceError: mockIsInventoryServiceError,
}))

function makeRequest(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init))
}

function routeContext<T extends { orgSlug: string; id?: string }>(params: T) {
  return {
    params: Promise.resolve(params),
  }
}

function makeCtx(): PlatformContext {
  return {
    requestId: 'req_inventory',
    auth: { provider: 'supabase', userId: 'user_a', email: 'a@example.com' },
    user: { id: 'user_a', orgId: 'org_a', name: 'User A', email: 'a@example.com', isActive: true },
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
    enabledModules: ['inventory'],
  }
}

describe('inventory API behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApiModuleContext.mockResolvedValue(makeCtx())
    mockListStockAdjustments.mockResolvedValue([])
    mockCreateStockAdjustment.mockResolvedValue({
      id: 'adjustment_a',
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantityBefore: '0',
      quantityAfter: '5',
      quantityDelta: '5',
      reason: 'Opening balance',
      createdAt: '2026-07-08T00:00:00.000Z',
    })
    mockGetStockAdjustment.mockResolvedValue({
      id: 'adjustment_a',
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantityBefore: '0',
      quantityAfter: '5',
      quantityDelta: '5',
      reason: 'Opening balance',
      createdAt: '2026-07-08T00:00:00.000Z',
    })
    mockIsInventoryServiceError.mockImplementation((error) => error instanceof FakeInventoryServiceError)
  })

  it('returns JSON 401 without redirects when unauthenticated', async () => {
    mockRequireApiModuleContext.mockRejectedValue(apiErrors.unauthenticated())
    const route = await import('../stock-adjustments/route')

    const response = await route.GET(
      makeRequest('http://localhost:1320/api/orgs/acme/inventory/stock-adjustments'),
      routeContext({ orgSlug: 'acme' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(payload.error.code).toBe('UNAUTHENTICATED')
    expect(mockListStockAdjustments).not.toHaveBeenCalled()
  })

  it('returns safe 404 when Inventory is disabled for the organization', async () => {
    mockRequireApiModuleContext.mockRejectedValue(apiErrors.moduleNotFound())
    const route = await import('../stock-adjustments/route')

    const response = await route.GET(
      makeRequest('http://localhost:1320/api/orgs/acme/inventory/stock-adjustments'),
      routeContext({ orgSlug: 'acme' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error.code).toBe('MODULE_NOT_FOUND')
  })

  it('rejects client-supplied tenant identity before service calls', async () => {
    const route = await import('../stock-adjustments/route')

    const response = await route.POST(
      makeRequest('http://localhost:1320/api/orgs/acme/inventory/stock-adjustments', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product_a',
          warehouseId: 'warehouse_a',
          quantityAfter: '5',
          reason: 'Opening balance',
          orgId: 'org_b',
        }),
      }),
      routeContext({ orgSlug: 'acme' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error.code).toBe('TENANT_ID_NOT_ALLOWED')
    expect(mockCreateStockAdjustment).not.toHaveBeenCalled()
  })

  it('rejects query-string tenant identity before list service calls', async () => {
    const route = await import('../stock-adjustments/route')

    const response = await route.GET(
      makeRequest('http://localhost:1320/api/orgs/acme/inventory/stock-adjustments?orgId=org_b'),
      routeContext({ orgSlug: 'acme' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error.code).toBe('TENANT_ID_NOT_ALLOWED')
    expect(mockListStockAdjustments).not.toHaveBeenCalled()
  })

  it('maps malformed JSON to BAD_REQUEST without service calls', async () => {
    const route = await import('../stock-adjustments/route')

    const response = await route.POST(
      makeRequest('http://localhost:1320/api/orgs/acme/inventory/stock-adjustments', {
        method: 'POST',
        body: '{',
        headers: {
          'content-type': 'application/json',
        },
      }),
      routeContext({ orgSlug: 'acme' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error.code).toBe('BAD_REQUEST')
    expect(mockCreateStockAdjustment).not.toHaveBeenCalled()
  })

  it('rejects unknown body keys through strict schemas', async () => {
    const route = await import('../stock-adjustments/route')

    const response = await route.POST(
      makeRequest('http://localhost:1320/api/orgs/acme/inventory/stock-adjustments', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product_a',
          warehouseId: 'warehouse_a',
          quantityAfter: '5',
          reason: 'Opening balance',
          clientComputedBalanceAfter: '5',
        }),
      }),
      routeContext({ orgSlug: 'acme' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error.code).toBe('VALIDATION_ERROR')
    expect(mockCreateStockAdjustment).not.toHaveBeenCalled()
  })

  it('validates item route params before item service calls', async () => {
    const route = await import('../stock-adjustments/[id]/route')

    const response = await route.GET(
      makeRequest('http://localhost:1320/api/orgs/acme/inventory/stock-adjustments/%20%20'),
      routeContext({ orgSlug: 'acme', id: '  ' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error.code).toBe('VALIDATION_ERROR')
    expect(mockRequireApiModuleContext).toHaveBeenCalledOnce()
    expect(mockGetStockAdjustment).not.toHaveBeenCalled()
  })

  it('maps validation and permission failures to JSON envelopes', async () => {
    const route = await import('../stock-adjustments/route')
    const invalid = await route.POST(
      makeRequest('http://localhost:1320/api/orgs/acme/inventory/stock-adjustments', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product_a',
          warehouseId: 'warehouse_a',
          quantityAfter: '5',
          reason: 'x',
        }),
      }),
      routeContext({ orgSlug: 'acme' }),
    )
    const invalidPayload = await invalid.json()

    expect(invalid.status).toBe(400)
    expect(invalidPayload.error.code).toBe('VALIDATION_ERROR')

    mockCreateStockAdjustment.mockRejectedValueOnce(apiErrors.forbidden())
    const forbidden = await route.POST(
      makeRequest('http://localhost:1320/api/orgs/acme/inventory/stock-adjustments', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product_a',
          warehouseId: 'warehouse_a',
          quantityAfter: '5',
          reason: 'Opening balance',
        }),
      }),
      routeContext({ orgSlug: 'acme' }),
    )
    const forbiddenPayload = await forbidden.json()

    expect(forbidden.status).toBe(403)
    expect(forbiddenPayload.error.code).toBe('FORBIDDEN')
  })

  it('maps Inventory service domain errors without leaking stack traces', async () => {
    mockCreateStockAdjustment.mockRejectedValueOnce(
      new FakeInventoryServiceError('Product was not found for this organization.', 'NOT_FOUND', 404),
    )
    const route = await import('../stock-adjustments/route')

    const response = await route.POST(
      makeRequest('http://localhost:1320/api/orgs/acme/inventory/stock-adjustments', {
        method: 'POST',
        body: JSON.stringify({
          productId: 'product_b',
          warehouseId: 'warehouse_a',
          quantityAfter: '5',
          reason: 'Opening balance',
        }),
      }),
      routeContext({ orgSlug: 'acme' }),
    )
    const payload = await response.json()

    expect(response.status).toBe(404)
    expect(payload.error.code).toBe('NOT_FOUND')
    expect(payload.error.message).toBe('Product was not found for this organization.')
    expect(JSON.stringify(payload)).not.toContain('stack')
  })
})
