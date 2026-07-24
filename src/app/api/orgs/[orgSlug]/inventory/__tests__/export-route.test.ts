import { NextRequest } from 'next/server'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import { apiErrors } from '@/kernel/api/errors'
import { createTableExportRequestSchema } from '@/platform/table-export/schema'

const {
  mockRequireAll,
  mockRequireApiModuleContext,
} = vi.hoisted(() => ({
  mockRequireAll: vi.fn(),
  mockRequireApiModuleContext: vi.fn(),
}))

vi.mock('@/sdk/server', async () => {
  const route = await vi.importActual<typeof import('@/kernel/api/route')>('@/kernel/api/route')
  const json = await vi.importActual<typeof import('@/kernel/api/json')>('@/kernel/api/json')
  return {
    sdk: {
      auth: {
        requireApiModuleContext: mockRequireApiModuleContext,
      },
      permissions: {
        requireAll: mockRequireAll,
      },
      api: {
        handle: route.withApiHandler,
        parseJsonBody: json.parseStrictJsonBody,
      },
    },
  }
})

vi.mock('@/platform/table-export/resources', () => ({
  inventoryExportResource: () => ({
    readPermission: { module: 'inventory', resource: 'stock_level', action: 'read' },
    exportPermission: { module: 'inventory', resource: 'stock_level', action: 'export' },
    requestSchema: createTableExportRequestSchema(
      z.strictObject({ q: z.string().optional() }),
      ['name'],
    ),
    config: {
      resource: 'stock-levels',
      worksheetName: 'Stock Levels',
      defaultColumns: ['name'],
      columns: [{ id: 'name', header: 'Name', getValue: (row: { name: string }) => row.name, required: true }],
      getRowId: (row: { id: string }) => row.id,
      loadPage: async () => ({ rows: [{ id: 'one', name: 'Coffee' }], total: 1 }),
    },
  }),
  objectExportResource: vi.fn(),
  organizationExportResource: vi.fn(),
}))

function request(body: unknown) {
  return new NextRequest('http://localhost:1320/api/orgs/acme/inventory/stock-levels/export', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

const context = { params: Promise.resolve({ orgSlug: 'acme' }) }

describe('inventory export route', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireApiModuleContext.mockResolvedValue({ org: { id: 'org_a' }, permissions: [] })
    mockRequireAll.mockResolvedValue(undefined)
  })

  it('returns binary success with safe download headers', async () => {
    const route = await import('../stock-levels/export/route')
    const response = await route.POST(request({
      format: 'csv',
      scope: 'filtered',
      columns: ['name'],
      query: {},
    }), context)

    expect(response.status).toBe(200)
    expect(response.headers.get('content-type')).toContain('text/csv')
    expect(response.headers.get('content-disposition')).toMatch(/^attachment; filename="onedayos-stock-levels-/)
    expect(response.headers.get('cache-control')).toBe('no-store')
    expect(await response.text()).toContain('Coffee')
    expect(mockRequireAll).toHaveBeenCalledWith(
      expect.anything(),
      expect.arrayContaining([
        expect.objectContaining({ action: 'read' }),
        expect.objectContaining({ action: 'export' }),
      ]),
    )
  }, 15_000)

  it('returns a JSON 403 when explicit export permission is denied', async () => {
    mockRequireAll.mockRejectedValue(apiErrors.forbidden())
    const route = await import('../stock-levels/export/route')
    const response = await route.POST(request({
      format: 'csv',
      scope: 'filtered',
      query: {},
    }), context)
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(response.headers.get('location')).toBeNull()
    expect(payload.error.code).toBe('FORBIDDEN')
  })

  it('rejects tenant identity and unknown keys before generating a file', async () => {
    const route = await import('../stock-levels/export/route')
    const response = await route.POST(request({
      format: 'csv',
      scope: 'filtered',
      query: { orgId: 'org_b' },
    }), context)
    const payload = await response.json()

    expect(response.status).toBe(400)
    expect(payload.error.code).toBe('TENANT_ID_NOT_ALLOWED')
  })
})
