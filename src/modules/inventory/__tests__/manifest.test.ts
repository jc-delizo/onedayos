import { describe, expect, it } from 'vitest'
import { inventoryManifest } from '../manifest'

describe('inventory manifest', () => {
  it('is pure metadata with full permission objects and no wildcards', () => {
    expect(inventoryManifest.id).toBe('inventory')
    expect(inventoryManifest.lifecycle).toBe('draft')
    expect(inventoryManifest.permissions.length).toBeGreaterThanOrEqual(7)

    for (const permission of inventoryManifest.permissions) {
      expect(permission).toEqual(
        expect.objectContaining({
          module: 'inventory',
          resource: expect.any(String),
          action: expect.any(String),
          label: expect.any(String),
          description: expect.any(String),
        }),
      )
      expect(permission.resource).not.toBe('*')
      expect(permission.action).not.toBe('*')
    }
  })

  it('declares shared Business Objects separately from module-owned entities', () => {
    expect(inventoryManifest.businessObjectsUsed).toEqual(['Product', 'ProductCategory', 'Supplier', 'Warehouse'])
    expect(inventoryManifest.ownedEntities.map((entity) => entity.key)).toEqual([
      'inventory_product_extension',
      'stock_balance',
      'stock_movement',
      'stock_adjustment',
    ])
  })

  it('uses tenant-scoped pages and APIs only', () => {
    expect(inventoryManifest.routes.map((route) => route.path)).toEqual(
      expect.arrayContaining([
        '/inventory',
        '/inventory/process-flow',
        '/inventory/product-settings',
        '/inventory/stock-levels',
        '/inventory/stock-movements',
        '/inventory/stock-adjustments',
      ]),
    )

    for (const api of inventoryManifest.apis) {
      expect(api.path).toMatch(/^\/api\/orgs\/\[orgSlug\]\/inventory/)
      expect(api.path).not.toBe('/api/inventory')
      expect(api.path).not.toContain('/api/[module]')
    }
    expect(inventoryManifest.apis.map((api) => `${api.method} ${api.path}`)).toContain(
      'GET /api/orgs/[orgSlug]/inventory/stock-adjustments/[id]',
    )
  })
})
