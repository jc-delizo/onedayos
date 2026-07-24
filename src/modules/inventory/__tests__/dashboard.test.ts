import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlatformContext } from '@/sdk'
import {
  assertDashboardAggregationCapacity,
  buildDashboardStockSummary,
  buildMovementTrend,
  DASHBOARD_AGGREGATION_MAX_CANDIDATES,
  InventoryService,
  InventoryServiceError,
} from '../service'
import { INVENTORY_PERMISSIONS } from '../permissions'

const { mockCan, mockGetDb, mockRequireEnabled, mockRequirePermission } = vi.hoisted(() => ({
  mockCan: vi.fn(),
  mockGetDb: vi.fn(),
  mockRequireEnabled: vi.fn(),
  mockRequirePermission: vi.fn(),
}))

vi.mock('@/sdk/server', () => ({
  sdk: {
    getDb: mockGetDb,
    permissions: {
      can: mockCan,
      require: mockRequirePermission,
    },
    modules: {
      requireEnabled: mockRequireEnabled,
    },
    events: {
      emit: vi.fn(),
    },
  },
}))

function makeCtx(orgId: string): PlatformContext {
  return {
    requestId: `req_${orgId}`,
    auth: { provider: 'supabase', userId: `user_${orgId}`, email: `${orgId}@example.test` },
    user: { id: `user_${orgId}`, orgId, name: 'Dashboard User', email: `${orgId}@example.test`, isActive: true },
    org: {
      id: orgId,
      slug: orgId,
      name: orgId,
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

const warehouseA = { id: 'warehouse_a', code: 'MAIN', name: 'Main Warehouse' }
const warehouseB = { id: 'warehouse_b', code: 'COLD', name: 'Cold Storage' }

function product(id: string, unit: string) {
  return { id, code: id.toUpperCase(), name: `Product ${id}`, unit }
}

function extension(productId: string, reorderPoint: string, unit: string) {
  return {
    id: `extension_${productId}`,
    productId,
    reorderPoint,
    isStockTracked: true,
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    product: product(productId, unit),
  }
}

function balance(productId: string, warehouse: typeof warehouseA, quantity: string, unit: string) {
  return {
    id: `balance_${productId}_${warehouse.id}`,
    productId,
    warehouseId: warehouse.id,
    quantity,
    updatedAt: new Date('2026-07-01T00:00:00.000Z'),
    product: product(productId, unit),
    warehouse,
  }
}

describe('Inventory Dashboard V2 aggregation', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockCan.mockReturnValue(true)
    mockRequireEnabled.mockResolvedValue(undefined)
    mockRequirePermission.mockResolvedValue(undefined)
  })

  it('computes exact exclusive KPI and stock-health categories without paginated rows', () => {
    const result = buildDashboardStockSummary(
      [
        extension('paper', '10', 'ream'),
        extension('coffee', '5', 'bag'),
        extension('cups', '8', 'sleeve'),
      ],
      [
        balance('paper', warehouseA, '7', 'ream'),
        balance('paper', warehouseB, '5', 'ream'),
        balance('coffee', warehouseA, '3', 'bag'),
      ],
      [warehouseA, warehouseB],
    )

    expect(result.kpis).toEqual({
      trackedProducts: 3,
      lowStockProducts: 1,
      outOfStockProducts: 1,
      warehousesWithStock: 2,
    })
    expect(result.stockHealth).toEqual([
      { status: 'in_stock', label: 'In Stock', count: 1 },
      { status: 'low_stock', label: 'Low Stock', count: 1 },
      { status: 'out_of_stock', label: 'Out of Stock', count: 1 },
    ])
    expect(result.stockHealth.reduce((sum, datum) => sum + datum.count, 0)).toBe(
      result.kpis.trackedProducts,
    )
  })

  it('uses Product counts by Warehouse and never sums mixed units', () => {
    const result = buildDashboardStockSummary(
      [extension('paper', '10', 'ream'), extension('coffee', '5', 'kg')],
      [
        balance('paper', warehouseA, '100', 'ream'),
        balance('coffee', warehouseA, '4', 'kg'),
      ],
      [warehouseA, warehouseB],
    )

    expect(result.warehouseStock).toEqual([
      {
        warehouseName: 'Main Warehouse',
        trackedPositions: 2,
        lowStockPositions: 1,
        outOfStockPositions: 0,
      },
      {
        warehouseName: 'Cold Storage',
        trackedPositions: 0,
        lowStockPositions: 0,
        outOfStockPositions: 0,
      },
    ])
    expect(result.warehouseStock[0]).not.toHaveProperty('totalQuantity')
  })

  it('counts a Product once in unique KPIs while counting each Warehouse position once', () => {
    const result = buildDashboardStockSummary(
      [
        extension('paper', '10', 'ream'),
        extension('missing', '5', 'box'),
      ],
      [
        balance('paper', warehouseA, '4', 'ream'),
        balance('paper', warehouseB, '8', 'ream'),
      ],
      [warehouseA, warehouseB],
    )

    expect(result.kpis).toMatchObject({
      trackedProducts: 2,
      lowStockProducts: 0,
      outOfStockProducts: 1,
    })
    expect(result.stockHealth).toEqual([
      { status: 'in_stock', label: 'In Stock', count: 1 },
      { status: 'low_stock', label: 'Low Stock', count: 0 },
      { status: 'out_of_stock', label: 'Out of Stock', count: 1 },
    ])
    expect(result.warehouseStock.map((warehouse) => warehouse.trackedPositions)).toEqual([1, 1])
    expect(result.warehouseStock.map((warehouse) => warehouse.lowStockPositions)).toEqual([1, 1])
  })

  it('returns an honest zero-data state', () => {
    expect(buildDashboardStockSummary([], [], []).kpis).toEqual({
      trackedProducts: 0,
      lowStockProducts: 0,
      outOfStockProducts: 0,
      warehousesWithStock: 0,
    })
  })

  it('groups a continuous 30-day UTC range and handles both timezone boundaries', () => {
    const now = new Date('2026-07-24T23:59:59.000-04:00')
    const result = buildMovementTrend([
      { type: 'opening_balance', quantityDelta: '10', occurredAt: '2026-06-26T00:00:00.000Z' },
      { type: 'adjustment_out', quantityDelta: '-3', occurredAt: '2026-07-24T23:59:59.999Z' },
      { type: 'adjustment_in', quantityDelta: '9', occurredAt: '2026-06-25T23:59:59.999Z' },
    ], now)

    expect(result.data).toHaveLength(30)
    expect(result.data[0]).toEqual({ date: '2026-06-26', inbound: 10, outbound: 0 })
    expect(result.data.at(-1)).toEqual({ date: '2026-07-25', inbound: 0, outbound: 0 })
    expect(result.data.find((day) => day.date === '2026-07-24')).toEqual({
      date: '2026-07-24',
      inbound: 0,
      outbound: 3,
    })
    expect(result.data.filter((day) => day.inbound === 0 && day.outbound === 0)).toHaveLength(28)
  })

  it.each([
    ['month boundary', '2026-07-24T12:00:00.000Z', '2026-06-25', '2026-07-24'],
    ['year boundary', '2027-01-10T12:00:00.000Z', '2026-12-12', '2027-01-10'],
    ['leap-day boundary', '2028-03-01T12:00:00.000Z', '2028-02-01', '2028-03-01'],
  ])('uses exactly 30 UTC dates including today across a %s', (_label, now, start, end) => {
    const result = buildMovementTrend([], new Date(now))

    expect(result.data).toHaveLength(30)
    expect(result.data[0].date).toBe(start)
    expect(result.data.at(-1)?.date).toBe(end)
  })

  it('includes both range boundaries and excludes adjacent timestamps', () => {
    const result = buildMovementTrend([
      { type: 'adjustment_in', quantityDelta: '5', occurredAt: '2026-06-25T00:00:00.000Z' },
      { type: 'adjustment_in', quantityDelta: '99', occurredAt: '2026-06-24T23:59:59.999Z' },
      { type: 'adjustment_out', quantityDelta: '-2', occurredAt: '2026-07-24T23:59:59.999Z' },
      { type: 'adjustment_out', quantityDelta: '-99', occurredAt: '2026-07-25T00:00:00.000Z' },
    ], new Date('2026-07-24T08:00:00.000Z'))

    expect(result.data[0]).toEqual({ date: '2026-06-25', inbound: 5, outbound: 0 })
    expect(result.data.at(-1)).toEqual({ date: '2026-07-24', inbound: 0, outbound: 2 })
    expect(result.data.reduce((sum, day) => sum + day.inbound + day.outbound, 0)).toBe(7)
  })

  it('fails instead of silently omitting an unsupported future movement type', () => {
    expect(() => buildMovementTrend([
      { type: 'receipt', quantityDelta: '10', occurredAt: '2026-07-20T00:00:00.000Z' },
    ], new Date('2026-07-24T00:00:00.000Z'))).toThrow(InventoryServiceError)
  })

  it('requires Dashboard permission and exact tenant-scoped uncapped reads', async () => {
    const prisma = {
      inventoryProductExtension: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
      stockBalance: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
      warehouse: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
      stockMovement: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
      stockAdjustment: {
        count: vi.fn().mockResolvedValue(0),
        findMany: vi.fn().mockResolvedValue([]),
      },
    }
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    const dashboard = await InventoryService.getDashboard(
      makeCtx('org_a'),
      { now: new Date('2026-07-24T12:00:00.000Z') },
    )

    expect(mockRequireEnabled).toHaveBeenCalledWith(expect.anything(), 'inventory')
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.anything(), INVENTORY_PERMISSIONS.DASHBOARD_READ)
    expect(dashboard.kpis.trackedProducts).toBe(0)
    expect(prisma.inventoryProductExtension.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        orgId: 'org_a',
        deletedAt: null,
        isStockTracked: true,
        product: expect.objectContaining({ orgId: 'org_a', deletedAt: null, isActive: true }),
      }),
    }))
    expect(prisma.stockBalance.findMany).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({
        orgId: 'org_a',
        product: expect.objectContaining({ orgId: 'org_a', deletedAt: null, isActive: true }),
        warehouse: expect.objectContaining({ orgId: 'org_a', deletedAt: null, isActive: true }),
      }),
    }))
    const trendCall = prisma.stockMovement.findMany.mock.calls.find(([args]) => (
      Boolean((args as { where?: { occurredAt?: unknown } }).where?.occurredAt)
    ))
    expect(trendCall?.[0]).not.toHaveProperty('take')
    expect(trendCall?.[0]).not.toHaveProperty('skip')
    expect(prisma.inventoryProductExtension.count).toHaveBeenCalledWith(expect.objectContaining({
      where: expect.objectContaining({ orgId: 'org_a' }),
    }))
  })

  it('fails safely before returning partial Dashboard data above the exact-processing limit', async () => {
    const prisma = {
      inventoryProductExtension: {
        count: vi.fn().mockResolvedValue(DASHBOARD_AGGREGATION_MAX_CANDIDATES),
        findMany: vi.fn(),
      },
      stockBalance: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn() },
      warehouse: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn() },
      stockMovement: { count: vi.fn().mockResolvedValue(1), findMany: vi.fn() },
      stockAdjustment: { count: vi.fn(), findMany: vi.fn() },
    }
    mockCan.mockReturnValue(false)
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await expect(InventoryService.getDashboard(makeCtx('org_a'))).rejects.toMatchObject({
      name: 'InventoryServiceError',
      code: 'VALIDATION_ERROR',
      status: 422,
      message: expect.stringContaining('exact-processing limit'),
    })
    expect(prisma.inventoryProductExtension.findMany).not.toHaveBeenCalled()
    expect(prisma.stockBalance.findMany).not.toHaveBeenCalled()
    expect(prisma.stockMovement.findMany).not.toHaveBeenCalled()
  })

  it('accepts exact candidate totals at the temporary aggregation limit', () => {
    expect(() => assertDashboardAggregationCapacity({
      trackedProducts: 10_000,
      balances: 30_000,
      warehouses: 100,
      movements: 9_900,
    })).not.toThrow()
  })

  it('does not access the database when the module or permission gate denies access', async () => {
    mockRequireEnabled.mockRejectedValueOnce({ code: 'MODULE_DISABLED', status: 404 })

    await expect(InventoryService.getDashboard(makeCtx('org_a'))).rejects.toMatchObject({
      code: 'MODULE_DISABLED',
    })
    expect(mockGetDb).not.toHaveBeenCalled()

    mockRequireEnabled.mockResolvedValueOnce(undefined)
    mockRequirePermission.mockRejectedValueOnce({ code: 'FORBIDDEN', status: 403 })
    await expect(InventoryService.getDashboard(makeCtx('org_b'))).rejects.toMatchObject({
      code: 'FORBIDDEN',
    })
    expect(mockGetDb).not.toHaveBeenCalled()
  })
})
