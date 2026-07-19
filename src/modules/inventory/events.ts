import { z } from 'zod'
import type { ModuleEventContract } from '@/sdk'

export const inventoryEvents = {
  productExtensionCreated: {
    name: 'inventory.product_extension.created',
    description: 'Inventory-specific Product settings were created.',
  },
  productExtensionUpdated: {
    name: 'inventory.product_extension.updated',
    description: 'Inventory-specific Product settings were updated.',
  },
  stockAdjustmentCreated: {
    name: 'inventory.stock_adjustment.created',
    description: 'Manual stock adjustment was posted.',
  },
  stockMovementCreated: {
    name: 'inventory.stock_movement.created',
    description: 'Inventory stock movement was appended to the ledger.',
  },
  stockBalanceUpdated: {
    name: 'inventory.stock_balance.updated',
    description: 'Inventory stock balance was updated.',
  },
  reorderThresholdCrossed: {
    name: 'inventory.stock_level.reorder_threshold_crossed',
    description: 'Stock level crossed below the configured reorder threshold.',
  },
  manifest: {
    emits: [
      {
        name: 'inventory.product_extension.created',
        description: 'Inventory-specific Product settings were created.',
      },
      {
        name: 'inventory.product_extension.updated',
        description: 'Inventory-specific Product settings were updated.',
      },
      {
        name: 'inventory.stock_adjustment.created',
        description: 'Manual stock adjustment was posted.',
      },
      {
        name: 'inventory.stock_movement.created',
        description: 'Inventory stock movement was appended to the ledger.',
      },
      {
        name: 'inventory.stock_balance.updated',
        description: 'Inventory stock balance was updated.',
      },
      {
        name: 'inventory.stock_level.reorder_threshold_crossed',
        description: 'Stock level crossed below the configured reorder threshold.',
      },
    ],
    listens: [
      {
        name: 'objects.product.deleted',
        description: 'Inventory hides balances for deleted shared Products in normal views.',
      },
      {
        name: 'objects.warehouse.deleted',
        description: 'Inventory hides balances for deleted shared Warehouses in normal views.',
      },
    ],
  },
} as const

export const productExtensionPayloadSchema = z.strictObject({
  productExtensionId: z.string().min(1),
  productId: z.string().min(1),
  changedFields: z.array(z.string().min(1)).optional(),
})

export const stockAdjustmentCreatedPayloadSchema = z.strictObject({
  adjustmentId: z.string().min(1),
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantityDelta: z.string().min(1),
  createdBy: z.string().min(1),
})

export const stockMovementCreatedPayloadSchema = z.strictObject({
  movementId: z.string().min(1),
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantityDelta: z.string().min(1),
  resultingQuantity: z.string().min(1),
  sourceType: z.string().min(1),
  sourceId: z.string().min(1),
})

export const stockBalanceUpdatedPayloadSchema = z.strictObject({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.string().min(1),
})

export const reorderThresholdCrossedPayloadSchema = z.strictObject({
  productId: z.string().min(1),
  warehouseId: z.string().min(1),
  quantity: z.string().min(1),
  reorderPoint: z.string().min(1),
})

export const inventoryEventPayloadSchemas = {
  [inventoryEvents.productExtensionCreated.name]: productExtensionPayloadSchema,
  [inventoryEvents.productExtensionUpdated.name]: productExtensionPayloadSchema,
  [inventoryEvents.stockAdjustmentCreated.name]: stockAdjustmentCreatedPayloadSchema,
  [inventoryEvents.stockMovementCreated.name]: stockMovementCreatedPayloadSchema,
  [inventoryEvents.stockBalanceUpdated.name]: stockBalanceUpdatedPayloadSchema,
  [inventoryEvents.reorderThresholdCrossed.name]: reorderThresholdCrossedPayloadSchema,
} as const

export const inventoryEventManifest: ModuleEventContract = {
  emits: [...inventoryEvents.manifest.emits],
  listens: [...inventoryEvents.manifest.listens],
}
