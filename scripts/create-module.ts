import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

export const MODULE_ID_REGEX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

const RESERVED_MODULE_IDS = new Set([
  'kernel',
  'objects',
  'settings',
  'admin',
  'api',
  'auth',
  'sdk',
  'platform',
  'components',
  'modules',
  'users',
  'organizations',
])

type GenerateOptions = {
  dryRun?: boolean
  outputRoot?: string
}

type ParsedArgs = GenerateOptions & {
  moduleId: string
}

export type GeneratedFile = {
  path: string
  content: string
}

type ModuleNames = {
  id: string
  pascal: string
  camel: string
  title: string
  constant: string
  resource: string
}

class GeneratorError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'GeneratorError'
  }
}

function titlePart(part: string): string {
  return part.charAt(0).toUpperCase() + part.slice(1)
}

export function deriveModuleNames(moduleId: string): ModuleNames {
  const parts = moduleId.split('-')
  const pascal = parts.map(titlePart).join('')
  const title = parts.map(titlePart).join(' ')

  return {
    id: moduleId,
    pascal,
    camel: pascal.charAt(0).toLowerCase() + pascal.slice(1),
    title,
    constant: parts.map((part) => part.toUpperCase()).join('_'),
    resource: parts.join('_'),
  }
}

export function validateModuleId(moduleId: string): void {
  if (!MODULE_ID_REGEX.test(moduleId)) {
    throw new GeneratorError(
      'Module id must be lowercase kebab-case and start with a letter, for example visitor-management.',
    )
  }

  if (RESERVED_MODULE_IDS.has(moduleId)) {
    throw new GeneratorError(`Module id "${moduleId}" is reserved by the platform.`)
  }
}

function file(path: string, content: string): GeneratedFile {
  return { path, content: `${content.trim()}\n` }
}

function moduleFiles(names: ModuleNames): GeneratedFile[] {
  return [
    file(
      `src/modules/${names.id}/permissions.ts`,
      `
import type { ModulePermissionDefinition } from '@/sdk'

export const ${names.constant}_PERMISSIONS = {
  READ: {
    module: '${names.id}',
    resource: '${names.resource}_record',
    action: 'read',
    label: 'Read ${names.title} records',
    description: 'Allows the user to view ${names.title} records inside the verified organization.',
  },
  CREATE: {
    module: '${names.id}',
    resource: '${names.resource}_record',
    action: 'create',
    label: 'Create ${names.title} records',
    description: 'Allows the user to create ${names.title} records inside the verified organization.',
  },
} as const satisfies Record<string, ModulePermissionDefinition>
`,
    ),
    file(
      `src/modules/${names.id}/schema.ts`,
      `
import { z } from 'zod'

export const ${names.camel}ListQuerySchema = z.strictObject({
  q: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
})

export const create${names.pascal}RecordSchema = z.strictObject({
  name: z.string().trim().min(1).max(120),
})

export const update${names.pascal}RecordSchema = z.strictObject({
  name: z.string().trim().min(1).max(120).optional(),
})

export type ${names.pascal}ListQuery = z.infer<typeof ${names.camel}ListQuerySchema>
export type Create${names.pascal}RecordInput = z.infer<typeof create${names.pascal}RecordSchema>
export type Update${names.pascal}RecordInput = z.infer<typeof update${names.pascal}RecordSchema>
`,
    ),
    file(
      `src/modules/${names.id}/types.ts`,
      `
import type { ModuleCompatibility } from '@/sdk'

export const ${names.constant}_MODULE_COMPATIBILITY = {
  platform: { min: '0.1.0', max: null },
  sdk: { min: '0.1.0', max: null },
  manifest: { min: '1.0.0', max: null },
} as const satisfies ModuleCompatibility

export type ${names.pascal}Record = {
  id: string
  name: string
}
`,
    ),
    file(
      `src/modules/${names.id}/events.ts`,
      `
import { z } from 'zod'
import type { ModuleEventContract } from '@/sdk'

export const ${names.camel}Events = {
  recordCreated: {
    name: '${names.id}.${names.resource}_record.created',
    description: '${names.title} record was created.',
  },
  manifest: {
    emits: [
      {
        name: '${names.id}.${names.resource}_record.created',
        description: '${names.title} record was created.',
      },
    ],
    listens: [],
  },
} as const

export const ${names.camel}RecordCreatedPayloadSchema = z.strictObject({
  recordId: z.string().min(1),
  name: z.string().min(1),
})

export const ${names.camel}EventPayloadSchemas = {
  [${names.camel}Events.recordCreated.name]: ${names.camel}RecordCreatedPayloadSchema,
} as const

export const ${names.camel}EventManifest = ${names.camel}Events.manifest satisfies ModuleEventContract
`,
    ),
    file(
      `src/modules/${names.id}/settings.ts`,
      `
import type { ModuleSettingDefinition } from '@/sdk'

export const ${names.camel}Settings = [] satisfies ModuleSettingDefinition[]
`,
    ),
    file(
      `src/modules/${names.id}/navigation.ts`,
      `
import type { ModuleNavigationItem } from '@/sdk'
import { ${names.constant}_PERMISSIONS } from './permissions'

export const ${names.camel}Navigation = [
  {
    key: '${names.id}.home',
    label: 'Dashboard',
    href: '/${names.id}',
    icon: 'Box',
    requiredPermission: ${names.constant}_PERMISSIONS.READ,
  },
  {
    key: '${names.id}.process-flow',
    label: 'Process Flow',
    href: '/${names.id}/process-flow',
    icon: 'Workflow',
    requiredPermission: ${names.constant}_PERMISSIONS.READ,
  },
] satisfies ModuleNavigationItem[]
`,
    ),
    file(
      `src/modules/${names.id}/ai-context.ts`,
      `
import type { ModuleAiContext } from '@/sdk'

export const ${names.camel}AiContext = {
  description: '${names.title} module. Draft module generated by OneDayOS.',
  businessPurpose: 'To be completed in the module specification.',
  commonQuestions: [],
  supportedActions: [],
  forbiddenActions: [
    'Do not access records outside the verified organization.',
    'Do not perform destructive actions without explicit user confirmation.',
  ],
} satisfies ModuleAiContext
`,
    ),
    file(
      `src/modules/${names.id}/ux.ts`,
      `
import type { ModuleUxContract } from '@/sdk'

export const ${names.camel}UxContract = {
  primaryUsers: [
    'TODO(UX): Define the primary users from the approved module specification.',
  ],
  userGoals: [
    'TODO(UX): Define the user goals this module must support.',
  ],
  primaryTasks: [
    'TODO(UX): Define the critical tasks users must be able to complete.',
  ],
  taskFrequency: [
    'TODO(UX): Define how often each critical task is performed.',
  ],
  workEnvironment: [
    'TODO(UX): Describe the real work environment, device context, and pace.',
  ],
  requiredKnowledge: [
    'TODO(UX): Identify what users must understand before using this module.',
  ],
  relatedBusinessObjects: [
    'TODO(UX): Name shared Business Objects this module uses, or explain why none apply.',
  ],
  moduleOwnedRecords: [
    'TODO(UX): Name module-owned records from the approved module specification.',
  ],
  criticalErrorsToPrevent: [
    'TODO(UX): List expensive mistakes the UI and service layer must prevent.',
  ],
  permissionRoles: [
    'TODO(UX): Map module permissions to real user roles.',
  ],
  appNavigation: [
    '${names.title} Dashboard',
    'Process Flow',
    'TODO(UX): Add approved workflow pages only after the module specification names them.',
  ],
  pageMap: [
    '/${names.id} - TODO(UX): Define the module landing-page purpose.',
    '/${names.id}/process-flow - Draft Process Flow page for human review.',
  ],
  defaultLandingPage: '/${names.id}',
  processFlowRoute: '/${names.id}/process-flow',
  keyboardWorkflows: [
    'TODO(UX): Define keyboard paths for critical workflows.',
  ],
  accessibilityRequirements: [
    'TODO(UX): Define module-specific accessibility requirements beyond the OneDayOS baseline.',
  ],
  usabilityTestScenarios: [
    'TODO(UX): Define representative-user walkthroughs and failure-path scenarios.',
  ],
  knownMvpLimitations: [
    'TODO(UX): List MVP boundaries clearly so the scaffold does not imply completed behavior.',
  ],
  futureIntegrations: [
    'TODO(UX): List deferred integrations without implying they exist today.',
  ],
} as const satisfies ModuleUxContract
`,
    ),
    file(
      `src/modules/${names.id}/process-flow.ts`,
      `
import type { ProcessFlowDefinition } from '@/sdk'

export const ${names.camel}ProcessFlow = {
  title: '${names.title} Process Flow',
  description:
    'TODO(UX): Replace this draft Process Flow with the approved ${names.title} business workflow before implementation.',
  steps: [
    {
      id: 'draft-workflow-step',
      number: 1,
      title: 'TODO(UX): Define approved workflow step',
      description:
        'TODO(UX): Replace this draft step with the approved business workflow before implementation.',
      inputs: [
        'TODO(UX): Identify the user and data inputs required for this step.',
      ],
      outputs: [
        'TODO(UX): Identify the records, states, or decisions produced by this step.',
      ],
      warning:
        'TODO(UX): Identify the critical mistake this step must prevent, or remove this warning with review evidence.',
    },
  ],
  owns: [
    'TODO(UX): List module-owned records from the approved module specification.',
  ],
  doesNotOwn: [
    'TODO(UX): List shared Business Objects this module must not duplicate.',
  ],
  currentBoundaries: [
    'TODO(UX): State what this MVP intentionally does not automate or integrate.',
  ],
  futureIntegrations: [
    'TODO(UX): Name future integrations only after they are approved as deferred scope.',
  ],
} as const satisfies ProcessFlowDefinition
`,
    ),
    file(
      `src/modules/${names.id}/UX-CONFORMANCE.md`,
      `
# ${names.title} UX Conformance

## Status
Not Reviewed

## Standards Targeted
- Aligned with ISO 9241-210
- Aligned with ISO 9241-110
- Reviewed using Nielsen's usability heuristics
- Targets WCAG 2.2 Level AA

## Primary Users Represented
TODO(UX): Add reviewed representative users.

## Critical Tasks Tested
TODO(UX): Add reviewed critical tasks.

## Reviewers
TODO(UX): Add human reviewers and dates.

## Automated Structural Checks
TODO(UX): Record generator and architecture checks.

## Automated Accessibility Checks
TODO(UX): Record approved accessibility tooling results when tooling exists.

## Manual Accessibility Review
TODO(UX): Record keyboard, focus, label, and contrast review evidence.

## Representative-User Walkthroughs
TODO(UX): Record Founder and representative-user walkthroughs.

## Findings
TODO(UX): Record findings with severity.

## Resolutions
TODO(UX): Record fixes or Founder-approved deferrals.

## Deferred Issues
TODO(UX): Record deferred issues and rationale.

## Approval Result
Not Approved
`,
    ),
    file(
      `src/modules/${names.id}/manifest.ts`,
      `
import { defineModuleManifest } from '@/sdk'
import { ${names.camel}AiContext } from './ai-context'
import { ${names.camel}EventManifest } from './events'
import { ${names.camel}Navigation } from './navigation'
import { ${names.constant}_PERMISSIONS } from './permissions'
import { ${names.camel}Settings } from './settings'
import { ${names.constant}_MODULE_COMPATIBILITY } from './types'

export const ${names.camel}Manifest = defineModuleManifest({
  schemaVersion: '1',
  id: '${names.id}',
  label: '${names.title}',
  description: '${names.title} module scaffold. Complete the module specification before adding business behavior.',
  version: '0.1.0',
  lifecycle: 'draft',
  compatibility: ${names.constant}_MODULE_COMPATIBILITY,
  icon: 'Box',
  dependencies: [],
  businessObjectsUsed: [],
  ownedEntities: [],
  permissions: Object.values(${names.constant}_PERMISSIONS),
  navItems: ${names.camel}Navigation,
  routes: [
    {
      kind: 'page',
      path: '/${names.id}',
      label: '${names.title}',
      requiredPermission: ${names.constant}_PERMISSIONS.READ,
    },
    {
      kind: 'page',
      path: '/${names.id}/process-flow',
      label: 'Process Flow',
      requiredPermission: ${names.constant}_PERMISSIONS.READ,
    },
  ],
  apis: [
    {
      method: 'GET',
      path: '/api/orgs/[orgSlug]/${names.id}',
      requiredPermission: ${names.constant}_PERMISSIONS.READ,
    },
    {
      method: 'POST',
      path: '/api/orgs/[orgSlug]/${names.id}',
      requiredPermission: ${names.constant}_PERMISSIONS.CREATE,
    },
  ],
  events: ${names.camel}EventManifest,
  settings: ${names.camel}Settings,
  aiContext: ${names.camel}AiContext,
  docs: {
    readme: 'src/modules/${names.id}/README.md',
    manual: 'src/modules/${names.id}/docs.md',
  },
})
`,
    ),
    file(
      `src/modules/${names.id}/service.ts`,
      `
import { sdk } from '@/sdk/server'
import type { PlatformContext } from '@/sdk'
import { ${names.constant}_PERMISSIONS } from './permissions'
import type { Create${names.pascal}RecordInput, ${names.pascal}ListQuery } from './schema'
import type { ${names.pascal}Record } from './types'

export class ${names.pascal}Service {
  static async list(ctx: PlatformContext, _query: ${names.pascal}ListQuery): Promise<${names.pascal}Record[]> {
    await sdk.permissions.require(ctx, ${names.constant}_PERMISSIONS.READ)
    const db = sdk.getDb(ctx)
    void db

    return []
  }

  static async create(ctx: PlatformContext, input: Create${names.pascal}RecordInput): Promise<${names.pascal}Record> {
    await sdk.permissions.require(ctx, ${names.constant}_PERMISSIONS.CREATE)
    const db = sdk.getDb(ctx)
    void db
    void input

    throw new Error('${names.title} create is not implemented until durable module storage is specified.')
  }
}
`,
    ),
    file(
      `src/modules/${names.id}/index.ts`,
      `
export { ${names.camel}Manifest } from './manifest'
export { ${names.constant}_PERMISSIONS } from './permissions'
export { ${names.camel}Events } from './events'
export { ${names.camel}ProcessFlow } from './process-flow'
export { ${names.camel}UxContract } from './ux'
export type * from './types'
`,
    ),
    file(
      `src/modules/${names.id}/docs.md`,
      `
# ${names.title}

This generated module is a secure scaffold only.

Complete the module specification before adding business fields, module-owned models, or workflow behavior.

Complete \`ux.ts\`, \`process-flow.ts\`, and \`UX-CONFORMANCE.md\` before implementation begins. Generated
\`TODO(UX)\` placeholders are draft review markers, not approved product behavior.

Reference shared Business Objects such as Product, Customer, Supplier, Employee, and Warehouse through approved
Business Object APIs/services. Do not recreate their identity inside this module. Module-specific fields require
an approved extension table in a later package.
`,
    ),
    file(
      `src/modules/${names.id}/README.md`,
      `
# ${names.title}

Generated by OneDayOS module:create.

This scaffold intentionally contains no business objects, no module-owned Prisma models, and no production workflow logic yet.

The generated UX contract and Process Flow are intentionally marked with \`TODO(UX)\` placeholders. They must be
resolved through module specification and human UX review before the module is implemented or called demo-ready.

When this module later needs Product, Customer, Supplier, Employee, or Warehouse data, reference the shared
Business Objects layer. Do not create duplicate module-specific identities for shared objects.
`,
    ),
  ]
}

function pageFiles(names: ModuleNames): GeneratedFile[] {
  return [
    file(
      `src/app/[orgSlug]/${names.id}/page.tsx`,
      `
import { sdk } from '@/sdk/server'
import { DashboardPage, TrueEmptyState } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { ${names.constant}_PERMISSIONS } from '@/modules/${names.id}/permissions'

export default async function ${names.pascal}Page({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, '${names.id}')
  await sdk.permissions.require(ctx, ${names.constant}_PERMISSIONS.READ)

  return (
    <DashboardPage
      breadcrumb="${names.title} / Dashboard"
      title="${names.title}"
      description="Generated module dashboard scaffold. Replace this draft state only after the module UX contract and business behavior are approved."
      primaryAction={<LinkButton href={\`/\${orgSlug}/${names.id}/process-flow\`}>Open Process Flow</LinkButton>}
      primaryContent={
        <TrueEmptyState
          title="${names.title} dashboard is waiting for approved module data"
          description="The generator does not create invented metrics, charts, records, or workflow claims. Define real module-owned records and user tasks before adding dashboard content."
          action={<LinkButton href={\`/\${orgSlug}/${names.id}/process-flow\`} variant="secondary">Review Process Flow</LinkButton>}
        />
      }
    />
  )
}
`,
    ),
    file(
      `src/app/[orgSlug]/${names.id}/process-flow/page.tsx`,
      `
import { sdk } from '@/sdk/server'
import { ProcessFlowPage } from '@/components/onedayos'
import { ${names.constant}_PERMISSIONS } from '@/modules/${names.id}/permissions'
import { ${names.camel}ProcessFlow } from '@/modules/${names.id}/process-flow'

export default async function ${names.pascal}ProcessFlowPage({
  params,
}: {
  params: Promise<{ orgSlug: string }>
}) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageModuleContext(orgSlug, '${names.id}')
  await sdk.permissions.require(ctx, ${names.constant}_PERMISSIONS.READ)

  return (
    <ProcessFlowPage
      breadcrumb="${names.title} / Process Flow"
      definition={${names.camel}ProcessFlow}
    />
  )
}
`,
    ),
    file(
      `src/app/[orgSlug]/${names.id}/process-flow/loading.tsx`,
      `
import { ProcessFlowLoadingState } from '@/components/onedayos'

export default function ${names.pascal}ProcessFlowLoading() {
  return <ProcessFlowLoadingState />
}
`,
    ),
    file(
      `src/app/[orgSlug]/${names.id}/loading.tsx`,
      `
import { DashboardPageLoadingState } from '@/components/onedayos'

export default function ${names.pascal}Loading() {
  return <DashboardPageLoadingState />
}
`,
    ),
    file(
      `src/app/[orgSlug]/${names.id}/error.tsx`,
      `
'use client'

import { SafePageErrorState } from '@/components/onedayos'

export default function ${names.pascal}Error() {
  return <SafePageErrorState title="Unable to load ${names.title}" />
}
`,
    ),
    file(
      `src/app/[orgSlug]/${names.id}/not-found.tsx`,
      `
import { ModuleUnavailableState } from '@/components/onedayos'

export default function ${names.pascal}NotFound() {
  return <ModuleUnavailableState moduleName="${names.title}" />
}
`,
    ),
    file(
      `src/app/[orgSlug]/${names.id}/_components/${names.pascal}EmptyState.tsx`,
      `
import { EmptyState } from '@/components/onedayos'

export function ${names.pascal}EmptyState() {
  return (
    <EmptyState
      title="No ${names.title} records yet"
      description="This module scaffold is waiting for an approved module specification."
    />
  )
}
`,
    ),
    file(
      `src/app/[orgSlug]/${names.id}/_components/${names.pascal}ListClient.tsx`,
      `
'use client'

import { DataTable, ListPage } from '@/components/onedayos'
import type { ${names.pascal}Record } from '@/modules/${names.id}/types'
import { ${names.pascal}EmptyState } from './${names.pascal}EmptyState'

export function ${names.pascal}ListClient({
  initialRecords,
}: {
  initialRecords: ${names.pascal}Record[]
  orgSlug: string
}) {
  return (
    <ListPage
      breadcrumb="${names.title} / Draft List"
        title="${names.title}"
      description="Draft list scaffold. Replace with a real task-focused list page after the UX contract is approved."
    >
      <DataTable
        columns={[
          { id: 'name', header: 'Name', cell: (row) => row.name },
        ]}
        rows={initialRecords}
        getRowId={(row) => row.id}
        emptyState={<${names.pascal}EmptyState />}
      />
    </ListPage>
  )
}
`,
    ),
  ]
}

function apiFiles(names: ModuleNames): GeneratedFile[] {
  return [
    file(
      `src/app/api/orgs/[orgSlug]/${names.id}/route.ts`,
      `
import type { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { ${names.pascal}Service } from '@/modules/${names.id}/service'
import { ${names.constant}_PERMISSIONS } from '@/modules/${names.id}/permissions'
import { create${names.pascal}RecordSchema, ${names.camel}ListQuerySchema } from '@/modules/${names.id}/schema'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, '${names.id}', requestId)
    await sdk.permissions.require(ctx, ${names.constant}_PERMISSIONS.READ)
    const query = sdk.api.parseSearchParams(handledRequest.nextUrl.searchParams, ${names.camel}ListQuerySchema)
    const data = await ${names.pascal}Service.list(ctx, query)
    return sdk.api.ok(data)
  })(request)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, '${names.id}', requestId)
    await sdk.permissions.require(ctx, ${names.constant}_PERMISSIONS.CREATE)
    const input = await sdk.api.parseJsonBody(handledRequest, create${names.pascal}RecordSchema)
    const data = await ${names.pascal}Service.create(ctx, input)
    return sdk.api.created(data)
  })(request)
}
`,
    ),
  ]
}

function testFiles(names: ModuleNames): GeneratedFile[] {
  return [
    file(
      `src/modules/${names.id}/__tests__/manifest.test.ts`,
      `
import { describe, expect, it } from 'vitest'
import { ${names.camel}Manifest } from '../manifest'

describe('${names.id} manifest', () => {
  it('is pure metadata with full permission objects', () => {
    expect(${names.camel}Manifest.id).toBe('${names.id}')
    expect(${names.camel}Manifest.permissions).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          module: '${names.id}',
          resource: expect.any(String),
          action: expect.any(String),
          label: expect.any(String),
          description: expect.any(String),
        }),
      ]),
    )
  })

  it('declares no wildcard permissions and uses tenant-scoped APIs', () => {
    for (const permission of ${names.camel}Manifest.permissions) {
      expect(permission.module).not.toBe('*')
      expect(permission.resource).not.toBe('*')
      expect(permission.action).not.toBe('*')
    }

    for (const api of ${names.camel}Manifest.apis) {
      expect(api.path).toMatch(/^\\/api\\/orgs\\/\\[orgSlug\\]\\/${names.id}/)
    }

    expect(${names.camel}Manifest.routes).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ path: '/${names.id}' }),
        expect.objectContaining({ path: '/${names.id}/process-flow', label: 'Process Flow' }),
      ]),
    )
    expect(${names.camel}Manifest.navItems.map((item) => item.label)).toEqual(['Dashboard', 'Process Flow'])
  })

  it('does not claim Business Objects or module-owned entities before specification approval', () => {
    expect(${names.camel}Manifest.businessObjectsUsed).toEqual([])
    expect(${names.camel}Manifest.ownedEntities).toEqual([])
  })
})
`,
    ),
    file(
      `src/modules/${names.id}/__tests__/permissions.test.ts`,
      `
import { describe, expect, it } from 'vitest'
import { ${names.constant}_PERMISSIONS } from '../permissions'

describe('${names.id} permissions', () => {
  it('uses full module permission objects', () => {
    expect(${names.constant}_PERMISSIONS.READ).toMatchObject({
      module: '${names.id}',
      resource: '${names.resource}_record',
      action: 'read',
    })
  })
})
`,
    ),
    file(
      `src/modules/${names.id}/__tests__/schema.test.ts`,
      `
import { describe, expect, it } from 'vitest'
import { create${names.pascal}RecordSchema, update${names.pascal}RecordSchema } from '../schema'

describe('${names.id} schemas', () => {
  it('rejects unknown tenant identity keys', () => {
    const tenantKey = 'org' + 'Id'
    const createResult = create${names.pascal}RecordSchema.safeParse({
      name: 'Record',
      [tenantKey]: 'wrong-tenant',
    })
    const updateResult = update${names.pascal}RecordSchema.safeParse({
      name: 'Record',
      [tenantKey]: 'wrong-tenant',
    })

    expect(createResult.success).toBe(false)
    expect(updateResult.success).toBe(false)
  })
})
`,
    ),
    file(
      `src/modules/${names.id}/__tests__/events.test.ts`,
      `
import { describe, expect, it } from 'vitest'
import { ${names.camel}Events, ${names.camel}RecordCreatedPayloadSchema } from '../events'

describe('${names.id} events', () => {
  it('uses module-owned event names and safe payloads', () => {
    expect(${names.camel}Events.recordCreated.name).toBe('${names.id}.${names.resource}_record.created')
    expect(${names.camel}RecordCreatedPayloadSchema.parse({ recordId: 'rec_1', name: 'Record' })).toEqual({
      recordId: 'rec_1',
      name: 'Record',
    })
  })
})
`,
    ),
    file(
      `src/modules/${names.id}/__tests__/service.test.ts`,
      `
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('${names.id} service contract', () => {
  it('requires PlatformContext, SDK database access, permission checks, and no fake scaffold event emission', () => {
    const source = readFileSync(join(process.cwd(), 'src/modules/${names.id}/service.ts'), 'utf8')

    expect(source).toContain('ctx: PlatformContext')
    expect(source).toContain('sdk.getDb(ctx)')
    expect(source).toContain('sdk.permissions.require(ctx')
    expect(source.indexOf('sdk.permissions.require(ctx')).toBeLessThan(source.indexOf('sdk.getDb(ctx)'))
    expect(source).toContain('not implemented until durable module storage is specified')
    expect(source).not.toContain('sdk.events.emit(ctx')
  })

  it('does not duplicate shared Business Objects or module-owned Prisma models', () => {
    const source = readFileSync(join(process.cwd(), 'src/modules/${names.id}/service.ts'), 'utf8')
    const forbiddenBusinessObjects = ['Employee', 'Product', 'ProductCategory', 'Customer', 'Supplier', 'Warehouse']

    for (const name of forbiddenBusinessObjects) {
      expect(source).not.toContain(name)
    }
  })
})
`,
    ),
    file(
      `src/modules/${names.id}/__tests__/architecture.test.ts`,
      `
import { readFileSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

function readModuleFiles(dir: string): string {
  return readdirSync(dir)
    .flatMap((entry) => {
      const absolute = join(dir, entry)
      if (statSync(absolute).isDirectory()) {
        return entry === '__tests__' ? [] : readModuleFiles(absolute)
      }
      return absolute.endsWith('.ts') || absolute.endsWith('.tsx') ? readFileSync(absolute, 'utf8') : ''
    })
    .join('\\n')
}

describe('${names.id} generated architecture', () => {
  it('does not contain rejected module patterns', () => {
    const tenantKey = 'org' + 'Id'
    const source = readModuleFiles(join(process.cwd(), 'src/modules/${names.id}'))
    const forbidden = [
      'sdk.getDb(' + tenantKey + ')',
      'getDb(' + tenantKey + ')',
      'body.' + tenantKey,
      'input.' + tenantKey,
      "searchParams.get('" + tenantKey + "')",
      '/api/' + '[module]',
      '/api/' + 'inventory',
      '@/' + 'modules/other',
      'framer' + '-motion',
      'Fast' + 'API',
      "from '@/" + 'kernel/',
      "from '@prisma/" + "client'",
    ]

    for (const pattern of forbidden) {
      expect(source).not.toContain(pattern)
    }
  })
})
`,
    ),
    file(
      `src/modules/${names.id}/__tests__/ux.test.ts`,
      `
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ${names.camel}UxContract } from '../ux'

const requiredUxFields = [
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

describe('${names.id} UX contract', () => {
  it('exports every required UX contract field', () => {
    for (const field of requiredUxFields) {
      expect(${names.camel}UxContract).toHaveProperty(field)
    }
  })

  it('points landing and Process Flow routes inside the module', () => {
    expect(${names.camel}UxContract.defaultLandingPage).toBe('/${names.id}')
    expect(${names.camel}UxContract.processFlowRoute).toBe('/${names.id}/process-flow')
  })

  it('keeps related Business Objects separate from module-owned records', () => {
    expect(Array.isArray(${names.camel}UxContract.relatedBusinessObjects)).toBe(true)
    expect(Array.isArray(${names.camel}UxContract.moduleOwnedRecords)).toBe(true)
    expect(${names.camel}UxContract.relatedBusinessObjects).not.toBe(${names.camel}UxContract.moduleOwnedRecords)
  })

  it('contains no tenant identity or server-only imports', () => {
    const source = readFileSync(join(process.cwd(), 'src/modules/${names.id}/ux.ts'), 'utf8')
    const tenantKey = 'org' + 'Id'

    expect(source).toContain('satisfies ModuleUxContract')
    expect(source).not.toContain(tenantKey)
    expect(source).not.toContain('@/sdk/server')
    expect(source).not.toContain('@/kernel/')
    expect(source).not.toContain('@prisma/client')
  })

  it('marks unresolved draft UX values with TODO(UX) and does not claim approval', () => {
    const serialized = JSON.stringify(${names.camel}UxContract)

    expect(serialized).toContain('TODO(UX)')
    expect(serialized).not.toContain('Approved')
  })
})
`,
    ),
    file(
      `src/modules/${names.id}/__tests__/process-flow.test.ts`,
      `
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { ${names.camel}ProcessFlow } from '../process-flow'

describe('${names.id} Process Flow contract', () => {
  it('exports the required Process Flow definition fields', () => {
    expect(${names.camel}ProcessFlow.title).toContain('${names.title}')
    expect(${names.camel}ProcessFlow.description).toContain('TODO(UX)')
    expect(Array.isArray(${names.camel}ProcessFlow.steps)).toBe(true)
    expect(Array.isArray(${names.camel}ProcessFlow.owns)).toBe(true)
    expect(Array.isArray(${names.camel}ProcessFlow.doesNotOwn)).toBe(true)
  })

  it('uses stable step IDs and draft placeholders', () => {
    for (const step of ${names.camel}ProcessFlow.steps) {
      expect(step.id).toMatch(/^[a-z][a-z0-9-]*$/)
      expect(step.title + step.description).toContain('TODO(UX)')
    }
  })

  it('contains no tenant identity, server imports, API calls, or Prisma imports', () => {
    const source = readFileSync(join(process.cwd(), 'src/modules/${names.id}/process-flow.ts'), 'utf8')
    const tenantKey = 'org' + 'Id'

    expect(source).toContain('satisfies ProcessFlowDefinition')
    expect(source).not.toContain(tenantKey)
    expect(source).not.toContain('@/sdk/server')
    expect(source).not.toContain('@/kernel/')
    expect(source).not.toContain('@prisma/client')
    expect(source).not.toContain('fetch(')
  })

  it('renders through the shared ProcessFlowPage route and contextual loading helper', () => {
    const pageSource = readFileSync(join(process.cwd(), 'src/app/[orgSlug]/${names.id}/process-flow/page.tsx'), 'utf8')
    const loadingSource = readFileSync(join(process.cwd(), 'src/app/[orgSlug]/${names.id}/process-flow/loading.tsx'), 'utf8')

    expect(pageSource).toContain('ProcessFlowPage')
    expect(pageSource).toContain('${names.camel}ProcessFlow')
    expect(loadingSource).toContain('ProcessFlowLoadingState')
    expect(loadingSource).not.toContain('Loading...')
  })
})
`,
    ),
    file(
      `src/app/api/orgs/[orgSlug]/${names.id}/__tests__/route.test.ts`,
      `
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('${names.id} API route contract', () => {
  it('uses tenant-safe module route shape and API-safe JSON helpers', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/api/orgs/[orgSlug]/${names.id}/route.ts'), 'utf8')

    expect(source).toContain('sdk.api.handle')
    expect(source).toContain("requireApiModuleContext(handledRequest, orgSlug, '${names.id}'")
    expect(source).toContain('sdk.api.parseSearchParams')
    expect(source).toContain('sdk.api.parseJsonBody')
    expect(source).toContain('sdk.api.ok')
    expect(source).toContain('sdk.api.created')
    expect(source).not.toContain("redirect('/login')")
    expect(source).not.toContain('next/navigation')
    expect(source).not.toContain('Object.fromEntries(handledRequest.nextUrl.' + 'searchParams)')
  })

  it('checks module context and permissions before service calls for JSON 401, 403, and safe module unavailable paths', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/api/orgs/[orgSlug]/${names.id}/route.ts'), 'utf8')
    const contextIndex = source.indexOf('requireApiModuleContext')
    const permissionIndex = source.indexOf('sdk.permissions.require')
    const serviceIndex = source.indexOf('${names.pascal}Service.list')

    expect(contextIndex).toBeGreaterThan(-1)
    expect(permissionIndex).toBeGreaterThan(contextIndex)
    expect(serviceIndex).toBeGreaterThan(permissionIndex)
  })

  it('rejects client-supplied tenant identity through the strict SDK body parser', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/api/orgs/[orgSlug]/${names.id}/route.ts'), 'utf8')

    expect(source).toContain('sdk.api.parseJsonBody(handledRequest, create${names.pascal}RecordSchema)')
  })
})
`,
    ),
    file(
      `src/app/[orgSlug]/${names.id}/__tests__/page.test.tsx`,
      `
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('${names.id} page contract', () => {
  it('keeps the page server-owned and client component UI-only', () => {
    const pageSource = readFileSync(join(process.cwd(), 'src/app/[orgSlug]/${names.id}/page.tsx'), 'utf8')
    const clientSource = readFileSync(
      join(process.cwd(), 'src/app/[orgSlug]/${names.id}/_components/${names.pascal}ListClient.tsx'),
      'utf8',
    )

    expect(pageSource).toContain("requirePageModuleContext")
    expect(pageSource).toContain('DashboardPage')
    expect(pageSource).toContain('TrueEmptyState')
    expect(pageSource).toContain('/${names.id}/process-flow')
    expect(clientSource).toContain("'use client'")
    expect(clientSource).toContain('ListPage')
    expect(clientSource).toContain('DataTable')
    expect(clientSource).not.toContain("@/" + "sdk/server")
    expect(clientSource).not.toContain("@/" + "kernel/")
    expect(pageSource).not.toContain('DashboardMetric')
    expect(pageSource).not.toContain('Loading...')
  })
})
`,
    ),
  ]
}

export function renderModuleIndex(moduleIds: string[]): string {
  const ids = [...new Set(moduleIds)].sort()
  const imports = ids
    .map((moduleId) => {
      const names = deriveModuleNames(moduleId)
      return `import { ${names.camel}Manifest } from './${moduleId}/manifest'`
    })
    .join('\n')
  const entries = ids.map((moduleId) => `  ${deriveModuleNames(moduleId).camel}Manifest,`).join('\n')

  return `${imports ? `${imports}\n` : ''}import type { ModuleManifest } from '@/sdk'

// Module manifest imports are maintained by scripts/create-module.ts.
export const moduleManifests = [
${entries}
] as const satisfies readonly ModuleManifest[]
`
}

function readExistingModuleIds(indexPath: string): string[] {
  if (!existsSync(indexPath)) {
    return []
  }

  const content = readFileSync(indexPath, 'utf8')
  const matches = [...content.matchAll(/from\s+['"]\.\/([a-z][a-z0-9-]*)\/manifest['"]/g)]
  return matches.map((match) => match[1])
}

function generateFiles(moduleId: string, outputRoot: string): GeneratedFile[] {
  validateModuleId(moduleId)
  const names = deriveModuleNames(moduleId)
  const existingModuleIds = readExistingModuleIds(resolve(outputRoot, 'src/modules/index.ts'))

  return [
    ...moduleFiles(names),
    ...pageFiles(names),
    ...apiFiles(names),
    ...testFiles(names),
    file('src/modules/index.ts', renderModuleIndex([...existingModuleIds, moduleId])),
  ]
}

export function generateModuleFiles(moduleId: string, options: GenerateOptions = {}): GeneratedFile[] {
  const outputRoot = resolve(options.outputRoot ?? process.cwd())
  return generateFiles(moduleId, outputRoot)
}

function ensureWritable(outputRoot: string, files: GeneratedFile[]) {
  for (const generatedFile of files) {
    const absolute = resolve(outputRoot, generatedFile.path)
    const isModuleIndex = generatedFile.path === 'src/modules/index.ts'

    if (existsSync(absolute) && !isModuleIndex) {
      throw new GeneratorError(`Refusing to overwrite existing file: ${generatedFile.path}`)
    }
  }
}

function writeFiles(outputRoot: string, files: GeneratedFile[]) {
  for (const generatedFile of files) {
    const absolute = resolve(outputRoot, generatedFile.path)
    mkdirSync(dirname(absolute), { recursive: true })
    writeFileSync(absolute, generatedFile.content)
  }
}

function parseArgs(args: string[]): ParsedArgs {
  const parsed: GenerateOptions & { moduleId?: string } = {}

  for (let index = 0; index < args.length; index += 1) {
    const arg = args[index]

    if (arg === '--dry-run') {
      parsed.dryRun = true
      continue
    }

    if (arg === '--output') {
      const output = args[index + 1]
      if (!output) {
        throw new GeneratorError('--output requires a path.')
      }
      parsed.outputRoot = output
      index += 1
      continue
    }

    if (arg.startsWith('--')) {
      throw new GeneratorError(`Unknown option: ${arg}`)
    }

    if (parsed.moduleId) {
      throw new GeneratorError('Only one module id may be provided.')
    }

    parsed.moduleId = arg
  }

  if (!parsed.moduleId) {
    throw new GeneratorError('Usage: npm run module:create -- <module-id> [-- --dry-run] [-- --output <path>]')
  }

  return parsed as ParsedArgs
}

export function runCreateModule(args: string[]) {
  const parsed = parseArgs(args)
  const outputRoot = resolve(parsed.outputRoot ?? process.cwd())
  const files = generateModuleFiles(parsed.moduleId, { outputRoot })

  ensureWritable(outputRoot, files)

  if (!parsed.dryRun) {
    writeFiles(outputRoot, files)
  }

  const prefix = parsed.dryRun ? 'Dry run would generate' : 'Generated'
  console.log(`${prefix} ${files.length} files for ${parsed.moduleId}:`)
  for (const generatedFile of files) {
    console.log(`- ${generatedFile.path}`)
  }

  return files
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectRun) {
  try {
    runCreateModule(process.argv.slice(2))
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown generator error.'
    console.error(message)
    process.exit(1)
  }
}
