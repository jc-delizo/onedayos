import { defineModuleManifest } from '@/sdk'
import { inventoryAiContext } from './ai-context'
import { inventoryEventManifest } from './events'
import { inventoryNavigation } from './navigation'
import { INVENTORY_PERMISSIONS } from './permissions'
import { inventorySettings } from './settings'
import { INVENTORY_MODULE_COMPATIBILITY } from './types'

export const inventoryManifest = defineModuleManifest({
  schemaVersion: '1',
  id: 'inventory',
  label: 'Inventory',
  description: 'Tracks Product quantities in Warehouses through stock balances, manual adjustments, and an immutable movement ledger.',
  version: '0.1.0',
  lifecycle: 'draft',
  compatibility: INVENTORY_MODULE_COMPATIBILITY,
  icon: 'Package',
  dependencies: [],
  businessObjectsUsed: ['Product', 'ProductCategory', 'Customer', 'Supplier', 'Warehouse'],
  ownedEntities: [
    {
      key: 'inventory_product_extension',
      label: 'Inventory Product Extension',
      description: 'Inventory-specific settings for a shared Product.',
    },
    {
      key: 'stock_balance',
      label: 'Stock Balance',
      description: 'Current stock quantity for a Product in a Warehouse.',
    },
    {
      key: 'stock_movement',
      label: 'Stock Movement',
      description: 'Immutable inventory movement ledger entry.',
    },
    {
      key: 'stock_adjustment',
      label: 'Stock Adjustment',
      description: 'Posted manual stock correction record.',
    },
  ],
  permissions: Object.values(INVENTORY_PERMISSIONS),
  navItems: inventoryNavigation,
  routes: [
    {
      kind: 'page',
      path: '/inventory',
      label: 'Inventory',
      requiredPermission: INVENTORY_PERMISSIONS.DASHBOARD_READ,
    },
    {
      kind: 'page',
      path: '/inventory/process-flow',
      label: 'Inventory Process Flow',
      requiredPermission: INVENTORY_PERMISSIONS.DASHBOARD_READ,
    },
    {
      kind: 'page',
      path: '/inventory/product-settings',
      label: 'Inventory Product Settings',
      requiredPermission: INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ,
    },
    {
      kind: 'page',
      path: '/inventory/stock-levels',
      label: 'Stock Levels',
      requiredPermission: INVENTORY_PERMISSIONS.STOCK_LEVEL_READ,
    },
    {
      kind: 'page',
      path: '/inventory/stock-movements',
      label: 'Stock Movements',
      requiredPermission: INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ,
    },
    {
      kind: 'page',
      path: '/inventory/stock-adjustments',
      label: 'Stock Adjustments',
      requiredPermission: INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ,
    },
  ],
  apis: [
    {
      method: 'GET',
      path: '/api/orgs/[orgSlug]/inventory/dashboard',
      requiredPermission: INVENTORY_PERMISSIONS.DASHBOARD_READ,
    },
    {
      method: 'GET',
      path: '/api/orgs/[orgSlug]/inventory/product-settings',
      requiredPermission: INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ,
    },
    {
      method: 'POST',
      path: '/api/orgs/[orgSlug]/inventory/product-settings',
      requiredPermission: INVENTORY_PERMISSIONS.PRODUCT_SETTING_UPDATE,
    },
    {
      method: 'PATCH',
      path: '/api/orgs/[orgSlug]/inventory/product-settings/[id]',
      requiredPermission: INVENTORY_PERMISSIONS.PRODUCT_SETTING_UPDATE,
    },
    {
      method: 'GET',
      path: '/api/orgs/[orgSlug]/inventory/stock-levels',
      requiredPermission: INVENTORY_PERMISSIONS.STOCK_LEVEL_READ,
    },
    {
      method: 'GET',
      path: '/api/orgs/[orgSlug]/inventory/stock-movements',
      requiredPermission: INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ,
    },
    {
      method: 'GET',
      path: '/api/orgs/[orgSlug]/inventory/stock-adjustments',
      requiredPermission: INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ,
    },
    {
      method: 'POST',
      path: '/api/orgs/[orgSlug]/inventory/stock-adjustments',
      requiredPermission: INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE,
    },
    {
      method: 'GET',
      path: '/api/orgs/[orgSlug]/inventory/stock-adjustments/[id]',
      requiredPermission: INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ,
    },
  ],
  events: inventoryEventManifest,
  settings: inventorySettings,
  aiContext: inventoryAiContext,
  docs: {
    readme: 'src/modules/inventory/README.md',
    manual: 'src/modules/inventory/docs.md',
  },
})
