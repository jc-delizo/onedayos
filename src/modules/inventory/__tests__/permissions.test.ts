import { describe, expect, it } from 'vitest'
import { INVENTORY_PERMISSIONS } from '../permissions'

describe('inventory permissions', () => {
  it('uses full module permission objects in the inventory namespace', () => {
    expect(INVENTORY_PERMISSIONS).toMatchObject({
      DASHBOARD_READ: { module: 'inventory', resource: 'dashboard', action: 'read' },
      PRODUCT_SETTING_READ: { module: 'inventory', resource: 'product_setting', action: 'read' },
      PRODUCT_SETTING_UPDATE: { module: 'inventory', resource: 'product_setting', action: 'update' },
      STOCK_LEVEL_READ: { module: 'inventory', resource: 'stock_level', action: 'read' },
      STOCK_MOVEMENT_READ: { module: 'inventory', resource: 'stock_movement', action: 'read' },
      STOCK_ADJUSTMENT_READ: { module: 'inventory', resource: 'stock_adjustment', action: 'read' },
      STOCK_ADJUSTMENT_CREATE: { module: 'inventory', resource: 'stock_adjustment', action: 'create' },
      RECEIPT_READ: { module: 'inventory', resource: 'receipt', action: 'read' },
      RECEIPT_CREATE: { module: 'inventory', resource: 'receipt', action: 'create' },
      RECEIPT_REVERSE: { module: 'inventory', resource: 'receipt', action: 'reverse' },
      ISSUE_READ: { module: 'inventory', resource: 'issue', action: 'read' },
      ISSUE_CREATE: { module: 'inventory', resource: 'issue', action: 'create' },
      ISSUE_REVERSE: { module: 'inventory', resource: 'issue', action: 'reverse' },
      TRANSFER_READ: { module: 'inventory', resource: 'transfer', action: 'read' },
      TRANSFER_CREATE: { module: 'inventory', resource: 'transfer', action: 'create' },
      TRANSFER_REVERSE: { module: 'inventory', resource: 'transfer', action: 'reverse' },
      ADJUSTMENT_READ: { module: 'inventory', resource: 'adjustment', action: 'read' },
      ADJUSTMENT_CREATE: { module: 'inventory', resource: 'adjustment', action: 'create' },
      ADJUSTMENT_REVERSE: { module: 'inventory', resource: 'adjustment', action: 'reverse' },
      TRANSACTION_EXPORT: { module: 'inventory', resource: 'transaction', action: 'export' },
    })
  })

  it('does not use wildcard permissions or Business Object namespaces', () => {
    for (const permission of Object.values(INVENTORY_PERMISSIONS)) {
      expect(permission.module).toBe('inventory')
      expect(permission.module).not.toBe('objects')
      expect(permission.resource).not.toBe('*')
      expect(permission.action).not.toBe('*')
    }
  })
})
