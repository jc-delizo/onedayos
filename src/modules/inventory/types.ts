import type { ModuleCompatibility } from '@/sdk'

export const INVENTORY_MODULE_COMPATIBILITY = {
  platform: { min: '0.1.0', max: null },
  sdk: { min: '0.1.0', max: null },
  manifest: { min: '1.0.0', max: null },
} as const satisfies ModuleCompatibility

export type InventoryDashboard = {
  summary: {
    trackedProducts: number | null
    lowStockProducts: number | null
    warehousesWithStock: number | null
  }
  recentMovements: StockMovementListItem[]
  recentAdjustments: StockAdjustmentListItem[]
}

export type InventoryProductSettingListItem = {
  id: string
  productId: string
  productCode: string
  productName: string
  productUnit: string
  categoryName: string | null
  reorderPoint: string
  isStockTracked: boolean
  updatedAt: string
}

export type StockStatus = 'ok' | 'low_stock' | 'not_tracked'

export type StockLevelListItem = {
  id: string
  productId: string
  productCode: string
  productName: string
  productUnit: string
  categoryName: string | null
  warehouseId: string
  warehouseCode: string
  warehouseName: string
  quantity: string
  reorderPoint: string | null
  isLowStock: boolean
  status: StockStatus
  updatedAt: string
}

export type StockMovementListItem = {
  id: string
  productId: string
  productCode: string
  productName: string
  warehouseId: string
  warehouseName: string
  type: string
  quantityDelta: string
  resultingQuantity: string | null
  reason: string | null
  sourceType: string | null
  sourceId: string | null
  occurredAt: string
  createdByName: string
}

export type StockAdjustmentListItem = {
  id: string
  productId: string
  productCode: string
  productName: string
  warehouseId: string
  warehouseName: string
  quantityBefore: string
  quantityAfter: string
  quantityDelta: string
  reason: string
  notes: string | null
  status: string
  createdAt: string
  createdByName: string
}

export type StockAdjustmentCreated = {
  id: string
  productId: string
  warehouseId: string
  quantityBefore: string
  quantityAfter: string
  quantityDelta: string
  reason: string
  createdAt: string
}

export type InventoryFormOption = {
  id: string
  label: string
  help?: string
}

export type StockAdjustmentFormOptions = {
  products: InventoryFormOption[]
  warehouses: InventoryFormOption[]
  stockLevels: Array<{
    productId: string
    warehouseId: string
    quantity: string
  }>
}
