import { existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { afterEach, describe, expect, it } from 'vitest'
import { generateModuleFiles, runCreateModule } from './create-module'

const tempDirs: string[] = []

function makeTempDir(): string {
  const dir = mkdtempSync(join(tmpdir(), 'onedayos-generator-'))
  tempDirs.push(dir)
  return dir
}

function generatedContent(moduleId = 'visitor-management') {
  return generateModuleFiles(moduleId, { outputRoot: makeTempDir() })
}

function allContent(moduleId = 'visitor-management') {
  return generatedContent(moduleId)
    .map((file) => file.content)
    .join('\n')
}

describe('module generator', () => {
  afterEach(() => {
    for (const dir of tempDirs) {
      rmSync(dir, { recursive: true, force: true })
    }
    tempDirs.length = 0
  })

  it('rejects invalid and reserved module ids', () => {
    expect(() => generateModuleFiles('Inventory')).toThrow(/lowercase kebab-case/)
    expect(() => generateModuleFiles('inventory_module')).toThrow(/lowercase kebab-case/)
    expect(() => generateModuleFiles('../inventory')).toThrow(/lowercase kebab-case/)
    expect(() => generateModuleFiles('api')).toThrow(/reserved/)
  })

  it('does not overwrite existing files', () => {
    const root = makeTempDir()
    mkdirSync(join(root, 'src/modules/payroll'), { recursive: true })
    writeFileSync(join(root, 'src/modules/payroll/manifest.ts'), 'export const existing = true\n')

    expect(() => runCreateModule(['payroll', '--output', root])).toThrow(/Refusing to overwrite/)
  })

  it('supports dry-run without writing files', () => {
    const root = makeTempDir()

    runCreateModule(['payroll', '--dry-run', '--output', root])

    expect(existsSync(join(root, 'src/modules/payroll/manifest.ts'))).toBe(false)
  })

  it('generates the required module, page, API, and test files', () => {
    const paths = generatedContent().map((file) => file.path)

    expect(paths).toEqual(
      expect.arrayContaining([
        'src/modules/visitor-management/manifest.ts',
        'src/modules/visitor-management/permissions.ts',
        'src/modules/visitor-management/schema.ts',
        'src/modules/visitor-management/types.ts',
        'src/modules/visitor-management/service.ts',
        'src/modules/visitor-management/events.ts',
        'src/modules/visitor-management/settings.ts',
        'src/modules/visitor-management/navigation.ts',
        'src/modules/visitor-management/ai-context.ts',
        'src/modules/visitor-management/ux.ts',
        'src/modules/visitor-management/process-flow.ts',
        'src/modules/visitor-management/UX-CONFORMANCE.md',
        'src/modules/visitor-management/docs.md',
        'src/modules/visitor-management/index.ts',
        'src/modules/visitor-management/README.md',
        'src/modules/visitor-management/__tests__/manifest.test.ts',
        'src/modules/visitor-management/__tests__/service.test.ts',
        'src/modules/visitor-management/__tests__/ux.test.ts',
        'src/modules/visitor-management/__tests__/process-flow.test.ts',
        'src/app/[orgSlug]/visitor-management/page.tsx',
        'src/app/[orgSlug]/visitor-management/loading.tsx',
        'src/app/[orgSlug]/visitor-management/error.tsx',
        'src/app/[orgSlug]/visitor-management/process-flow/page.tsx',
        'src/app/[orgSlug]/visitor-management/process-flow/loading.tsx',
        'src/app/api/orgs/[orgSlug]/visitor-management/route.ts',
        'src/app/api/orgs/[orgSlug]/visitor-management/__tests__/route.test.ts',
      ]),
    )
  })

  it('generates a pure metadata manifest with full permission objects', () => {
    const manifest = generatedContent().find((file) => file.path.endsWith('/manifest.ts'))?.content ?? ''

    expect(manifest).toContain('defineModuleManifest')
    expect(manifest).toContain('Object.values(VISITOR_MANAGEMENT_PERMISSIONS)')
    expect(manifest).toContain("path: '/visitor-management/process-flow'")
    expect(manifest).toContain("path: '/api/orgs/[orgSlug]/visitor-management'")
    expect(manifest).not.toContain('@/sdk/server')
    expect(manifest).not.toContain('@/kernel/')
    expect(manifest).not.toContain('sdk.modules.register')
    expect(manifest).not.toContain('permissions: [\'')
    expect(manifest).not.toContain("resource: '*'")
  })

  it('generates UX contract and Process Flow scaffolds with explicit draft placeholders', () => {
    const files = generatedContent()
    const ux = files.find((file) => file.path.endsWith('/ux.ts'))?.content ?? ''
    const processFlow = files.find((file) => file.path.endsWith('/process-flow.ts'))?.content ?? ''
    const conformance = files.find((file) => file.path.endsWith('/UX-CONFORMANCE.md'))?.content ?? ''

    expect(ux).toContain('satisfies ModuleUxContract')
    expect(ux).toContain('primaryUsers')
    expect(ux).toContain('criticalErrorsToPrevent')
    expect(ux).toContain("defaultLandingPage: '/visitor-management'")
    expect(ux).toContain("processFlowRoute: '/visitor-management/process-flow'")
    expect(ux).toContain('TODO(UX)')
    expect(ux).not.toContain('@/sdk/server')
    expect(ux).not.toContain('@/kernel/')
    expect(ux).not.toContain('@prisma/client')

    expect(processFlow).toContain('satisfies ProcessFlowDefinition')
    expect(processFlow).toContain('draft-workflow-step')
    expect(processFlow).toContain('owns')
    expect(processFlow).toContain('doesNotOwn')
    expect(processFlow).toContain('TODO(UX)')
    expect(processFlow).not.toContain('@/sdk/server')
    expect(processFlow).not.toContain('@/kernel/')
    expect(processFlow).not.toContain('@prisma/client')

    expect(conformance).toContain('## Status')
    expect(conformance).toContain('Not Reviewed')
    expect(conformance).toContain('## Approval Result')
    expect(conformance).toContain('Not Approved')
  })

  it('generates shared page-pattern routes and contextual loading/error states', () => {
    const files = generatedContent()
    const landing = files.find((file) => file.path === 'src/app/[orgSlug]/visitor-management/page.tsx')?.content ?? ''
    const listClient =
      files.find((file) => file.path.endsWith('/_components/VisitorManagementListClient.tsx'))?.content ?? ''
    const processFlowPage =
      files.find((file) => file.path === 'src/app/[orgSlug]/visitor-management/process-flow/page.tsx')?.content ?? ''
    const processFlowLoading =
      files.find((file) => file.path === 'src/app/[orgSlug]/visitor-management/process-flow/loading.tsx')?.content ?? ''
    const landingLoading = files.find((file) => file.path === 'src/app/[orgSlug]/visitor-management/loading.tsx')?.content ?? ''
    const landingError = files.find((file) => file.path === 'src/app/[orgSlug]/visitor-management/error.tsx')?.content ?? ''

    expect(landing).toContain('DashboardPage')
    expect(landing).toContain('TrueEmptyState')
    expect(landing).toContain('/visitor-management/process-flow')
    expect(landing).not.toContain('DashboardMetric')
    expect(landing).not.toContain('fake metrics')
    expect(listClient).toContain('ListPage')
    expect(listClient).toContain('DataTable')
    expect(processFlowPage).toContain('ProcessFlowPage')
    expect(processFlowPage).toContain('visitorManagementProcessFlow')
    expect(processFlowLoading).toContain('ProcessFlowLoadingState')
    expect(processFlowLoading).not.toContain('Loading...')
    expect(landingLoading).toContain('DashboardPageLoadingState')
    expect(landingLoading).not.toContain('Loading...')
    expect(landingError).toContain('SafePageErrorState')
    expect(landingError).not.toContain('throw error')
  })

  it('generates strict schemas without client-supplied tenant identity', () => {
    const schema = generatedContent().find((file) => file.path.endsWith('/schema.ts'))?.content ?? ''

    expect(schema).toContain('z.strictObject')
    expect(schema).toContain('updateVisitorManagementRecordSchema')
    expect(schema).not.toContain('orgId')
    expect(schema).not.toContain('userId')
    expect(schema).not.toContain('createdBy')
  })

  it('generates tenant-safe API and PlatformContext service patterns', () => {
    const files = generatedContent()
    const route = files.find((file) => file.path.endsWith('/route.ts'))?.content ?? ''
    const service = files.find((file) => file.path.endsWith('/service.ts'))?.content ?? ''

    expect(route).toContain("requireApiModuleContext(handledRequest, orgSlug, 'visitor-management'")
    expect(route).toContain('sdk.api.parseSearchParams')
    expect(route).toContain('sdk.api.parseJsonBody')
    expect(route).not.toContain('Object.fromEntries(handledRequest.nextUrl.searchParams)')
    expect(service).toContain('ctx: PlatformContext')
    expect(service).toContain('sdk.getDb(ctx)')
    expect(service).toContain('sdk.permissions.require(ctx')
    expect(service).toContain('not implemented until durable module storage is specified')
    expect(service).not.toContain('sdk.events.emit(ctx')
  })

  it('does not generate rejected old patterns', () => {
    const output = allContent()
    const forbidden = [
      'sdk.getDb(orgId)',
      'getDb(orgId)',
      'body.orgId',
      'input.orgId',
      "searchParams.get('orgId')",
      '/api/[module]',
      '/api/inventory',
      '/api/visitor-management',
      'framer-motion',
      'FastAPI',
    ]

    for (const pattern of forbidden) {
      expect(output).not.toContain(pattern)
    }
  })

  it('keeps module files behind SDK boundaries', () => {
    const moduleOutput = generatedContent()
      .filter((file) => file.path.startsWith('src/modules/visitor-management/') && !file.path.includes('/__tests__/'))
      .map((file) => file.content)
      .join('\n')

    expect(moduleOutput).not.toContain('@/kernel/')
    expect(moduleOutput).not.toContain('@prisma/client')
    expect(moduleOutput).not.toContain('@/modules/')
    expect(moduleOutput).not.toContain('from \'./service\'')
  })

  it('teaches generated modules to reference shared Business Objects instead of recreating them', () => {
    const docsOutput = generatedContent()
      .filter((file) => file.path.endsWith('/README.md') || file.path.endsWith('/docs.md'))
      .map((file) => file.content)
      .join('\n')

    expect(docsOutput).toContain('reference the shared')
    expect(docsOutput).toContain('Business Objects layer')
    expect(docsOutput).toContain('Do not create duplicate module-specific identities')
  })
})
