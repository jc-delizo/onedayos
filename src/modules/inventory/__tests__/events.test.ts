import { describe, expect, it } from 'vitest'
import {
  inventoryEvents,
  reorderThresholdCrossedPayloadSchema,
  stockAdjustmentCreatedPayloadSchema,
} from '../events'

describe('inventory events', () => {
  it('uses inventory namespace facts without claiming Product or Warehouse events', () => {
    expect(inventoryEvents.stockAdjustmentCreated.name).toBe('inventory.stock_adjustment.created')
    expect(inventoryEvents.stockMovementCreated.name).toBe('inventory.stock_movement.created')
    expect(inventoryEvents.reorderThresholdCrossed.name).toBe('inventory.stock_level.reorder_threshold_crossed')
    expect(Object.values(inventoryEvents).join(' ')).not.toContain('inventory.product.created')
    expect(Object.values(inventoryEvents).join(' ')).not.toContain('inventory.warehouse.created')
  })

  it('validates minimal event payloads without tenant identity or full records', () => {
    const tenantKey = 'org' + 'Id'
    const payload = stockAdjustmentCreatedPayloadSchema.parse({
      adjustmentId: 'adjustment_a',
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantityDelta: '-4',
      createdBy: 'user_a',
    })

    expect(payload).not.toHaveProperty(tenantKey)
    expect(payload).not.toHaveProperty('record')
    expect(stockAdjustmentCreatedPayloadSchema.safeParse({ ...payload, [tenantKey]: 'org_a' }).success).toBe(false)
    expect(reorderThresholdCrossedPayloadSchema.safeParse({
      productId: 'product_a',
      warehouseId: 'warehouse_a',
      quantity: '8',
      reorderPoint: '10',
    }).success).toBe(true)
  })
})
