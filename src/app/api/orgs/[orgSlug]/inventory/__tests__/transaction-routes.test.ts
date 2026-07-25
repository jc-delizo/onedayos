import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { apiErrors } from '@/kernel/api/errors'

const {
  mockRequireRuntime,
  mockRequireContext,
  mockList,
  mockPost,
} = vi.hoisted(() => ({
  mockRequireRuntime: vi.fn(),
  mockRequireContext: vi.fn(),
  mockList: vi.fn(),
  mockPost: vi.fn(),
}))

vi.mock('@/sdk/server', async () => {
  const route = await vi.importActual<typeof import('@/kernel/api/route')>('@/kernel/api/route')
  const response = await vi.importActual<typeof import('@/kernel/api/response')>('@/kernel/api/response')
  const json = await vi.importActual<typeof import('@/kernel/api/json')>('@/kernel/api/json')
  return {
    sdk: {
      runtime: { requireInventoryV2: mockRequireRuntime },
      auth: { requireApiModuleContext: mockRequireContext },
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

vi.mock('@/modules/inventory/transactions/service', () => ({
  InventoryTransactionService: { list: mockList, post: mockPost },
}))

function request(url: string, init?: RequestInit) {
  return new NextRequest(new Request(url, init))
}

describe('inventory V2 transaction route gates', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireRuntime.mockImplementation(() => undefined)
    mockList.mockResolvedValue({ rows: [], meta: { page: 1, pageSize: 25, total: 0, totalPages: 0 } })
  })

  it('returns safe 404 before auth or database service access when runtime is disabled', async () => {
    mockRequireRuntime.mockImplementation(() => { throw apiErrors.moduleNotFound() })
    const route = await import('../transactions/receipts/route')
    const response = await route.GET(request('http://localhost/api/orgs/acme/inventory/transactions/receipts'), {
      params: Promise.resolve({ orgSlug: 'acme' }),
    })
    expect(response.status).toBe(404)
    expect((await response.json()).error.code).toBe('MODULE_NOT_FOUND')
    expect(mockRequireContext).not.toHaveBeenCalled()
    expect(mockList).not.toHaveBeenCalled()
  })

  it('requires an idempotency header before posting service access', async () => {
    mockRequireContext.mockResolvedValue({ org: { id: 'org-a' } })
    const route = await import('../transactions/receipts/route')
    const response = await route.POST(request('http://localhost/api/orgs/acme/inventory/transactions/receipts', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ warehouseId: 'warehouse-a', lines: [{ productId: 'product-a', quantity: '1', unit: 'pcs' }] }),
    }), { params: Promise.resolve({ orgSlug: 'acme' }) })
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('IDEMPOTENCY_KEY_REQUIRED')
    expect(mockPost).not.toHaveBeenCalled()
  })

  it('rejects recursive tenant identity and unknown create fields', async () => {
    mockRequireContext.mockResolvedValue({ org: { id: 'org-a' } })
    const route = await import('../transactions/receipts/route')
    const response = await route.POST(request('http://localhost/api/orgs/acme/inventory/transactions/receipts', {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'idempotency-key': 'key-a' },
      body: JSON.stringify({ warehouseId: 'warehouse-a', lines: [{ productId: 'product-a', quantity: '1', unit: 'pcs', orgId: 'org-a' }] }),
    }), { params: Promise.resolve({ orgSlug: 'acme' }) })
    expect(response.status).toBe(400)
    expect((await response.json()).error.code).toBe('TENANT_ID_NOT_ALLOWED')
    expect(mockPost).not.toHaveBeenCalled()
  })
})
