import { describe, expect, it } from 'vitest'
import {
  createStockAdjustmentSchema,
  productSettingListQuerySchema,
  stockLevelQuerySchema,
  upsertProductSettingSchema,
} from '../schema'

describe('inventory schemas', () => {
  it('rejects tenant identity and unknown keys in stock adjustments', () => {
    const tenantKey = 'org' + 'Id'
    const result = createStockAdjustmentSchema.safeParse({
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantityAfter: '12.5',
      reason: 'Physical count',
      [tenantKey]: 'org_b',
    })
    const unknown = createStockAdjustmentSchema.safeParse({
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantityAfter: '12.5',
      reason: 'Physical count',
      quantityBefore: '3',
    })

    expect(result.success).toBe(false)
    expect(unknown.success).toBe(false)
  })

  it('rejects tenant identity and unknown keys in product settings', () => {
    const tenantKey = 'org' + 'Id'

    expect(
      upsertProductSettingSchema.safeParse({
        productId: 'product_a',
        reorderPoint: '10',
        isStockTracked: true,
        [tenantKey]: 'org_b',
      }).success,
    ).toBe(false)
    expect(
      upsertProductSettingSchema.safeParse({
        productId: 'product_a',
        reorderPoint: '10',
        isStockTracked: true,
        cost: '100',
      }).success,
    ).toBe(false)
  })

  it('validates decimal inputs without allowing negative final stock', () => {
    expect(createStockAdjustmentSchema.safeParse({
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantityAfter: '12.3456',
      reason: 'Physical count',
    }).success).toBe(true)
    expect(createStockAdjustmentSchema.safeParse({
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantityAfter: '-1',
      reason: 'Physical count',
    }).success).toBe(false)
    expect(upsertProductSettingSchema.safeParse({
      productId: 'product_a',
      reorderPoint: '5.12345',
      isStockTracked: true,
    }).success).toBe(false)
  })

  it('allowlists query params and rejects client-supplied tenant filters', () => {
    const tenantKey = 'org' + 'Id'

    expect(stockLevelQuerySchema.safeParse({ page: '1', pageSize: '25', lowStockOnly: 'true' }).success).toBe(false)
    expect(stockLevelQuerySchema.safeParse({ page: '1', pageSize: '25', status: 'low_stock' }).success).toBe(false)
    expect(stockLevelQuerySchema.safeParse({ [tenantKey]: 'org_b' }).success).toBe(false)
    expect(productSettingListQuerySchema.safeParse({ q: 'canonical' }).success).toBe(true)
  })
})
