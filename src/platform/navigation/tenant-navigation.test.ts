import { describe, expect, it } from 'vitest'
import type { PermissionGrant, PlatformContext } from '@/sdk'
import { buildTenantAppShellModel } from './tenant-navigation'

function grant(
  partial: Pick<PermissionGrant, 'module' | 'resource' | 'action'> & Partial<PermissionGrant>,
): PermissionGrant {
  return {
    id: `${partial.module}.${partial.resource}.${partial.action}`,
    roleId: 'role_a',
    orgId: 'org_a',
    conditions: null,
    ...partial,
  }
}

function makeCtx(permissions: PermissionGrant[]): PlatformContext {
  return {
    requestId: 'req_a',
    auth: {
      provider: 'supabase',
      userId: 'user_a',
      email: 'demo@example.test',
    },
    user: {
      id: 'user_a',
      orgId: 'org_a',
      name: 'Demo User',
      email: 'demo@example.test',
      isActive: true,
    },
    org: {
      id: 'org_a',
      slug: 'acme',
      name: 'Acme Trading',
      isActive: true,
      status: 'ACTIVE',
      subscriptionStatus: 'ACTIVE',
      plan: 'demo',
    },
    roles: [{ id: 'role_a', name: 'Staff', isSystem: false }],
    permissions,
    enabledModules: ['inventory'],
  }
}

const inventoryReadGrants = [
  grant({ module: 'inventory', resource: 'dashboard', action: 'read' }),
  grant({ module: 'inventory', resource: 'product_setting', action: 'read' }),
  grant({ module: 'inventory', resource: 'stock_level', action: 'read' }),
  grant({ module: 'inventory', resource: 'stock_movement', action: 'read' }),
  grant({ module: 'inventory', resource: 'stock_adjustment', action: 'read' }),
]

const objectReadGrants = [
  grant({ module: 'objects', resource: 'employee', action: 'read' }),
  grant({ module: 'objects', resource: 'product', action: 'read' }),
  grant({ module: 'objects', resource: 'product_category', action: 'read' }),
  grant({ module: 'objects', resource: 'customer', action: 'read' }),
  grant({ module: 'objects', resource: 'supplier', action: 'read' }),
  grant({ module: 'objects', resource: 'warehouse', action: 'read' }),
]

const warehouseOperatorGrants = [
  ...inventoryReadGrants,
  grant({ module: 'inventory', resource: 'stock_adjustment', action: 'create' }),
  grant({ module: 'objects', resource: 'product', action: 'read' }),
  grant({ module: 'objects', resource: 'product_category', action: 'read' }),
  grant({ module: 'objects', resource: 'supplier', action: 'read' }),
  grant({ module: 'objects', resource: 'warehouse', action: 'read' }),
]

describe('tenant app shell navigation resolver', () => {
  it('shows Organization as a built-in app only for Org Admin users', () => {
    const admin = buildTenantAppShellModel(
      makeCtx([
        ...inventoryReadGrants,
        ...objectReadGrants,
        grant({ module: 'kernel', resource: 'organization', action: 'manage' }),
      ]),
    )
    const staff = buildTenantAppShellModel(makeCtx([...inventoryReadGrants, ...objectReadGrants]))

    expect(admin.apps.map((app) => app.id)).toEqual(['inventory', 'shared-records', 'organization'])
    expect(staff.apps.map((app) => app.id)).toEqual(['inventory', 'shared-records'])
    expect(staff.sidebars.organization).toEqual([])
  })

  it('keeps Inventory sidebar operational, contextual, and free of Product Settings', () => {
    const model = buildTenantAppShellModel(
      makeCtx([
        ...inventoryReadGrants,
        ...objectReadGrants,
        grant({ module: 'kernel', resource: 'organization', action: 'manage' }),
      ]),
    )
    const inventoryLabels = model.sidebars.inventory.flatMap((section) => section.items.map((item) => item.label))

    expect(inventoryLabels.slice(0, 5)).toEqual([
      'Dashboard',
      'Process Flow',
      'Stock Levels',
      'Stock Movements',
      'Stock Adjustments',
    ])
    expect(inventoryLabels).toContain('Products')
    expect(inventoryLabels).toContain('Categories')
    expect(inventoryLabels).toContain('Customers')
    expect(inventoryLabels).toContain('Suppliers')
    expect(inventoryLabels).toContain('Warehouses')
    expect(inventoryLabels).not.toContain('Product Settings')
    expect(inventoryLabels).not.toContain('People')
    expect(inventoryLabels).not.toContain('Employees')
    const relatedItems = model.sidebars.inventory.find((section) => section.id === 'related-records')?.items ?? []
    expect(relatedItems.every((item) => item.href.startsWith('/acme/inventory/related/'))).toBe(true)
  })

  it('builds a least-privilege Warehouse Operator shell without Organization or unrelated Records', () => {
    const model = buildTenantAppShellModel(makeCtx(warehouseOperatorGrants))
    const appLabels = model.apps.map((app) => app.label)
    const inventoryLabels = model.sidebars.inventory.flatMap((section) => section.items.map((item) => item.label))
    const recordLabels = model.sidebars['shared-records'].flatMap((section) => section.items.map((item) => item.label))

    expect(appLabels).toEqual(['Inventory', 'Shared Records'])
    expect(model.sidebars.organization).toEqual([])
    expect(inventoryLabels).toEqual([
      'Dashboard',
      'Process Flow',
      'Stock Levels',
      'Stock Movements',
      'Stock Adjustments',
      'Products',
      'Categories',
      'Suppliers',
      'Warehouses',
    ])
    expect(inventoryLabels).not.toContain('People')
    expect(inventoryLabels).not.toContain('Employees')
    expect(inventoryLabels).not.toContain('Customers')
    expect(recordLabels).toEqual(['Products', 'Categories', 'Suppliers', 'Warehouses'])
  })

  it('hides Shared Records when no relevant object read permission exists', () => {
    const model = buildTenantAppShellModel(makeCtx(inventoryReadGrants))

    expect(model.apps.map((app) => app.id)).toEqual(['inventory'])
    expect(model.sidebars['shared-records']).toEqual([])
  })

  it('derives Shared Records from permissions, not enabled modules', () => {
    const ctx = makeCtx(objectReadGrants)
    ctx.enabledModules = []
    const model = buildTenantAppShellModel(ctx)

    expect(model.apps.map((app) => app.id)).toEqual(['shared-records'])
  })
})
