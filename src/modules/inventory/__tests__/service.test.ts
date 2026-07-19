import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlatformContext } from '@/sdk'
import { inventoryEvents } from '../events'
import { INVENTORY_PERMISSIONS } from '../permissions'
import { InventoryService } from '../service'

const { mockCan, mockEmit, mockGetDb, mockRequireEnabled, mockRequirePermission } = vi.hoisted(() => ({
  mockCan: vi.fn(),
  mockEmit: vi.fn(),
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
      emit: mockEmit,
    },
  },
}))

function makeCtx(orgId: string): PlatformContext {
  return {
    requestId: `req_${orgId}`,
    auth: { provider: 'supabase', userId: `user_${orgId}`, email: `${orgId}@example.com` },
    user: { id: `user_${orgId}`, orgId, name: `User ${orgId}`, email: `${orgId}@example.com`, isActive: true },
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

function makeProduct(id = 'product_a') {
  return {
    id,
    code: 'SKU-1',
    name: 'Bond Paper',
    unit: 'ream',
    category: { name: 'Office Supplies' },
  }
}

function makeWarehouse(id = 'warehouse_a') {
  return {
    id,
    code: 'MAIN',
    name: 'Main Warehouse',
  }
}

function makeAdjustment(overrides = {}) {
  return {
    id: 'adjustment_a',
    productId: 'product_a',
    warehouseId: 'warehouse_a',
    quantityBefore: '12',
    quantityAfter: '8',
    quantityDelta: '-4',
    reason: 'Physical count',
    notes: null,
    status: 'posted',
    createdAt: new Date('2026-07-08T00:00:00.000Z'),
    createdBy: 'user_org_a',
    product: makeProduct(),
    warehouse: makeWarehouse(),
    actor: { id: 'user_org_a', name: 'Inventory Admin' },
    ...overrides,
  }
}

function makeMovement(overrides = {}) {
  return {
    id: 'movement_a',
    productId: 'product_a',
    warehouseId: 'warehouse_a',
    type: 'adjustment_out',
    quantityDelta: '-4',
    resultingQuantity: '8',
    sourceType: 'stock_adjustment',
    sourceId: 'adjustment_a',
    reason: 'Physical count',
    occurredAt: new Date('2026-07-08T00:00:00.000Z'),
    createdAt: new Date('2026-07-08T00:00:00.000Z'),
    createdBy: 'user_org_a',
    product: makeProduct(),
    warehouse: makeWarehouse(),
    actor: { id: 'user_org_a', name: 'Inventory Admin' },
    ...overrides,
  }
}

function makePrisma() {
  const prisma = {
    product: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    warehouse: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
    },
    inventoryProductExtension: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
      count: vi.fn(),
    },
    stockBalance: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    stockMovement: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    stockAdjustment: {
      findMany: vi.fn(),
      findFirst: vi.fn(),
      create: vi.fn(),
      update: vi.fn(),
    },
    $transaction: vi.fn(async (callback) => callback(prisma)),
  }
  return prisma
}

describe('InventoryService', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockRequireEnabled.mockResolvedValue(undefined)
    mockRequirePermission.mockResolvedValue(undefined)
    mockCan.mockReturnValue(true)
    mockEmit.mockResolvedValue({ eventName: 'ok' })
  })

  it('requires module enablement, permissions, and PlatformContext database access for stock levels', async () => {
    const prisma = makePrisma()
    prisma.stockBalance.findMany.mockResolvedValue([])
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await InventoryService.listStockLevels(makeCtx('org_a'), { page: 1, pageSize: 25, search: undefined })

    expect(mockRequireEnabled).toHaveBeenCalledWith(expect.objectContaining({ org: expect.objectContaining({ id: 'org_a' }) }), 'inventory')
    expect(mockRequirePermission).toHaveBeenCalledWith(expect.anything(), INVENTORY_PERMISSIONS.STOCK_LEVEL_READ)
    expect(mockGetDb).toHaveBeenCalledWith(expect.objectContaining({ org: expect.objectContaining({ id: 'org_a' }) }))
    expect(prisma.stockBalance.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          orgId: 'org_a',
          product: expect.objectContaining({ orgId: 'org_a', deletedAt: null }),
          warehouse: expect.objectContaining({ orgId: 'org_a', deletedAt: null }),
        }),
      }),
    )
  })

  it('does not write when permission is denied', async () => {
    const prisma = makePrisma()
    mockRequirePermission.mockRejectedValue({ status: 403, code: 'FORBIDDEN' })
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await expect(
      InventoryService.createStockAdjustment(makeCtx('org_a'), {
        productId: 'product_a',
        warehouseId: 'warehouse_a',
        quantityAfter: '5',
        reason: 'Physical count',
      }),
    ).rejects.toMatchObject({ status: 403, code: 'FORBIDDEN' })

    expect(mockGetDb).not.toHaveBeenCalled()
    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('returns safe not found for cross-tenant Product references', async () => {
    const prisma = makePrisma()
    prisma.product.findFirst.mockResolvedValue(null)
    prisma.warehouse.findFirst.mockResolvedValue(makeWarehouse())
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await expect(
      InventoryService.createStockAdjustment(makeCtx('org_a'), {
        productId: 'product_b',
        warehouseId: 'warehouse_a',
        quantityAfter: '5',
        reason: 'Physical count',
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })

    expect(prisma.product.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'product_b',
          orgId: 'org_a',
          deletedAt: null,
        }),
      }),
    )
    expect(prisma.stockAdjustment.create).not.toHaveBeenCalled()
    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('returns safe not found for cross-tenant Warehouse references', async () => {
    const prisma = makePrisma()
    prisma.product.findFirst.mockResolvedValue(makeProduct())
    prisma.warehouse.findFirst.mockResolvedValue(null)
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await expect(
      InventoryService.createStockAdjustment(makeCtx('org_a'), {
        productId: 'product_a',
        warehouseId: 'warehouse_b',
        quantityAfter: '5',
        reason: 'Physical count',
      }),
    ).rejects.toMatchObject({ status: 404, code: 'NOT_FOUND' })

    expect(prisma.warehouse.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: expect.objectContaining({
          id: 'warehouse_b',
          orgId: 'org_a',
          deletedAt: null,
        }),
      }),
    )
    expect(prisma.stockAdjustment.create).not.toHaveBeenCalled()
    expect(prisma.stockMovement.create).not.toHaveBeenCalled()
    expect(prisma.stockBalance.update).not.toHaveBeenCalled()
    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('transactionally creates adjustment, movement, balance update, and low-stock event after success', async () => {
    const prisma = makePrisma()
    prisma.product.findFirst.mockResolvedValue(makeProduct())
    prisma.warehouse.findFirst.mockResolvedValue(makeWarehouse())
    prisma.inventoryProductExtension.findFirst.mockResolvedValue({
      id: 'extension_a',
      productId: 'product_a',
      reorderPoint: '10',
      isStockTracked: true,
      updatedAt: new Date('2026-07-08T00:00:00.000Z'),
    })
    prisma.stockBalance.findFirst.mockResolvedValue({
      id: 'balance_a',
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantity: '12',
      updatedAt: new Date('2026-07-08T00:00:00.000Z'),
      product: makeProduct(),
      warehouse: makeWarehouse(),
    })
    prisma.stockAdjustment.create.mockResolvedValue(makeAdjustment())
    prisma.stockMovement.create.mockResolvedValue(makeMovement())
    prisma.stockBalance.update.mockResolvedValue({
      id: 'balance_a',
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantity: '8',
      updatedAt: new Date('2026-07-08T00:00:00.000Z'),
      product: { ...makeProduct(), inventoryExtension: { reorderPoint: '10', isStockTracked: true } },
      warehouse: makeWarehouse(),
    })
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    const result = await InventoryService.createStockAdjustment(makeCtx('org_a'), {
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantityAfter: '8',
      reason: 'Physical count',
    })

    expect(result).toMatchObject({
      id: 'adjustment_a',
      quantityBefore: '12',
      quantityAfter: '8',
      quantityDelta: '-4',
    })
    expect(prisma.$transaction).toHaveBeenCalled()
    expect(prisma.stockAdjustment.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        orgId: 'org_a',
        quantityBefore: '12',
        quantityAfter: '8',
        quantityDelta: '-4',
        createdBy: 'user_org_a',
      }),
    }))
    expect(prisma.stockMovement.create).toHaveBeenCalledWith(expect.objectContaining({
      data: expect.objectContaining({
        type: 'adjustment_out',
        sourceType: 'stock_adjustment',
        sourceId: 'adjustment_a',
      }),
    }))
    expect(prisma.stockBalance.update).toHaveBeenCalledWith(expect.objectContaining({
      where: {
        orgId_productId_warehouseId: {
          orgId: 'org_a',
          productId: 'product_a',
          warehouseId: 'warehouse_a',
        },
      },
    }))
    expect(mockEmit).toHaveBeenCalledWith(expect.anything(), inventoryEvents.stockAdjustmentCreated.name, expect.any(Object))
    expect(mockEmit).toHaveBeenCalledWith(expect.anything(), inventoryEvents.stockMovementCreated.name, expect.any(Object))
    expect(mockEmit).toHaveBeenCalledWith(expect.anything(), inventoryEvents.stockBalanceUpdated.name, expect.any(Object))
    expect(mockEmit).toHaveBeenCalledWith(expect.anything(), inventoryEvents.reorderThresholdCrossed.name, expect.any(Object))
    for (const call of mockEmit.mock.calls) {
      expect(call[2]).not.toHaveProperty('orgId')
      expect(call[2]).not.toHaveProperty('record')
    }
  })

  it('creates default product extension and balance when posting the first adjustment', async () => {
    const prisma = makePrisma()
    prisma.product.findFirst.mockResolvedValue(makeProduct())
    prisma.warehouse.findFirst.mockResolvedValue(makeWarehouse())
    prisma.inventoryProductExtension.findFirst.mockResolvedValue(null)
    prisma.inventoryProductExtension.create.mockResolvedValue({
      id: 'extension_a',
      productId: 'product_a',
      reorderPoint: '0',
      isStockTracked: true,
      updatedAt: new Date('2026-07-08T00:00:00.000Z'),
    })
    prisma.stockBalance.findFirst.mockResolvedValue(null)
    prisma.stockAdjustment.create.mockResolvedValue(makeAdjustment({
      quantityBefore: '0',
      quantityAfter: '5',
      quantityDelta: '5',
    }))
    prisma.stockMovement.create.mockResolvedValue(makeMovement({
      type: 'opening_balance',
      quantityDelta: '5',
      resultingQuantity: '5',
    }))
    prisma.stockBalance.create.mockResolvedValue({
      id: 'balance_a',
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantity: '5',
      updatedAt: new Date('2026-07-08T00:00:00.000Z'),
      product: makeProduct(),
      warehouse: makeWarehouse(),
    })
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await InventoryService.createStockAdjustment(makeCtx('org_a'), {
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantityAfter: '5',
      reason: 'Opening balance',
    })

    expect(prisma.inventoryProductExtension.create).toHaveBeenCalledWith({
      data: {
        orgId: 'org_a',
        productId: 'product_a',
        reorderPoint: '0',
        isStockTracked: true,
      },
    })
    expect(prisma.stockBalance.create).toHaveBeenCalled()
    expect(mockEmit).toHaveBeenCalledWith(expect.anything(), inventoryEvents.productExtensionCreated.name, expect.any(Object))
  })

  it('prevents negative resulting stock before opening a transaction', async () => {
    const prisma = makePrisma()
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await expect(
      InventoryService.createStockAdjustment(makeCtx('org_a'), {
        productId: 'product_a',
        warehouseId: 'warehouse_a',
        quantityAfter: '-1',
        reason: 'Invalid count',
      }),
    ).rejects.toMatchObject({ code: 'VALIDATION_ERROR' })

    expect(prisma.$transaction).not.toHaveBeenCalled()
    expect(mockEmit).not.toHaveBeenCalled()
  })

  it('does not emit events when a transaction write fails', async () => {
    const prisma = makePrisma()
    prisma.product.findFirst.mockResolvedValue(makeProduct())
    prisma.warehouse.findFirst.mockResolvedValue(makeWarehouse())
    prisma.inventoryProductExtension.findFirst.mockResolvedValue({
      id: 'extension_a',
      productId: 'product_a',
      reorderPoint: '0',
      isStockTracked: true,
      updatedAt: new Date('2026-07-08T00:00:00.000Z'),
    })
    prisma.stockBalance.findFirst.mockResolvedValue(null)
    prisma.stockAdjustment.create.mockRejectedValue(new Error('database unavailable'))
    mockGetDb.mockReturnValue({ orgId: 'org_a', prisma })

    await expect(
      InventoryService.createStockAdjustment(makeCtx('org_a'), {
        productId: 'product_a',
        warehouseId: 'warehouse_a',
        quantityAfter: '5',
        reason: 'Opening balance',
      }),
    ).rejects.toThrow('database unavailable')

    expect(prisma.stockMovement.create).not.toHaveBeenCalled()
    expect(prisma.stockBalance.create).not.toHaveBeenCalled()
    expect(prisma.stockBalance.update).not.toHaveBeenCalled()
    expect(mockEmit).not.toHaveBeenCalled()
  })
})
