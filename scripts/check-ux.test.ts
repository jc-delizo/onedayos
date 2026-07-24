import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { checkUx, discoverOfficialModules } from './check-ux'

const uxFields = [
  'primaryUsers',
  'userGoals',
  'primaryTasks',
  'taskFrequency',
  'workEnvironment',
  'requiredKnowledge',
  'relatedBusinessObjects',
  'moduleOwnedRecords',
  'criticalErrorsToPrevent',
  'permissionRoles',
  'appNavigation',
  'pageMap',
  'defaultLandingPage',
  'processFlowRoute',
  'keyboardWorkflows',
  'accessibilityRequirements',
  'usabilityTestScenarios',
  'knownMvpLimitations',
  'futureIntegrations',
] as const

let roots: string[] = []

afterEach(() => {
  for (const root of roots) {
    rmSync(root, { recursive: true, force: true })
  }
  roots = []
})

function write(root: string, path: string, content: string) {
  const absolute = join(root, path)
  mkdirSync(join(absolute, '..'), { recursive: true })
  writeFileSync(absolute, content)
}

function camelModule(moduleId: string) {
  return moduleId.replace(/-([a-z0-9])/g, (_, char: string) => char.toUpperCase())
}

function uxSource(options: { includeFields?: readonly string[]; todo?: boolean } = {}) {
  const fields = options.includeFields ?? uxFields
  const body = fields
    .map((field) => {
      if (field === 'defaultLandingPage') return `  ${field}: '/[orgSlug]/warehouse-ops',`
      if (field === 'processFlowRoute') return `  ${field}: '/[orgSlug]/warehouse-ops/process-flow',`
      return `  ${field}: ['${field}'],`
    })
    .join('\n')

  return `import type { ModuleUxContract } from '@/sdk'

export const warehouseOpsUx = {
${body}
${options.todo ? "  draftNote: 'TODO(UX)'," : ''}
} as const satisfies ModuleUxContract
`
}

function processFlowSource(options: { todo?: boolean } = {}) {
  return `import type { ProcessFlowDefinition } from '@/sdk'

export const warehouseOpsProcessFlow = {
  title: 'Warehouse Ops Process Flow',
  description: 'Explains the workflow.',
  steps: [{ id: 'setup', title: 'Setup', description: 'Prepare records.', inputs: ['Input'], outputs: ['Output'] }],
  owns: ['ModuleRecord'],
  doesNotOwn: ['Product'],
  currentBoundaries: ['Current scope.'],
  futureIntegrations: ['Future integration.'],
  ${options.todo ? "note: 'TODO(UX)'," : ''}
} as const satisfies ProcessFlowDefinition
`
}

function conformanceSource(content = 'Implementation Conformance Complete\nRole-Based UX Validation Preparation Complete\nHuman Validation Pending\n') {
  return `# UX Conformance

## Status

${content}
`
}

function createFixture(moduleId = 'warehouse-ops') {
  const root = mkdtempSync(join(tmpdir(), 'onedayos-check-ux-'))
  roots.push(root)

  const localName = `${camelModule(moduleId)}Manifest`

  write(
    root,
    'src/modules/index.ts',
    `import { ${localName} } from './${moduleId}/manifest'

export const moduleManifests = [
  ${localName},
] as const
`,
  )
  write(root, `src/modules/${moduleId}/manifest.ts`, `export const ${localName} = { id: '${moduleId}', routes: [{ path: '/${moduleId}/process-flow' }] }`)
  write(root, `src/modules/${moduleId}/navigation.ts`, `export const navigation = [{ href: '/${moduleId}/process-flow', label: 'Process Flow' }]`)
  write(root, `src/modules/${moduleId}/ux.ts`, uxSource())
  write(root, `src/modules/${moduleId}/process-flow.ts`, processFlowSource())
  write(root, `src/modules/${moduleId}/UX-CONFORMANCE.md`, conformanceSource())
  write(root, `src/modules/${moduleId}/__tests__/ux.test.ts`, `import { describe, it } from 'vitest'\ndescribe('ux', () => { it('exists', () => {}) })`)
  write(root, `src/modules/${moduleId}/__tests__/process-flow.test.ts`, `import { describe, it } from 'vitest'\ndescribe('process flow', () => { it('exists', () => {}) })`)
  write(root, `src/app/[orgSlug]/${moduleId}/process-flow/page.tsx`, `import { ProcessFlowPage } from '@/components/onedayos'\nexport default function Page() { return <ProcessFlowPage definition={{} as never} /> }`)
  write(root, `src/app/[orgSlug]/${moduleId}/process-flow/loading.tsx`, `import { ProcessFlowLoadingState } from '@/components/onedayos'\nexport default function Loading() { return <ProcessFlowLoadingState /> }`)
  write(
    root,
    'package.json',
    JSON.stringify({
      scripts: {
        start: 'next start -p 1320',
        'check:all': 'npm run check:env',
        'demo:check': 'tsx scripts/check-demo-readiness.ts',
        'demo:reset': 'tsx scripts/reset-sandbox-demo.ts',
      },
      dependencies: { 'lucide-react': '1.25.0' },
    }),
  )
  write(root, '.env.example', 'ONEDAYOS_DEMO_MODE=false\nONEDAYOS_PUBLIC_REGISTRATION_ENABLED=true\nONEDAYOS_DEMO_RESET_APPROVED=false\n')
  write(root, 'docs/engineering-manual/00-meta/adrs/ADR-0013-runtime-appearance-preference.md', 'ADR-0013 Runtime Appearance Preference')
  write(root, 'docs/engineering-manual/03-design-system/14-runtime-appearance.md', 'Runtime Appearance specification')
  write(root, 'docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-runtime-appearance.md', 'Runtime Appearance implementation note')
  write(
    root,
    'src/components/onedayos/theme-script.ts',
    `export const APPEARANCE_STORAGE_KEY = 'onedayos.appearance'
export const APPEARANCE_PREFERENCES = ['light', 'dark', 'system'] as const
export function getAppearanceInitScript() {
  return "document.documentElement.setAttribute('data-appearance','system');document.documentElement.setAttribute('data-resolved-appearance','light');document.documentElement.style.colorScheme='light'"
}
`,
  )
  write(
    root,
    'src/components/onedayos/appearance-provider.tsx',
    `'use client'
export type AppearancePreference = 'light' | 'dark' | 'system'
export function AppearanceProvider() { return null }
export function useAppearance() { return { preference: 'system', resolvedAppearance: 'light', setPreference() {} } }
`,
  )
  write(
    root,
    'src/components/onedayos/app-shell.tsx',
    `import { Grid3X3 } from 'lucide-react'
export function getCurrentNavContext(pathname: string) { if (pathname.includes('/records')) return 'shared-records'; return 'workspace' }
export function AppShell() {
  return <aside><button aria-label="Switch apps"><Grid3X3 />Inventory</button><button aria-label="Open profile menu">Profile</button><p>Appearance</p><button>Light</button><button>Dark</button><button>System</button></aside>
}
`,
  )
  write(root, 'src/components/onedayos/page-header.tsx', `export type PageHeaderMode = 'compact' | 'explanatory'\nexport function PageHeader() { return <h1>Title</h1> }`)
  write(root, 'src/components/onedayos/patterns/process-flow-page.tsx', `export function ProcessFlowPage() { return <AppPage headerMode="explanatory" title="Process Flow" /> }`)
  write(root, 'src/platform/organization/UX-CONFORMANCE.md', 'Implementation Conformance Complete\nRole-Based UX Validation Preparation Complete\nIndependent Org Admin Validation Pending\n')
  write(root, 'src/business-objects/UX-CONFORMANCE.md', 'Implementation Conformance Complete\nRole-Based UX Validation Preparation Complete\nRepresentative-User Validation Pending\nShared Records built-in app\n')
  write(
    root,
    'docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-organization-records-ux-retrofit.md',
    'Organization remains a built-in Org Admin app. Records are not an app. Automated checks are structural regression gates only.',
  )
  write(
    root,
    'docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-1-compact-header-shared-records-ia.md',
    'V2-1 complete. V2-2 remains blocked. website asset production remains paused.',
  )
  write(
    root,
    'src/app/[orgSlug]/organization/page.tsx',
    `import { AppPage } from '@/components/onedayos'
export default function Page() {
  requireOrganizationAdmin(ctx)
  return <AppPage title="Organization" description="Built-in Org Admin surfaces" />
}
`,
  )
  write(
    root,
    'src/app/[orgSlug]/organization/people/page.tsx',
    `import { ListPage } from '@/components/onedayos'
export default function Page() {
  requireOrganizationAdmin(ctx)
  return <ListPage title="People" description="Manage people and platform-user relationships for this organization.">An Employee can exist without platform login access.</ListPage>
}
`,
  )
  write(
    root,
    'src/app/[orgSlug]/organization/branches-departments/page.tsx',
    `import { ListPage } from '@/components/onedayos'
export default function Page() {
  requireOrganizationAdmin(ctx)
  return <ListPage title="Branches & Departments" description="Manage company locations and organizational structure used across OneDayOS.">Rows</ListPage>
}
`,
  )
  write(
    root,
    'src/app/[orgSlug]/organization/settings/page.tsx',
    `import { SettingsPage } from '@/components/onedayos'
export default function Page() {
  requireOrganizationAdmin(ctx)
  return <SettingsPage title="Settings" description="Configure organization-wide preferences supported by OneDayOS." sections={<section />} />
}
`,
  )
  write(root, 'src/app/[orgSlug]/organization/loading.tsx', `import { TablePageSkeleton } from '@/components/onedayos'\nexport default function Loading() { return <TablePageSkeleton label="Loading organization admin" /> }`)
  write(root, 'src/app/[orgSlug]/organization/error.tsx', `'use client'\nimport { SafePageErrorState } from '@/components/onedayos'\nexport default function Error() { return <SafePageErrorState title="Unable to load Organization" /> }`)
  write(
    root,
    'docs/demo/ROLE-BASED-UX-VALIDATION-GUIDE.md',
    `# Role-Based UX Validation Guide

This guide does not claim representative-user validation has occurred.

## Org Admin

Review apps, Organization, Inventory, and profile flows.

## Warehouse User

Inventory only. Organization app must not appear.

## Manual Accessibility Checklist

Keyboard, focus, labels, loading, errors.
`,
  )
  write(
    root,
    'docs/demo/reviews/FOUNDER-ORG-ADMIN-UX-REVIEW.md',
    '# Founder Org Admin UX Review\n\nStatus: Completed\nScore: Not scored\nBlocker findings: None reported\nMust-Fix findings: None reported\n',
  )
  write(
    root,
    'docs/demo/reviews/FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md',
    '# Founder Warehouse Proxy UX Review\n\nStatus: Completed\nScore: Not scored\nBlocker findings: None reported\nMust-Fix findings: None reported\n',
  )
  write(root, 'docs/demo/reviews/MANUAL-ACCESSIBILITY-REVIEW.md', '# Manual Accessibility Review\n\nStatus: Pending\n')
  write(root, 'docs/demo/reviews/UX-FINDINGS-LOG.md', '# UX Findings Log\n\nStatus: Pending\n')
  write(
    root,
    'docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-role-based-ux-validation-preparation.md',
    'Warehouse Operator sandbox persona prepared. Human validation remains pending.',
  )
  write(root, 'docs/demo/CONTROLLED-DEMO-RUNBOOK.md', 'Controlled guided demo only. Public self-service demo approval is not implied.')
  write(root, 'docs/demo/DEMO-STORYBOARD-INVENTORY.md', 'Inventory storyboard for controlled guided demo.')
  write(root, 'docs/demo/DEMO-READINESS-CHECKLIST.md', 'Run demo:reset and demo:check before each controlled session.')
  write(root, 'docs/demo/DEMO-KNOWN-LIMITATIONS.md', 'Not public demo ready. No production readiness claim.')
  write(root, 'docs/demo/WEBSITE-SAMPLE-ASSET-PLAN.md', 'Use sanitized screenshots only after controlled demo gates pass.')
  write(
    root,
    'docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-controlled-demo-preparation.md',
    'Controlled demo mode disables registration, noindexes the sandbox, and requires guarded reset/readiness scripts.',
  )
  write(
    root,
    'src/app/api/kernel/auth/register/route.ts',
    `export async function POST() { throw apiErrors.registrationDisabled() }`,
  )
  write(
    root,
    'src/app/register/page.tsx',
    `export default function Page() { return <p>Registration is currently invite-only. Use the demo credentials provided by your OneDayOS guide.</p> }`,
  )
  write(
    root,
    'src/app/login/page.tsx',
    `export default function Page() { return publicRegistrationEnabled ? <a>Create account</a> : null }`,
  )
  write(
    root,
    'src/app/layout.tsx',
    `export function generateMetadata() { return { robots: { index: false, follow: false } } }`,
  )
  write(
    root,
    'src/app/robots.ts',
    `export default function robots() { return { rules: { userAgent: '*', disallow: '/' } } }`,
  )
  write(
    root,
    'scripts/check-demo-readiness.ts',
    `console.log('Controlled demo readiness checks passed.'); console.log('Public self-service demo approval is not implied.')`,
  )
  write(
    root,
    'scripts/reset-sandbox-demo.ts',
    `const guards = ['ONEDAYOS_DEMO_MODE', 'ONEDAYOS_SANDBOX_DB_APPROVED', 'ONEDAYOS_DEMO_RESET_APPROVED', 'ONEDAYOS_DEMO_ORG_SLUG']
await tx.stockMovement.deleteMany({ where: { orgId: org.id } })
await tx.stockAdjustment.deleteMany({ where: { orgId: org.id } })
await tx.stockBalance.deleteMany({ where: { orgId: org.id } })
await tx.inventoryProductExtension.deleteMany({ where: { orgId: org.id } })
console.log(guards)
`,
  )
  write(
    root,
    'scripts/provision-sandbox-demo.ts',
    `const WAREHOUSE_OPERATOR_ROLE_NAME = 'Warehouse Operator'
const WAREHOUSE_OPERATOR_PERMISSION_PROFILE = [
  INVENTORY_PERMISSIONS.DASHBOARD_READ,
  INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ,
  INVENTORY_PERMISSIONS.STOCK_LEVEL_READ,
  INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ,
  INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ,
  INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE,
  PRODUCT_PERMISSIONS.READ,
  PRODUCT_CATEGORY_PERMISSIONS.READ,
  SUPPLIER_PERMISSIONS.READ,
  WAREHOUSE_PERMISSIONS.READ,
] as const
const REQUIRED_ENV = ['ONEDAYOS_DEMO_WAREHOUSE_EMAIL', 'ONEDAYOS_DEMO_WAREHOUSE_PASSWORD', 'ONEDAYOS_DEMO_WAREHOUSE_NAME']
const approvedWarehousePermissionKeys = new Set()
const staleWarehousePermissionIds = []
`,
  )
  write(
    root,
    'src/app/[orgSlug]/records/page.tsx',
    `import { AppPage } from '@/components/onedayos'
const sdk = { permissions: { can: () => true } }
const recordAreas = [{ id: 'products' }, { id: 'employees' }]
export default function Page() {
  const landingAreas = recordAreas.filter((area) => area.id === 'employees' ? false : sdk.permissions.can())
  return <AppPage title="Shared Records">Shared Records are organization-wide business identities reused by enabled apps. {landingAreas.length}</AppPage>
}
`,
  )
  write(
    root,
    'src/app/[orgSlug]/records/_components/records-list-page.tsx',
    `import { ListPage } from '@/components/onedayos'
export function RecordsListPage() {
  return <ListPage title="Products" description="Shared Records / Products">People administration lives in Organization / People.</ListPage>
}
`,
  )
  write(
    root,
    'src/app/[orgSlug]/records/_components/records-form-page.tsx',
    `import { FormPage } from '@/components/onedayos'
export function RecordsFormPage() {
  return <FormPage title="New Product" description="Shared Records define business identity" form={<form />} />
}
`,
  )
  write(
    root,
    'src/app/[orgSlug]/records/_components/records-config.ts',
    `export const recordAreas = [
  { description: 'Shared product/SKU identity used by Inventory and future modules.' },
  { description: 'Shared product classification used across product-based workflows.' },
  { description: 'Shared customer identity used by CRM and future customer-facing workflows. CRM is not implemented in this MVP.' },
  { description: 'Shared supplier identity used by Inventory, Purchasing, and future procurement workflows. Purchasing is not implemented in this MVP.' },
  { description: 'Shared warehouse/location identity used by Inventory and future stock workflows.' },
]
`,
  )
  write(root, 'src/app/[orgSlug]/records/loading.tsx', `import { TablePageSkeleton } from '@/components/onedayos'\nexport default function Loading() { return <TablePageSkeleton label="Loading records table" /> }`)
  write(root, 'src/app/[orgSlug]/records/error.tsx', `'use client'\nimport { ErrorState } from '@/components/onedayos'\nexport default function Error() { return <ErrorState title="Unable to load Records" /> }`)
  write(
    root,
    'src/app/[orgSlug]/apps/app-launcher.tsx',
    `export function AppLauncher() {
  return <p>Open Shared Records.</p>
}
`,
  )
  write(
    root,
    'src/platform/navigation/tenant-navigation.ts',
    `export function buildTenantAppShellModel(ctx: { enabledModules: string[] }) {
  const inventoryEnabled = ctx.enabledModules.includes('inventory')
  const relatedInventoryRecords = [
    { id: 'products', label: 'Products', href: '/acme/inventory/related/products' },
    { id: 'product-categories', label: 'Categories', href: '/acme/inventory/related/product-categories' },
    { id: 'customers', label: 'Customers', href: '/acme/inventory/related/customers' },
    { id: 'suppliers', label: 'Suppliers', href: '/acme/inventory/related/suppliers' },
    { id: 'warehouses', label: 'Warehouses', href: '/acme/inventory/related/warehouses' },
  ].filter(Boolean)
  const allSharedRecords = [{ id: 'products' }]
  const organizationItems = [{ id: 'organization-people', label: 'People' }]
  const apps = [
    ...(inventoryEnabled ? [{ id: 'inventory' as const, label: 'Inventory' }] : []),
    ...(allSharedRecords.length > 0 ? [{ id: 'shared-records' as const, label: 'Shared Records' }] : []),
    { id: 'organization' as const, label: 'Organization' },
  ]
  return { relatedInventoryRecords, organizationItems, apps }
}
`,
  )
  write(root, 'src/modules/inventory/navigation.ts', `export const inventoryNavigation = [{ key: 'inventory.stock-levels' }]`)
  write(root, 'src/app/[orgSlug]/inventory/product-settings/page.tsx', `export default function Page() { return <h1>Inventory Tracking Settings</h1> }`)

  return root
}

function expectFinding(findings: ReturnType<typeof checkUx>, rule: string, filePattern?: string) {
  expect(findings).toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        rule,
        ...(filePattern ? { file: expect.stringContaining(filePattern) } : {}),
      }),
    ]),
  )
}

describe('checkUx', () => {
  it('passes for a complete official-module fixture and allows truthful human validation pending status', () => {
    const root = createFixture()

    expect(discoverOfficialModules(root)).toEqual(['warehouse-ops'])
    expect(checkUx(root)).toEqual([])
  })

  it('does not hardcode Inventory as the only possible official module', () => {
    const root = createFixture('stock-control')

    expect(discoverOfficialModules(root)).toEqual(['stock-control'])
    expect(checkUx(root)).toEqual([])
  })

  it('fails when ux.ts is missing', () => {
    const root = createFixture()
    rmSync(join(root, 'src/modules/warehouse-ops/ux.ts'))

    expectFinding(checkUx(root), 'missing-official-module-ux-file', 'src/modules/warehouse-ops/ux.ts')
  })

  it('fails when process-flow.ts is missing', () => {
    const root = createFixture()
    rmSync(join(root, 'src/modules/warehouse-ops/process-flow.ts'))

    expectFinding(checkUx(root), 'missing-official-module-ux-file', 'src/modules/warehouse-ops/process-flow.ts')
  })

  it('fails when UX-CONFORMANCE.md is missing', () => {
    const root = createFixture()
    rmSync(join(root, 'src/modules/warehouse-ops/UX-CONFORMANCE.md'))

    expectFinding(checkUx(root), 'missing-official-module-ux-file', 'src/modules/warehouse-ops/UX-CONFORMANCE.md')
  })

  it('fails when Process Flow page is missing', () => {
    const root = createFixture()
    rmSync(join(root, 'src/app/[orgSlug]/warehouse-ops/process-flow/page.tsx'))

    expectFinding(checkUx(root), 'missing-process-flow-route', 'src/app/[orgSlug]/warehouse-ops/process-flow/page.tsx')
  })

  it('fails when Process Flow loading route is missing', () => {
    const root = createFixture()
    rmSync(join(root, 'src/app/[orgSlug]/warehouse-ops/process-flow/loading.tsx'))

    expectFinding(checkUx(root), 'missing-process-flow-route', 'src/app/[orgSlug]/warehouse-ops/process-flow/loading.tsx')
  })

  it('fails when generated TODO(UX) remains in an official module', () => {
    const root = createFixture()
    write(root, 'src/modules/warehouse-ops/ux.ts', uxSource({ todo: true }))

    expectFinding(checkUx(root), 'unresolved-ux-placeholder', 'src/modules/warehouse-ops/ux.ts')
  })

  it('fails when generated Not Reviewed / Not Approved conformance scaffold remains unchanged', () => {
    const root = createFixture()
    write(root, 'src/modules/warehouse-ops/UX-CONFORMANCE.md', conformanceSource('Status: Not Reviewed\nApproval Result: Not Approved\n'))

    expectFinding(checkUx(root), 'unreviewed-generator-conformance', 'src/modules/warehouse-ops/UX-CONFORMANCE.md')
  })

  it('fails on generic final Loading... text', () => {
    const root = createFixture()
    write(root, 'src/app/[orgSlug]/warehouse-ops/loading.tsx', `export default function Loading() { return <p>Loading...</p> }`)

    expectFinding(checkUx(root), 'generic-loading-text', 'src/app/[orgSlug]/warehouse-ops/loading.tsx')
  })

  it('fails on generic final Error text', () => {
    const root = createFixture()
    write(root, 'src/app/[orgSlug]/warehouse-ops/error.tsx', `export default function Error() { return <p>Error</p> }`)

    expectFinding(checkUx(root), 'generic-error-text', 'src/app/[orgSlug]/warehouse-ops/error.tsx')
  })

  it('fails on fake dashboard metric placeholders', () => {
    const root = createFixture()
    write(root, 'src/app/[orgSlug]/warehouse-ops/page.tsx', `export default function Page() { return <p>fake dashboard metrics</p> }`)

    expectFinding(checkUx(root), 'fake-dashboard-metric', 'src/app/[orgSlug]/warehouse-ops/page.tsx')
  })

  it('fails when required ModuleUxContract fields are missing', () => {
    const root = createFixture()
    write(root, 'src/modules/warehouse-ops/ux.ts', uxSource({ includeFields: uxFields.filter((field) => field !== 'futureIntegrations') }))

    expectFinding(checkUx(root), 'missing-module-ux-field', 'src/modules/warehouse-ops/ux.ts')
  })

  it('ignores docs, archive, and temporary generated output that is not officially registered', () => {
    const root = createFixture()
    write(root, 'docs/example.md', 'TODO(UX)\nStatus: Not Reviewed\nApproval Result: Not Approved\n')
    write(root, '_archive/src/modules/old/ux.ts', 'TODO(UX)')
    write(root, 'tmp/generated/src/modules/temp/ux.ts', 'TODO(UX)')

    expect(checkUx(root)).toEqual([])
  })

  it('fails when OneDayOS Compact tokens are missing or accent is mapped to brand orange', () => {
    const root = createFixture()
    write(
      root,
      'src/app/globals.css',
      `:root {
  --color-brand: #F97316;
  --color-accent: #F97316;
  --font-sans: Inter, ui-sans-serif, system-ui;
}
`,
    )

    expectFinding(checkUx(root), 'missing-compact-preset-token', 'src/app/globals.css')
    expectFinding(checkUx(root), 'orange-accent-token', 'src/app/globals.css')
    expectFinding(checkUx(root), 'stale-inter-font', 'src/app/globals.css')
  })

  it('fails when Button hardcodes brand orange instead of semantic tokens', () => {
    const root = createFixture()
    write(root, 'src/components/ui/button.tsx', `export const buttonClass = 'bg-[#F97316]'`)

    expectFinding(checkUx(root), 'raw-orange-button', 'src/components/ui/button.tsx')
  })

  it('fails when active source uses a second icon library', () => {
    const root = createFixture()
    write(root, 'src/components/legacy-icons.tsx', `import { UserIcon } from '@heroicons/react/24/outline'\nexport function Icon() { return <UserIcon /> }`)

    expectFinding(checkUx(root), 'mixed-icon-library', 'src/components/legacy-icons.tsx')
  })

  it('fails when app shell drops Lucide app chrome or reintroduces retired app labels', () => {
    const root = createFixture()
    write(
      root,
      'src/components/onedayos/app-shell.tsx',
      `export function AppShell() { return <button aria-label="Switch apps">CURRENT APP Apps &gt;</button> }`,
    )

    expectFinding(checkUx(root), 'retired-app-switcher-label', 'src/components/onedayos/app-shell.tsx')
    expectFinding(checkUx(root), 'missing-lucide-shell-icons', 'src/components/onedayos/app-shell.tsx')
  })

  it('fails when runtime appearance governance or provider contract is missing', () => {
    const root = createFixture()
    rmSync(join(root, 'docs/engineering-manual/03-design-system/14-runtime-appearance.md'))
    write(root, 'src/components/onedayos/theme-script.ts', `export const APPEARANCE_STORAGE_KEY = 'onedayos-theme'`)
    write(root, 'src/components/onedayos/appearance-provider.tsx', `'use client'\nexport const value = 'orgId theme'`)

    expectFinding(checkUx(root), 'missing-runtime-appearance-document', 'docs/engineering-manual/03-design-system/14-runtime-appearance.md')
    expectFinding(checkUx(root), 'unstable-appearance-storage-key', 'src/components/onedayos/theme-script.ts')
    expectFinding(checkUx(root), 'missing-appearance-dom-contract', 'src/components/onedayos/theme-script.ts')
    expectFinding(checkUx(root), 'tenant-coupled-appearance', 'src/components/onedayos/appearance-provider.tsx')
  })

  it('fails when runtime appearance adds next-themes or a database-backed preference', () => {
    const root = createFixture()
    write(root, 'package.json', JSON.stringify({ dependencies: { 'next-themes': 'latest' } }))
    write(root, 'prisma/schema.prisma', 'model User { id String @id appearancePreference String? }')

    expectFinding(checkUx(root), 'next-themes-runtime-dependency', 'package.json')
    expectFinding(checkUx(root), 'appearance-persisted-in-database', 'prisma/schema.prisma')
  })

  it('fails when Organization and Shared Records UX conformance documents are missing', () => {
    const root = createFixture()
    rmSync(join(root, 'src/platform/organization/UX-CONFORMANCE.md'))
    rmSync(join(root, 'src/business-objects/UX-CONFORMANCE.md'))

    expectFinding(checkUx(root), 'missing-platform-ux-conformance-document', 'src/platform/organization/UX-CONFORMANCE.md')
    expectFinding(checkUx(root), 'missing-platform-ux-conformance-document', 'src/business-objects/UX-CONFORMANCE.md')
  })

  it('fails when Organization or Shared Records routes bypass shared page patterns', () => {
    const root = createFixture()
    write(root, 'src/app/[orgSlug]/organization/people/page.tsx', `export default function Page() { requireOrganizationAdmin(ctx); return <div>People</div> }`)
    write(root, 'src/app/[orgSlug]/organization/settings/page.tsx', `export default function Page() { requireOrganizationAdmin(ctx); return <div>Settings</div> }`)
    write(root, 'src/app/[orgSlug]/records/_components/records-list-page.tsx', `export function RecordsListPage() { return <div>Rows</div> }`)
    write(root, 'src/app/[orgSlug]/records/_components/records-form-page.tsx', `export function RecordsFormPage() { return <form /> }`)

    expectFinding(checkUx(root), 'organization-people-pattern', 'src/app/[orgSlug]/organization/people/page.tsx')
    expectFinding(checkUx(root), 'organization-settings-pattern', 'src/app/[orgSlug]/organization/settings/page.tsx')
    expectFinding(checkUx(root), 'records-list-pattern', 'src/app/[orgSlug]/records/_components/records-list-page.tsx')
    expectFinding(checkUx(root), 'records-form-pattern', 'src/app/[orgSlug]/records/_components/records-form-page.tsx')
  })

  it('fails when Shared Records app identity is missing or Inventory related Records leak People', () => {
    const root = createFixture()
    write(root, 'src/app/[orgSlug]/apps/app-launcher.tsx', `export function AppLauncher() { return <a>Open Inventory</a> }`)
    write(
      root,
      'src/platform/navigation/tenant-navigation.ts',
      `export function buildTenantAppShellModel() {
  const relatedInventoryRecords = [
    { label: 'Products' },
    { label: 'Customers' },
    { label: 'People' },
  ].filter(Boolean)
  const apps = [{ id: 'records' as const, label: 'Records' }]
  return { relatedInventoryRecords, apps }
}
`,
    )

    expectFinding(checkUx(root), 'missing-shared-records-app', 'src/app/[orgSlug]/apps/app-launcher.tsx')
    expectFinding(checkUx(root), 'invalid-shared-records-app', 'src/platform/navigation/tenant-navigation.ts')
    expectFinding(checkUx(root), 'inventory-sidebar-platform-record-leak', 'src/platform/navigation/tenant-navigation.ts')
    expectFinding(checkUx(root), 'inventory-related-record-context-loss', 'src/platform/navigation/tenant-navigation.ts')
  })

  it('fails when role-based UX validation preparation artifacts are missing', () => {
    const root = createFixture()
    rmSync(join(root, 'docs/demo/ROLE-BASED-UX-VALIDATION-GUIDE.md'))

    expectFinding(checkUx(root), 'missing-role-based-ux-validation-artifact', 'docs/demo/ROLE-BASED-UX-VALIDATION-GUIDE.md')
  })

  it('fails when the Warehouse Operator sandbox profile is overprivileged', () => {
    const root = createFixture()
    write(
      root,
      'scripts/provision-sandbox-demo.ts',
      `const WAREHOUSE_OPERATOR_ROLE_NAME = 'Warehouse Operator'
const WAREHOUSE_OPERATOR_PERMISSION_PROFILE = [
  INVENTORY_PERMISSIONS.DASHBOARD_READ,
  INVENTORY_PERMISSIONS.PRODUCT_SETTING_UPDATE,
  { module: '*', resource: '*', action: '*' },
] as const
const REQUIRED_ENV = ['ONEDAYOS_DEMO_WAREHOUSE_EMAIL', 'ONEDAYOS_DEMO_WAREHOUSE_PASSWORD', 'ONEDAYOS_DEMO_WAREHOUSE_NAME']
const staleWarehousePermissionIds = []
`,
    )

    expectFinding(checkUx(root), 'overprivileged-warehouse-persona', 'scripts/provision-sandbox-demo.ts')
  })

  it('fails when conformance docs claim human validation prematurely', () => {
    const root = createFixture()
    write(root, 'src/modules/inventory/UX-CONFORMANCE.md', 'Implementation Conformance Complete\nRole-Based UX Validation Preparation Complete\nRepresentative-User Validation Complete\n')

    expectFinding(checkUx(root), 'premature-human-validation-claim', 'src/modules/inventory/UX-CONFORMANCE.md')
  })

  it('fails when controlled demo artifacts or registration lock are missing', () => {
    const root = createFixture()
    rmSync(join(root, 'docs/demo/CONTROLLED-DEMO-RUNBOOK.md'))
    write(root, 'src/app/api/kernel/auth/register/route.ts', `export async function POST() { return registerFoundationAccount(input) }`)

    expectFinding(checkUx(root), 'missing-controlled-demo-artifact', 'docs/demo/CONTROLLED-DEMO-RUNBOOK.md')
    expectFinding(checkUx(root), 'missing-registration-disabled-api', 'src/app/api/kernel/auth/register/route.ts')
  })

  it('fails when controlled Founder review records overclaim or omit no-finding status', () => {
    const root = createFixture()
    write(
      root,
      'docs/demo/reviews/FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md',
      '# Founder Warehouse Proxy UX Review\n\nStatus: Completed\nPublic Demo Approval: Approved\n',
    )

    expectFinding(checkUx(root), 'incomplete-founder-controlled-review-record', 'docs/demo/reviews/FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md')
    expectFinding(checkUx(root), 'premature-controlled-demo-validation-claim', 'docs/demo/reviews/FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md')
  })

  it('fails Prompt 37 regressions for candidate caps and production client-mode growth tables', () => {
    const root = createFixture()
    write(root, 'package.json', JSON.stringify({ dependencies: { '@tanstack/react-table': '8.21.3' } }))
    write(root, 'docs/engineering-manual/prompts/CODEX_PROMPT_37_V2_2_ACCEPTANCE_SCALE_HARDENING.md', 'Prompt 37')
    write(root, 'src/components/onedayos/data-table/data-table-v2.tsx', `import '@tanstack/react-table'\nexport const contract = 'manualPagination onKeyDown localStorage data-data-table-v2'`)
    write(root, 'src/app/[orgSlug]/inventory/_components/inventory-data-tables.tsx', `export function Table() { return <DataTableV2 mode="server">Adjust Stock productId= warehouseId=</DataTableV2> }`)
    write(root, 'src/app/[orgSlug]/records/_components/records-data-table.tsx', `export function Table() { return <DataTableV2 mode="client" /> }`)
    write(root, 'src/app/[orgSlug]/organization/_components/organization-data-tables.tsx', `export function Table() { return <DataTableV2 mode="server" /> }`)
    write(root, 'src/modules/inventory/service.ts', 'const candidateTotal = 100\nconst rows = allRows.slice(0, 25)')
    write(root, 'src/modules/inventory/schema.ts', 'export const query = {}')
    write(root, 'src/app/[orgSlug]/records/_components/shared-record-pages.tsx', 'ProductService.listPage(ctx, query)')
    write(root, 'src/app/[orgSlug]/organization/people/page.tsx', 'OrganizationTableService.listPeople(ctx, query)')
    write(root, 'src/app/[orgSlug]/organization/branches-departments/page.tsx', 'OrganizationTableService.listStructure(ctx, query)')
    for (const path of [
      'src/app/api/orgs/[orgSlug]/inventory/stock-levels/route.ts',
      'src/app/api/orgs/[orgSlug]/inventory/stock-movements/route.ts',
      'src/app/api/orgs/[orgSlug]/inventory/stock-adjustments/route.ts',
    ]) {
      write(root, path, 'return apiSuccess(result.rows, {}, result.meta)')
    }

    expectFinding(checkUx(root), 'growth-table-client-mode', 'src/app/[orgSlug]/records/_components/records-data-table.tsx')
    expectFinding(checkUx(root), 'stock-status-candidate-cap', 'src/modules/inventory/service.ts')
    expectFinding(checkUx(root), 'missing-v2-2-acceptance-report', 'docs/engineering-manual/00-meta/V2-2-ACCEPTANCE-REPORT.md')
  })

  it('allows the exact Radix Dialog dependency after Prompt 38 authorization', () => {
    const root = createFixture()
    write(
      root,
      'package.json',
      JSON.stringify({ dependencies: { '@radix-ui/react-dialog': '1.1.21', '@tanstack/react-table': '8.21.3' } }),
    )
    write(root, 'docs/engineering-manual/prompts/CODEX_PROMPT_38_V2_3_URL_ADDRESSABLE_MODALS.md', 'Founder-approved V2-3')
    write(root, 'src/components/onedayos/data-table/data-table-v2.tsx', `import '@tanstack/react-table'\nexport const contract = 'manualPagination onKeyDown localStorage data-data-table-v2'`)
    write(root, 'src/app/[orgSlug]/inventory/_components/inventory-data-tables.tsx', `export function Table() { return <DataTableV2 mode="server">Adjust Stock productId= warehouseId=</DataTableV2> }`)
    write(root, 'src/app/[orgSlug]/records/_components/records-data-table.tsx', `export function Table() { return <DataTableV2 mode="server" /> }`)
    write(root, 'src/app/[orgSlug]/organization/_components/organization-data-tables.tsx', `export function Table() { return <DataTableV2 mode="server" /> }`)

    expect(checkUx(root).filter((finding) => finding.rule === 'premature-v2-dependency')).toEqual([])
  })

  it('fails unsafe controlled demo reset scope', () => {
    const root = createFixture()
    write(
      root,
      'scripts/reset-sandbox-demo.ts',
      `const orgSlug = process.argv.slice(2)[0]
await tx.organization.delete({ where: { slug: orgSlug } })
`,
    )

    expectFinding(checkUx(root), 'unsafe-demo-reset-scope', 'scripts/reset-sandbox-demo.ts')
  })
})
