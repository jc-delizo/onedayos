import type { ModulePermissionDefinition } from '@/sdk'

export const INVENTORY_PERMISSIONS = {
  DASHBOARD_READ: {
    module: 'inventory',
    resource: 'dashboard',
    action: 'read',
    label: 'View inventory dashboard',
    description: 'Allows the user to view inventory dashboard summaries inside the verified organization.',
  },
  PRODUCT_SETTING_READ: {
    module: 'inventory',
    resource: 'product_setting',
    action: 'read',
    label: 'View inventory product settings',
    description: 'Allows the user to view inventory-specific Product settings.',
  },
  PRODUCT_SETTING_UPDATE: {
    module: 'inventory',
    resource: 'product_setting',
    action: 'update',
    label: 'Update inventory product settings',
    description: 'Allows the user to create or update inventory-specific Product settings.',
  },
  STOCK_LEVEL_READ: {
    module: 'inventory',
    resource: 'stock_level',
    action: 'read',
    label: 'View stock levels',
    description: 'Allows the user to view current stock levels by shared Product and Warehouse.',
  },
  STOCK_LEVEL_EXPORT: {
    module: 'inventory',
    resource: 'stock_level',
    action: 'export',
    label: 'Export stock levels',
    description: 'Allows bounded server-side export of authorized stock levels.',
  },
  STOCK_MOVEMENT_READ: {
    module: 'inventory',
    resource: 'stock_movement',
    action: 'read',
    label: 'View stock movements',
    description: 'Allows the user to view the immutable inventory movement ledger.',
  },
  STOCK_MOVEMENT_EXPORT: {
    module: 'inventory',
    resource: 'stock_movement',
    action: 'export',
    label: 'Export stock movements',
    description: 'Allows bounded server-side export of authorized stock movements.',
  },
  STOCK_ADJUSTMENT_READ: {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'read',
    label: 'View stock adjustments',
    description: 'Allows the user to view posted manual stock adjustments.',
  },
  STOCK_ADJUSTMENT_EXPORT: {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'export',
    label: 'Export stock adjustments',
    description: 'Allows bounded server-side export of authorized stock adjustments.',
  },
  STOCK_ADJUSTMENT_CREATE: {
    module: 'inventory',
    resource: 'stock_adjustment',
    action: 'create',
    label: 'Create stock adjustments',
    description: 'Allows the user to create posted manual stock adjustments.',
  },
} as const satisfies Record<string, ModulePermissionDefinition>
