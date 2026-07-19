import { generateModuleFiles } from './create-module'

type Finding = {
  file: string
  pattern: string
}

type ContentPattern = string | RegExp

const tenantKey = 'org' + 'Id'
const forbiddenPatterns = [
  'sdk.getDb(' + tenantKey + ')',
  'getDb(' + tenantKey + ')',
  'body.' + tenantKey,
  'input.' + tenantKey,
  "searchParams.get('" + tenantKey + "')",
  '/api/' + '[module]',
  '/api/' + 'inventory',
  '/api/' + 'sample-module',
  'Object.fromEntries(handledRequest.nextUrl.searchParams)',
  'sdk.modules.register',
  "permissions: ['",
  "resource: '*'",
  'framer' + '-motion',
  'Fast' + 'API',
] satisfies ContentPattern[]

const moduleForbiddenPatterns = [
  "@/" + 'kernel/',
  '@prisma/' + 'client',
  '@/' + 'modules/',
  /\bInventoryProduct\b/,
  /\bInventoryWarehouse\b/,
  /\bInventorySupplier\b/,
  /\bCRMCustomer\b/,
  /\bLeaveEmployee\b/,
  /\bHREmployee\b/,
  /\bPurchasingSupplier\b/,
  /\bAssetEmployee\b/,
  /\bWarehouseInventoryLocation\b/,
  /\bmodel\s+Employee\b/,
  /\bmodel\s+Product\b/,
  /\bmodel\s+ProductCategory\b/,
  /\bmodel\s+Customer\b/,
  /\bmodel\s+Supplier\b/,
  /\bmodel\s+Warehouse\b/,
] satisfies ContentPattern[]

const requiredGeneratedPaths = [
  'src/modules/sample-module/ux.ts',
  'src/modules/sample-module/process-flow.ts',
  'src/modules/sample-module/UX-CONFORMANCE.md',
  'src/modules/sample-module/__tests__/ux.test.ts',
  'src/modules/sample-module/__tests__/process-flow.test.ts',
  'src/app/[orgSlug]/sample-module/page.tsx',
  'src/app/[orgSlug]/sample-module/loading.tsx',
  'src/app/[orgSlug]/sample-module/error.tsx',
  'src/app/[orgSlug]/sample-module/process-flow/page.tsx',
  'src/app/[orgSlug]/sample-module/process-flow/loading.tsx',
] as const

const requiredUxContractFields = [
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

function contentFor(files: ReturnType<typeof generateModuleFiles>, path: string): string {
  return files.find((file) => file.path === path)?.content ?? ''
}

function addMissingContentFinding(findings: Finding[], file: string, pattern: string) {
  findings.push({ file, pattern: `missing ${pattern}` })
}

function matchesPattern(content: string, pattern: ContentPattern): boolean {
  return typeof pattern === 'string' ? content.includes(pattern) : pattern.test(content)
}

function patternLabel(pattern: ContentPattern): string {
  return typeof pattern === 'string' ? pattern : pattern.source
}

function checkGeneratedTemplates(): Finding[] {
  const files = generateModuleFiles('sample-module', { outputRoot: process.cwd() })
  const findings: Finding[] = []
  const paths = new Set(files.map((file) => file.path))

  for (const requiredPath of requiredGeneratedPaths) {
    if (!paths.has(requiredPath)) {
      findings.push({ file: requiredPath, pattern: 'required generated UX file' })
    }
  }

  for (const file of files) {
    for (const pattern of forbiddenPatterns) {
      if (matchesPattern(file.content, pattern)) {
        findings.push({ file: file.path, pattern: patternLabel(pattern) })
      }
    }

    if (!file.path.includes('/__tests__/')) {
      for (const activeForbiddenPattern of ["from '@/" + 'kernel/', 'from "@/' + 'kernel/', "from '@prisma/" + "client'", 'from "@prisma/' + 'client"']) {
        if (file.content.includes(activeForbiddenPattern)) {
          findings.push({ file: file.path, pattern: activeForbiddenPattern })
        }
      }
    }

    if (file.path.startsWith('src/app/api/') && !file.path.includes('/__tests__/')) {
      for (const apiForbiddenPattern of ['next/navigation', "redirect('/login')"]) {
        if (file.content.includes(apiForbiddenPattern)) {
          findings.push({ file: file.path, pattern: apiForbiddenPattern })
        }
      }
    }

    if (file.path.startsWith('src/modules/sample-module/') && !file.path.includes('/__tests__/')) {
      for (const moduleForbiddenPattern of moduleForbiddenPatterns) {
        if (matchesPattern(file.content, moduleForbiddenPattern)) {
          findings.push({ file: file.path, pattern: patternLabel(moduleForbiddenPattern) })
        }
      }
    }

    if (/^\s*['"]use client['"]/.test(file.content)) {
      for (const clientForbiddenPattern of [
        '@/' + 'sdk/server',
        '@/' + 'kernel/',
        '@prisma/' + 'client',
        'name="org' + 'Id"',
        'JSON.stringify({ org' + 'Id',
      ]) {
        if (file.content.includes(clientForbiddenPattern)) {
          findings.push({ file: file.path, pattern: clientForbiddenPattern })
        }
      }
    }
  }

  const uxSource = contentFor(files, 'src/modules/sample-module/ux.ts')
  const processFlowSource = contentFor(files, 'src/modules/sample-module/process-flow.ts')
  const conformanceSource = contentFor(files, 'src/modules/sample-module/UX-CONFORMANCE.md')
  const landingSource = contentFor(files, 'src/app/[orgSlug]/sample-module/page.tsx')
  const listClientSource = contentFor(files, 'src/app/[orgSlug]/sample-module/_components/SampleModuleListClient.tsx')
  const landingLoadingSource = contentFor(files, 'src/app/[orgSlug]/sample-module/loading.tsx')
  const landingErrorSource = contentFor(files, 'src/app/[orgSlug]/sample-module/error.tsx')
  const processFlowPageSource = contentFor(files, 'src/app/[orgSlug]/sample-module/process-flow/page.tsx')
  const processFlowLoadingSource = contentFor(files, 'src/app/[orgSlug]/sample-module/process-flow/loading.tsx')

  if (!uxSource.includes('satisfies ModuleUxContract')) {
    addMissingContentFinding(findings, 'src/modules/sample-module/ux.ts', 'satisfies ModuleUxContract')
  }

  for (const field of requiredUxContractFields) {
    if (!uxSource.includes(field)) {
      addMissingContentFinding(findings, 'src/modules/sample-module/ux.ts', field)
    }
  }

  if (!uxSource.includes('TODO(UX)')) {
    addMissingContentFinding(findings, 'src/modules/sample-module/ux.ts', 'TODO(UX) draft placeholders')
  }

  if (!processFlowSource.includes('satisfies ProcessFlowDefinition')) {
    addMissingContentFinding(findings, 'src/modules/sample-module/process-flow.ts', 'satisfies ProcessFlowDefinition')
  }

  for (const field of ['title', 'description', 'steps', 'owns', 'doesNotOwn', 'currentBoundaries', 'futureIntegrations']) {
    if (!processFlowSource.includes(field)) {
      addMissingContentFinding(findings, 'src/modules/sample-module/process-flow.ts', field)
    }
  }

  if (!processFlowSource.includes('TODO(UX)')) {
    addMissingContentFinding(findings, 'src/modules/sample-module/process-flow.ts', 'TODO(UX) draft placeholders')
  }

  if (!conformanceSource.includes('Not Reviewed') || !conformanceSource.includes('Not Approved')) {
    addMissingContentFinding(findings, 'src/modules/sample-module/UX-CONFORMANCE.md', 'Not Reviewed and Not Approved status')
  }

  if (!landingSource.includes('DashboardPage') || !landingSource.includes('TrueEmptyState')) {
    addMissingContentFinding(findings, 'src/app/[orgSlug]/sample-module/page.tsx', 'shared DashboardPage pattern')
  }

  if (landingSource.includes('DashboardMetric') || /fake\s+(?:dashboard\s+)?metrics/i.test(landingSource)) {
    findings.push({ file: 'src/app/[orgSlug]/sample-module/page.tsx', pattern: 'fake dashboard metrics' })
  }

  if (!listClientSource.includes('ListPage') || !listClientSource.includes('DataTable')) {
    addMissingContentFinding(findings, 'src/app/[orgSlug]/sample-module/_components/SampleModuleListClient.tsx', 'shared ListPage and DataTable patterns')
  }

  if (!processFlowPageSource.includes('ProcessFlowPage')) {
    addMissingContentFinding(findings, 'src/app/[orgSlug]/sample-module/process-flow/page.tsx', 'shared ProcessFlowPage pattern')
  }

  if (!processFlowLoadingSource.includes('ProcessFlowLoadingState')) {
    addMissingContentFinding(findings, 'src/app/[orgSlug]/sample-module/process-flow/loading.tsx', 'contextual Process Flow loading state')
  }

  if (!landingLoadingSource.includes('DashboardPageLoadingState')) {
    addMissingContentFinding(findings, 'src/app/[orgSlug]/sample-module/loading.tsx', 'contextual dashboard loading state')
  }

  for (const [path, content] of [
    ['src/app/[orgSlug]/sample-module/loading.tsx', landingLoadingSource],
    ['src/app/[orgSlug]/sample-module/error.tsx', landingErrorSource],
    ['src/app/[orgSlug]/sample-module/process-flow/loading.tsx', processFlowLoadingSource],
  ] as const) {
    if (/\bLoading\.\.\.\b|\bError\b(?!State)/.test(content)) {
      findings.push({ file: path, pattern: 'generic final loading/error text' })
    }
  }

  return findings
}

const findings = checkGeneratedTemplates()

if (findings.length > 0) {
  console.error('Generated template check failed:')
  for (const finding of findings) {
    console.error(`- ${finding.file}: contains ${finding.pattern}`)
  }
  process.exit(1)
}

console.log('Generated template check passed.')
