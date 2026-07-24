import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const root = process.cwd()

function source(path: string) {
  return readFileSync(join(root, path), 'utf8')
}

describe('Organization and Shared Records UX contracts', () => {
  it('keeps Organization as an Org Admin app using shared page patterns', () => {
    const landing = source('src/app/[orgSlug]/organization/page.tsx')
    const people = source('src/app/[orgSlug]/organization/people/page.tsx')
    const branches = source('src/app/[orgSlug]/organization/branches-departments/page.tsx')
    const settings = source('src/app/[orgSlug]/organization/settings/page.tsx')

    expect(landing).toContain('requireOrganizationAdmin(ctx)')
    expect(landing).toContain('AppPage')
    expect(landing).toContain('Built-in Org Admin surfaces')
    expect(landing).not.toContain('OrgModule')

    expect(people).toContain('OrganizationTableService.listPeople(ctx, query)')
    expect(source('src/platform/organization/table-service.ts')).toContain('requireOrganizationAdmin(ctx)')
    expect(people).toContain('ListPage')
    expect(people).toContain('Organization / People')
    expect(people).toContain('headerMode="compact"')
    expect(people).toContain('An Employee can exist without platform login access.')

    expect(branches).toContain('ListPage')
    expect(branches).toContain('Organization / Branches & Departments')
    expect(branches).toContain('headerMode="compact"')

    expect(settings).toContain('SettingsPage')
    expect(settings).toContain('Organization / Settings')
    expect(settings).toContain('headerMode="compact"')
    expect(settings).not.toContain('white-label')
    expect(settings).not.toContain('theme builder')
  })

  it('implements Shared Records as a permission-aware built-in app', () => {
    const landing = source('src/app/[orgSlug]/records/page.tsx')
    const listWrapper = source('src/app/[orgSlug]/records/_components/records-list-page.tsx')
    const formWrapper = source('src/app/[orgSlug]/records/_components/records-form-page.tsx')
    const appLauncher = source('src/app/[orgSlug]/apps/app-launcher.tsx')
    const navigation = source('src/platform/navigation/tenant-navigation.ts')

    expect(landing).toContain('AppPage')
    expect(landing).toContain('Shared Records are organization-wide business identities reused by enabled apps.')
    expect(landing).toContain("area.id === 'employees'")
    expect(landing).toContain('sdk.permissions.can')

    expect(listWrapper).toContain('ListPage')
    expect(listWrapper).toContain('Shared Records /')
    expect(listWrapper).toContain('Inventory / Related Records /')
    expect(listWrapper).toContain('People administration lives in Organization / People.')

    expect(formWrapper).toContain('FormPage')
    expect(formWrapper).toContain('Shared Records define business identity')
    expect(formWrapper).not.toContain('name="orgId"')

    expect(appLauncher).toContain('Shared Records provide organization-wide identities')
    expect(navigation).toContain("id: 'shared-records' as const")
    expect(navigation).toContain('allSharedRecords.length > 0')
    expect(navigation).not.toContain('OrgModule')
  })

  it('uses precise ownership wording for shared record areas', () => {
    const config = source('src/app/[orgSlug]/records/_components/records-config.ts')

    expect(config).toContain('Shared product/SKU identity used by Inventory and future modules.')
    expect(config).toContain('Shared product classification used across product-based workflows.')
    expect(config).toContain('Shared customer identity used by CRM and future customer-facing workflows. CRM is not implemented in this MVP.')
    expect(config).toContain('Shared supplier identity used by Inventory, Purchasing, and future procurement workflows. Purchasing is not implemented in this MVP.')
    expect(config).toContain('Shared warehouse/location identity used by Inventory and future stock workflows.')
    expect(config).toContain('Shared Product identity used by Inventory and other apps.')
    expect(config).toContain('Inventory V2 issues and CRM are not implemented yet.')

    expect(config).not.toContain('reorderPoint')
    expect(config).not.toContain('stock quantity')
    expect(config).not.toContain('pipeline')
    expect(config).not.toContain('payment terms')
  })

  it('records conformance evidence without public demo or formal accessibility claims', () => {
    const organizationConformance = source('src/platform/organization/UX-CONFORMANCE.md')
    const recordsConformance = source('src/business-objects/UX-CONFORMANCE.md')
    const implementationNote = source('docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-1-compact-header-shared-records-ia.md')

    expect(organizationConformance).toContain('Implementation Conformance Complete')
    expect(organizationConformance).toContain('Independent Org Admin Validation Pending')
    expect(organizationConformance).toContain('Public Demo Approval: Pending')

    expect(recordsConformance).toContain('Implementation Conformance Complete')
    expect(recordsConformance).toContain('Representative-User Validation Pending')
    expect(recordsConformance).toContain('Shared Records built-in app')

    expect(implementationNote).toContain('V2-1')
    expect(implementationNote).toContain('V2-2 remains blocked')
    expect(implementationNote).toContain('website asset production remains paused')
  })

  it('reuses shared presenters for direct and Inventory-context Records routes', () => {
    const directProducts = source('src/app/[orgSlug]/records/products/page.tsx')
    const contextualList = source('src/app/[orgSlug]/inventory/related/[area]/page.tsx')
    const contextualForm = source('src/app/[orgSlug]/inventory/related/[area]/[id]/edit/page.tsx')
    const presenters = source('src/app/[orgSlug]/records/_components/shared-record-pages.tsx')

    expect(directProducts).toContain('SharedRecordListPresenter')
    expect(contextualList).toContain('SharedRecordListPresenter')
    expect(contextualList).toContain("context=\"inventory\"")
    expect(contextualList).toContain("requirePageModuleContext(orgSlug, 'inventory')")
    expect(contextualForm).toContain('SharedRecordFormPresenter')
    expect(presenters).toContain('ProductService.list')
    expect(presenters).toContain('CustomerService.list')
    expect(presenters).toContain('SupplierService.list')
    expect(presenters).toContain('WarehouseService.list')
  })

  it('removes Product Settings from top-level navigation while preserving contextual access', () => {
    const navigation = source('src/platform/navigation/tenant-navigation.ts')
    const moduleNavigation = source('src/modules/inventory/navigation.ts')
    const stockLevels = source('src/app/[orgSlug]/inventory/stock-levels/page.tsx')
    const compatibilityPage = source('src/app/[orgSlug]/inventory/product-settings/page.tsx')

    expect(navigation).not.toContain('inventory-product-settings')
    expect(moduleNavigation).not.toContain('inventory.product-settings')
    expect(stockLevels).toContain('Manage tracking settings')
    expect(compatibilityPage).toContain('Inventory Tracking Settings')
    expect(compatibilityPage).toContain('compatibility page')
  })
})
