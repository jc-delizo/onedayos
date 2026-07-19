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

    expect(people).toContain('requireOrganizationAdmin(ctx)')
    expect(people).toContain('ListPage')
    expect(people).toContain('Organization / People')
    expect(people).toContain('Manage people and platform-user relationships for this organization.')
    expect(people).toContain('An Employee can exist without platform login access.')

    expect(branches).toContain('ListPage')
    expect(branches).toContain('Organization / Branches & Departments')
    expect(branches).toContain('Manage company locations and organizational structure used across OneDayOS.')

    expect(settings).toContain('SettingsPage')
    expect(settings).toContain('Organization / Settings')
    expect(settings).toContain('Configure organization-wide preferences supported by OneDayOS.')
    expect(settings).not.toContain('white-label')
    expect(settings).not.toContain('theme builder')
  })

  it('keeps Shared Records as support surfaces, not an app', () => {
    const landing = source('src/app/[orgSlug]/records/page.tsx')
    const listWrapper = source('src/app/[orgSlug]/records/_components/records-list-page.tsx')
    const formWrapper = source('src/app/[orgSlug]/records/_components/records-form-page.tsx')
    const appLauncher = source('src/app/[orgSlug]/apps/app-launcher.tsx')

    expect(landing).toContain('AppPage')
    expect(landing).toContain('Shared Records are organization-wide business identities used by enabled apps.')
    expect(landing).toContain("area.id !== 'employees'")
    expect(landing).toContain('Records are not an app.')

    expect(listWrapper).toContain('ListPage')
    expect(listWrapper).toContain('Shared Records /')
    expect(listWrapper).toContain('People administration lives in Organization / People.')

    expect(formWrapper).toContain('FormPage')
    expect(formWrapper).toContain('Shared Records define business identity')
    expect(formWrapper).not.toContain('name="orgId"')

    expect(appLauncher).toContain('Records are not an app')
    expect(appLauncher).not.toContain('Open Records')
  })

  it('uses precise ownership wording for shared record areas', () => {
    const config = source('src/app/[orgSlug]/records/_components/records-config.ts')

    expect(config).toContain('Shared product/SKU identity used by Inventory and future modules.')
    expect(config).toContain('Shared product classification used across product-based workflows.')
    expect(config).toContain('Shared customer identity used by CRM and future customer-facing workflows. CRM is not implemented in this MVP.')
    expect(config).toContain('Shared supplier identity used by Inventory, Purchasing, and future procurement workflows. Purchasing is not implemented in this MVP.')
    expect(config).toContain('Shared warehouse/location identity used by Inventory and future stock workflows.')

    expect(config).not.toContain('reorderPoint')
    expect(config).not.toContain('stock quantity')
    expect(config).not.toContain('pipeline')
    expect(config).not.toContain('payment terms')
  })

  it('records conformance evidence without public demo or formal accessibility claims', () => {
    const organizationConformance = source('src/platform/organization/UX-CONFORMANCE.md')
    const recordsConformance = source('src/business-objects/UX-CONFORMANCE.md')
    const implementationNote = source('docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-organization-records-ux-retrofit.md')

    expect(organizationConformance).toContain('Implementation Conformance Complete')
    expect(organizationConformance).toContain('Independent Org Admin Validation Pending')
    expect(organizationConformance).toContain('Public Demo Approval: Pending')

    expect(recordsConformance).toContain('Implementation Conformance Complete')
    expect(recordsConformance).toContain('Representative-User Validation Pending')
    expect(recordsConformance).toContain('Records are not an app')

    expect(implementationNote).toContain('Organization remains a built-in Org Admin app')
    expect(implementationNote).toContain('Records are not an app')
    expect(implementationNote).toContain('Automated checks are structural regression gates only.')
  })
})
