import { describe, expect, it } from 'vitest'
import {
  productCategoryListQuerySchema,
  productListQuerySchema,
} from '@/business-objects/product'
import { customerListQuerySchema } from '@/business-objects/customer'
import { supplierListQuerySchema } from '@/business-objects/supplier'
import { warehouseListQuerySchema } from '@/business-objects/warehouse'
import {
  stockAdjustmentQuerySchema,
  stockAdjustmentPrefillSchema,
  stockLevelQuerySchema,
  stockMovementQuerySchema,
} from '@/modules/inventory/schema'

const families = [
  ['products', productListQuerySchema],
  ['categories', productCategoryListQuerySchema],
  ['customers', customerListQuerySchema],
  ['suppliers', supplierListQuerySchema],
  ['warehouses', warehouseListQuerySchema],
  ['stock levels', stockLevelQuerySchema],
  ['stock movements', stockMovementQuerySchema],
  ['stock adjustments', stockAdjustmentQuerySchema],
] as const

describe('Data Table V2 query schemas', () => {
  it.each(families)('%s applies bounded pagination defaults', (_name, schema) => {
    const result = schema.safeParse({})
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.page).toBe(1)
      expect(result.data.pageSize).toBe(25)
    }
  })

  it.each(families)('%s rejects invalid pagination and tenant identity', (_name, schema) => {
    expect(schema.safeParse({ page: 0 }).success).toBe(false)
    expect(schema.safeParse({ pageSize: 101 }).success).toBe(false)
    expect(schema.safeParse({ orgId: 'org_other' }).success).toBe(false)
    expect(schema.safeParse({ unknown: 'value' }).success).toBe(false)
  })

  it('normalizes search and rejects invalid product sort/filter values', () => {
    const parsed = productListQuerySchema.parse({ q: '  Coffee   Beans  ', sort: 'name', direction: 'desc', isActive: 'true' })
    expect(parsed.q).toBe('Coffee Beans')
    expect(parsed.isActive).toBe(true)
    expect(productListQuerySchema.safeParse({ sort: 'orgId' }).success).toBe(false)
    expect(productListQuerySchema.safeParse({ direction: 'sideways' }).success).toBe(false)
  })

  it('enforces Inventory page-specific filter and sort allowlists', () => {
    expect(stockLevelQuerySchema.safeParse({ sort: 'quantity' }).success).toBe(true)
    expect(stockLevelQuerySchema.safeParse({ status: 'low_stock', sort: 'quantity' }).success).toBe(false)
    expect(stockLevelQuerySchema.safeParse({ status: 'unknown' }).success).toBe(false)
    expect(stockMovementQuerySchema.safeParse({ type: 'adjustment_in', sort: 'occurredAt' }).success).toBe(true)
    expect(stockMovementQuerySchema.safeParse({ sort: 'status' }).success).toBe(false)
    expect(stockAdjustmentQuerySchema.safeParse({ status: 'posted', sort: 'createdAt' }).success).toBe(true)
  })

  it('accepts only Product/Warehouse adjustment prefill and rejects tenant or quantity input', () => {
    expect(stockAdjustmentPrefillSchema.parse({ productId: 'product_a', warehouseId: 'warehouse_a' })).toEqual({
      productId: 'product_a',
      warehouseId: 'warehouse_a',
    })
    expect(stockAdjustmentPrefillSchema.safeParse({ orgId: 'org_other' }).success).toBe(false)
    expect(stockAdjustmentPrefillSchema.safeParse({ quantityAfter: '999' }).success).toBe(false)
  })
})
