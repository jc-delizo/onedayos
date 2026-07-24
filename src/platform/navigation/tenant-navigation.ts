import type { PlatformContext } from '@/sdk'
import { can } from '@/kernel/permissions/match'
import type { TenantAppShellModel, TenantNavSection } from './types'

function orgHref(ctx: PlatformContext, suffix = '') {
  return `/${ctx.org.slug}${suffix}`
}

function canRead(ctx: PlatformContext, module: string, resource: string) {
  return can(ctx, { module, resource, action: 'read' })
}

function canManageOrganization(ctx: PlatformContext) {
  return can(ctx, { module: 'kernel', resource: 'organization', action: 'manage' })
}

export function buildTenantAppShellModel(ctx: PlatformContext): TenantAppShellModel {
  const inventoryEnabled = ctx.enabledModules.includes('inventory')
  const orgAdmin = canManageOrganization(ctx)

  const relatedInventoryRecords = [
    { id: 'products', label: 'Products', href: orgHref(ctx, '/inventory/related/products') },
    { id: 'product-categories', label: 'Categories', href: orgHref(ctx, '/inventory/related/product-categories') },
    { id: 'customers', label: 'Customers', href: orgHref(ctx, '/inventory/related/customers') },
    { id: 'suppliers', label: 'Suppliers', href: orgHref(ctx, '/inventory/related/suppliers') },
    { id: 'warehouses', label: 'Warehouses', href: orgHref(ctx, '/inventory/related/warehouses') },
  ].filter((item) => canRead(ctx, 'objects', item.id === 'product-categories' ? 'product_category' : item.id.slice(0, -1)))

  const allSharedRecords = [
    { id: 'products', label: 'Products', href: orgHref(ctx, '/records/products') },
    { id: 'product-categories', label: 'Categories', href: orgHref(ctx, '/records/product-categories') },
    { id: 'customers', label: 'Customers', href: orgHref(ctx, '/records/customers') },
    { id: 'suppliers', label: 'Suppliers', href: orgHref(ctx, '/records/suppliers') },
    { id: 'warehouses', label: 'Warehouses', href: orgHref(ctx, '/records/warehouses') },
  ].filter((item) => canRead(ctx, 'objects', item.id === 'product-categories' ? 'product_category' : item.id.slice(0, -1)))

  const inventoryItems = inventoryEnabled
    ? [
        {
          id: 'inventory-dashboard',
          label: 'Dashboard',
          href: orgHref(ctx, '/inventory'),
          exact: true,
        },
        {
          id: 'inventory-process-flow',
          label: 'Process Flow',
          href: orgHref(ctx, '/inventory/process-flow'),
        },
        {
          id: 'inventory-stock-levels',
          label: 'Stock Levels',
          href: orgHref(ctx, '/inventory/stock-levels'),
        },
        {
          id: 'inventory-stock-movements',
          label: 'Stock Movements',
          href: orgHref(ctx, '/inventory/stock-movements'),
        },
        {
          id: 'inventory-stock-adjustments',
          label: 'Stock Adjustments',
          href: orgHref(ctx, '/inventory/stock-adjustments'),
        },
      ].filter((item) => {
        if (item.id === 'inventory-dashboard') return canRead(ctx, 'inventory', 'dashboard')
        if (item.id === 'inventory-process-flow') return canRead(ctx, 'inventory', 'dashboard')
        if (item.id === 'inventory-stock-levels') return canRead(ctx, 'inventory', 'stock_level')
        if (item.id === 'inventory-stock-movements') return canRead(ctx, 'inventory', 'stock_movement')
        if (item.id === 'inventory-stock-adjustments') return canRead(ctx, 'inventory', 'stock_adjustment')
        return false
      })
    : []

  const organizationItems = orgAdmin
    ? [
        {
          id: 'organization-people',
          label: 'People',
          href: orgHref(ctx, '/organization/people'),
        },
        {
          id: 'organization-branches-departments',
          label: 'Branches & Departments',
          href: orgHref(ctx, '/organization/branches-departments'),
        },
        {
          id: 'organization-settings',
          label: 'Settings',
          href: orgHref(ctx, '/organization/settings'),
        },
      ]
    : []

  const workspaceSections: TenantNavSection[] = [
    {
      id: 'apps',
      label: 'Apps',
      items: [
        ...(inventoryItems.length > 0
          ? [{ id: 'app-inventory', label: 'Inventory', href: orgHref(ctx, '/inventory') }]
          : []),
        ...(allSharedRecords.length > 0
          ? [{ id: 'app-shared-records', label: 'Shared Records', href: orgHref(ctx, '/records') }]
          : []),
        ...(orgAdmin ? [{ id: 'app-organization', label: 'Organization', href: orgHref(ctx, '/organization') }] : []),
      ],
    },
  ].filter((section) => section.items.length > 0)

  const inventorySections: TenantNavSection[] = [
    ...(inventoryItems.length > 0
      ? [
          {
            id: 'inventory',
            label: 'Inventory',
            items: inventoryItems,
          },
        ]
      : []),
    ...(relatedInventoryRecords.length > 0
      ? [
          {
            id: 'related-records',
            label: 'Related Records',
            items: relatedInventoryRecords,
          },
        ]
      : []),
  ]

  const organizationSections: TenantNavSection[] = [
    ...(organizationItems.length > 0
      ? [
          {
            id: 'organization',
            label: 'Organization',
            items: organizationItems,
          },
        ]
      : []),
  ]

  const recordsSections: TenantNavSection[] = [
    ...(allSharedRecords.length > 0
      ? [
          {
            id: 'shared-records',
            label: 'Shared Records',
            items: allSharedRecords,
          },
        ]
      : []),
  ]

  const apps = [
    ...(inventoryItems.length > 0
      ? [
          {
            id: 'inventory' as const,
            label: 'Inventory',
            href: orgHref(ctx, '/inventory'),
            description: 'Stock levels, movements, tracking settings, and manual adjustments.',
            icon: 'Package' as const,
          },
        ]
      : []),
    ...(allSharedRecords.length > 0
      ? [
          {
            id: 'shared-records' as const,
            label: 'Shared Records',
            href: orgHref(ctx, '/records'),
            description: 'Organization-wide Products, Categories, Customers, Suppliers, and Warehouses.',
            icon: 'Database' as const,
          },
        ]
      : []),
    ...(orgAdmin
      ? [
          {
            id: 'organization' as const,
            label: 'Organization',
            href: orgHref(ctx, '/organization'),
            description: 'People, branches, departments, and organization-wide settings.',
            icon: 'Building2' as const,
          },
        ]
      : []),
  ]

  return {
    org: {
      name: ctx.org.name,
      slug: ctx.org.slug,
      plan: ctx.org.plan,
    },
    user: {
      name: ctx.user.name,
      email: ctx.user.email,
    },
    apps,
    sidebars: {
      workspace: workspaceSections,
      inventory: inventorySections,
      organization: organizationSections,
      'shared-records': recordsSections,
    },
  }
}
