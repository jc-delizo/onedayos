import type { ModuleNavigationItem } from '@/sdk'
import { INVENTORY_PERMISSIONS } from './permissions'

export const inventoryNavigation = [
  {
    key: 'inventory.overview',
    label: 'Inventory',
    href: '/inventory',
    icon: 'Package',
    requiredPermission: INVENTORY_PERMISSIONS.DASHBOARD_READ,
  },
  {
    key: 'inventory.process-flow',
    label: 'Process Flow',
    href: '/inventory/process-flow',
    icon: 'Workflow',
    requiredPermission: INVENTORY_PERMISSIONS.DASHBOARD_READ,
  },
  {
    key: 'inventory.stock-levels',
    label: 'Stock Levels',
    href: '/inventory/stock-levels',
    icon: 'Boxes',
    requiredPermission: INVENTORY_PERMISSIONS.STOCK_LEVEL_READ,
  },
  {
    key: 'inventory.stock-movements',
    label: 'Stock Movements',
    href: '/inventory/stock-movements',
    icon: 'ListTree',
    requiredPermission: INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ,
  },
  {
    key: 'inventory.stock-adjustments',
    label: 'Stock Adjustments',
    href: '/inventory/stock-adjustments',
    icon: 'SlidersHorizontal',
    requiredPermission: INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ,
  },
] satisfies ModuleNavigationItem[]
