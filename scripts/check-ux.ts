import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

export type UxFinding = {
  file: string
  rule: string
  detail: string
}

const REQUIRED_UX_CONTRACT_FIELDS = [
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

const REQUIRED_MODULE_PATHS = [
  'ux.ts',
  'process-flow.ts',
  'UX-CONFORMANCE.md',
  '__tests__/ux.test.ts',
  '__tests__/process-flow.test.ts',
] as const

const REQUIRED_PROCESS_FLOW_ROUTE_PATHS = [
  'process-flow/page.tsx',
  'process-flow/loading.tsx',
] as const

const REQUIRED_RUNTIME_APPEARANCE_DOCS = [
  'docs/engineering-manual/00-meta/adrs/ADR-0013-runtime-appearance-preference.md',
  'docs/engineering-manual/03-design-system/14-runtime-appearance.md',
  'docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-runtime-appearance.md',
] as const

const REQUIRED_PLATFORM_UX_DOCS = [
  'src/platform/organization/UX-CONFORMANCE.md',
  'src/business-objects/UX-CONFORMANCE.md',
  'docs/engineering-manual/03-design-system/IMPLEMENTATION-NOTE-organization-records-ux-retrofit.md',
  'docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-1-compact-header-shared-records-ia.md',
] as const

const REQUIRED_ROLE_BASED_UX_VALIDATION_DOCS = [
  'docs/demo/ROLE-BASED-UX-VALIDATION-GUIDE.md',
  'docs/demo/reviews/FOUNDER-ORG-ADMIN-UX-REVIEW.md',
  'docs/demo/reviews/FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md',
  'docs/demo/reviews/MANUAL-ACCESSIBILITY-REVIEW.md',
  'docs/demo/reviews/UX-FINDINGS-LOG.md',
  'docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-role-based-ux-validation-preparation.md',
] as const

const REQUIRED_CONTROLLED_DEMO_DOCS = [
  'docs/demo/CONTROLLED-DEMO-RUNBOOK.md',
  'docs/demo/DEMO-STORYBOARD-INVENTORY.md',
  'docs/demo/DEMO-READINESS-CHECKLIST.md',
  'docs/demo/DEMO-KNOWN-LIMITATIONS.md',
  'docs/demo/WEBSITE-SAMPLE-ASSET-PLAN.md',
  'docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-controlled-demo-preparation.md',
] as const

function normalizePath(path: string): string {
  return path.split(sep).join('/')
}

function rel(root: string, path: string): string {
  return normalizePath(relative(root, path))
}

function readIfExists(path: string): string | null {
  return existsSync(path) ? readFileSync(path, 'utf8') : null
}

function listFiles(root: string): string[] {
  if (!existsSync(root)) return []

  const output: string[] = []

  for (const entry of readdirSync(root)) {
    const absolute = join(root, entry)
    const stats = statSync(absolute)

    if (stats.isDirectory()) {
      if (entry === '__tests__' || entry === '_archive') continue
      output.push(...listFiles(absolute))
      continue
    }

    if (/\.test\.(?:ts|tsx)$/.test(entry)) {
      continue
    }

    if (/\.(?:ts|tsx)$/.test(entry)) {
      output.push(absolute)
    }
  }

  return output
}

export function discoverOfficialModules(root: string): string[] {
  const compositionRootPath = join(root, 'src/modules/index.ts')
  const source = readIfExists(compositionRootPath)

  if (!source) return []

  const importMap = new Map<string, string>()
  const importPattern =
    /import\s+\{\s*([A-Za-z0-9_$]+)\s*\}\s+from\s+['"]\.\/([a-z][a-z0-9-]*)\/manifest['"]/g

  for (const match of source.matchAll(importPattern)) {
    importMap.set(match[1], match[2])
  }

  const arrayMatch = source.match(/moduleManifests\s*=\s*\[([\s\S]*?)\]/)
  const arraySource = arrayMatch?.[1]

  if (!arraySource) {
    return [...new Set(importMap.values())].sort()
  }

  const moduleIds: string[] = []

  for (const [localName, moduleId] of importMap) {
    if (new RegExp(`\\b${localName}\\b`).test(arraySource)) {
      moduleIds.push(moduleId)
    }
  }

  return [...new Set(moduleIds)].sort()
}

function addFinding(findings: UxFinding[], root: string, file: string, rule: string, detail: string) {
  findings.push({
    file: file.startsWith(root) ? rel(root, file) : normalizePath(file),
    rule,
    detail,
  })
}

function checkRequiredFile(findings: UxFinding[], root: string, path: string, rule: string, detail: string): string | null {
  const source = readIfExists(path)

  if (!source) {
    addFinding(findings, root, path, rule, detail)
  }

  return source
}

function checkOfficialModuleContract(root: string, moduleId: string, findings: UxFinding[]) {
  const moduleRoot = join(root, 'src/modules', moduleId)
  const routeRoot = join(root, 'src/app/[orgSlug]', moduleId)

  for (const requiredPath of REQUIRED_MODULE_PATHS) {
    checkRequiredFile(
      findings,
      root,
      join(moduleRoot, requiredPath),
      'missing-official-module-ux-file',
      'Official modules must include UX contract, Process Flow, conformance, and UX tests.',
    )
  }

  for (const requiredPath of REQUIRED_PROCESS_FLOW_ROUTE_PATHS) {
    checkRequiredFile(
      findings,
      root,
      join(routeRoot, requiredPath),
      'missing-process-flow-route',
      'Official modules must include a Process Flow page and contextual loading route.',
    )
  }

  const uxSource = readIfExists(join(moduleRoot, 'ux.ts'))
  const processFlowSource = readIfExists(join(moduleRoot, 'process-flow.ts'))
  const conformanceSource = readIfExists(join(moduleRoot, 'UX-CONFORMANCE.md'))
  const manifestSource = readIfExists(join(moduleRoot, 'manifest.ts')) ?? ''
  const navigationSource = readIfExists(join(moduleRoot, 'navigation.ts')) ?? ''
  const processFlowPageSource = readIfExists(join(routeRoot, 'process-flow/page.tsx'))
  const processFlowLoadingSource = readIfExists(join(routeRoot, 'process-flow/loading.tsx'))

  for (const [path, source] of [
    [join(moduleRoot, 'ux.ts'), uxSource],
    [join(moduleRoot, 'process-flow.ts'), processFlowSource],
    [join(moduleRoot, 'UX-CONFORMANCE.md'), conformanceSource],
  ] as const) {
    if (!source) continue

    if (source.includes('TODO(UX)')) {
      addFinding(findings, root, path, 'unresolved-ux-placeholder', 'Official module UX files must not contain TODO(UX).')
    }

    if (/^Status:\s*Not Reviewed\s*$/m.test(source) || /^Approval Result:\s*Not Approved\s*$/m.test(source)) {
      addFinding(
        findings,
        root,
        path,
        'unreviewed-generator-conformance',
        'Official modules must replace generated Not Reviewed / Not Approved conformance scaffold.',
      )
    }

    if (/from\s+['"]@\/sdk\/server['"]|from\s+['"]@\/kernel\/|from\s+['"]@prisma\/client['"]/.test(source)) {
      addFinding(
        findings,
        root,
        path,
        'server-import-in-ux-contract',
        'Module UX and Process Flow contract files must remain declarative and client-safe.',
      )
    }
  }

  if (uxSource) {
    if (!uxSource.includes('satisfies ModuleUxContract')) {
      addFinding(findings, root, join(moduleRoot, 'ux.ts'), 'missing-module-ux-contract', 'ux.ts must satisfy ModuleUxContract.')
    }

    for (const field of REQUIRED_UX_CONTRACT_FIELDS) {
      if (!uxSource.includes(field)) {
        addFinding(
          findings,
          root,
          join(moduleRoot, 'ux.ts'),
          'missing-module-ux-field',
          `ModuleUxContract field is missing: ${field}.`,
        )
      }
    }
  }

  if (processFlowSource) {
    if (!processFlowSource.includes('satisfies ProcessFlowDefinition')) {
      addFinding(
        findings,
        root,
        join(moduleRoot, 'process-flow.ts'),
        'missing-process-flow-definition',
        'process-flow.ts must satisfy ProcessFlowDefinition.',
      )
    }

    for (const field of ['title', 'description', 'steps', 'owns', 'doesNotOwn']) {
      if (!processFlowSource.includes(field)) {
        addFinding(
          findings,
          root,
          join(moduleRoot, 'process-flow.ts'),
          'missing-process-flow-field',
          `Process Flow definition field is missing: ${field}.`,
        )
      }
    }
  }

  if (!/process-flow/.test(manifestSource) && !/process-flow/.test(navigationSource)) {
    addFinding(
      findings,
      root,
      join(moduleRoot, 'manifest.ts'),
      'missing-process-flow-navigation',
      'Official module manifest or navigation must expose Process Flow.',
    )
  }

  if (processFlowPageSource && !processFlowPageSource.includes('ProcessFlowPage')) {
    addFinding(
      findings,
      root,
      join(routeRoot, 'process-flow/page.tsx'),
      'missing-shared-process-flow-page',
      'Official Process Flow routes must use the shared ProcessFlowPage pattern.',
    )
  }

  if (processFlowLoadingSource && !processFlowLoadingSource.includes('ProcessFlowLoadingState')) {
    addFinding(
      findings,
      root,
      join(routeRoot, 'process-flow/loading.tsx'),
      'missing-process-flow-loading-state',
      'Process Flow loading routes must use ProcessFlowLoadingState.',
    )
  }

  if (moduleId === 'inventory') {
    checkInventoryPatternAdoption(root, routeRoot, findings)
  }
}

function checkInventoryPatternAdoption(root: string, routeRoot: string, findings: UxFinding[]) {
  const dashboardSource = readIfExists(join(routeRoot, 'page.tsx'))
  const listRoutes = [
    'product-settings/page.tsx',
    'stock-levels/page.tsx',
    'stock-movements/page.tsx',
    'stock-adjustments/page.tsx',
  ]
  const formSource = readIfExists(join(routeRoot, 'stock-adjustments/new/page.tsx'))

  if (dashboardSource && !dashboardSource.includes('DashboardPage')) {
    addFinding(findings, root, join(routeRoot, 'page.tsx'), 'inventory-dashboard-pattern', 'Inventory Dashboard must use DashboardPage.')
  }

  for (const route of listRoutes) {
    const source = readIfExists(join(routeRoot, route))

    if (source && !source.includes('ListPage')) {
      addFinding(findings, root, join(routeRoot, route), 'inventory-list-pattern', 'Inventory list pages must use ListPage.')
    }
  }

  if (formSource && !formSource.includes('FormPage') && !formSource.includes('StockAdjustmentCreatePresenter')) {
    addFinding(findings, root, join(routeRoot, 'stock-adjustments/new/page.tsx'), 'inventory-form-pattern', 'Inventory adjustment form page must use FormPage.')
  }
}

function checkDataTableV2(root: string, findings: UxFinding[]) {
  const packageSource = readIfExists(join(root, 'package.json')) ?? ''
  if (!packageSource.includes('"@tanstack/react-table"')) return

  const required = [
    'src/components/onedayos/data-table/data-table-v2.tsx',
    'src/app/[orgSlug]/inventory/_components/inventory-data-tables.tsx',
    'src/app/[orgSlug]/records/_components/records-data-table.tsx',
    'src/app/[orgSlug]/organization/_components/organization-data-tables.tsx',
  ]
  for (const path of required) {
    const source = readIfExists(join(root, path))
    if (!source?.includes('DataTableV2') && !source?.includes('data-data-table-v2')) {
      addFinding(findings, root, join(root, path), 'missing-data-table-v2', 'Production operational lists must use the shared Data Table V2 contract.')
    }
  }

  const tableSource = readIfExists(join(root, required[0])) ?? ''
  for (const requiredText of ['@tanstack/react-table', 'manualPagination', 'onKeyDown', 'localStorage', 'data-data-table-v2']) {
    if (!tableSource.includes(requiredText)) {
      addFinding(findings, root, join(root, required[0]), 'incomplete-data-table-v2-contract', `Data Table V2 is missing: ${requiredText}.`)
    }
  }

  const prompt38 = readIfExists(join(root, 'docs/engineering-manual/prompts/CODEX_PROMPT_38_V2_3_URL_ADDRESSABLE_MODALS.md'))
  const prompt41 = readIfExists(join(root, 'docs/engineering-manual/prompts/CODEX_PROMPT_41_V2_4_DASHBOARD_CHARTS_PROCESS_FLOW.md'))
  const prompt43 = readIfExists(join(root, 'docs/engineering-manual/prompts/CODEX_PROMPT_43_V2_5_BOUNDED_TABLE_EXPORT.md'))
  const forbiddenDependencies = [
    ...(prompt38 ? [] : ['@radix-ui/react-dialog']),
    ...(prompt41 ? [] : ['recharts']),
    ...(prompt43 ? [] : ['exceljs']),
  ]
  for (const forbiddenDependency of forbiddenDependencies) {
    if (packageSource.includes(`"${forbiddenDependency}"`)) {
      addFinding(findings, root, join(root, 'package.json'), 'premature-v2-dependency', `${forbiddenDependency} is not authorized by the current V2 package.`)
    }
  }

  const inventoryTableSource = readIfExists(join(root, required[1])) ?? ''
  if (!inventoryTableSource.includes('Adjust Stock') || !inventoryTableSource.includes('productId=') || !inventoryTableSource.includes('warehouseId=')) {
    addFinding(findings, root, join(root, required[1]), 'missing-stock-adjust-contract', 'Stock Levels must expose permission-aware validated adjustment prefill.')
  }
  if (!prompt43 && /\bExport\b/.test(tableSource + inventoryTableSource)) {
    addFinding(findings, root, join(root, required[0]), 'premature-table-export', 'Export remains blocked until V2-5.')
  }

  const prompt37 = readIfExists(join(root, 'docs/engineering-manual/prompts/CODEX_PROMPT_37_V2_2_ACCEPTANCE_SCALE_HARDENING.md'))
  if (!prompt37) return

  const acceptancePath = 'docs/engineering-manual/00-meta/V2-2-ACCEPTANCE-REPORT.md'
  const acceptanceSource = readIfExists(join(root, acceptancePath))
  if (!acceptanceSource) {
    addFinding(findings, root, join(root, acceptancePath), 'missing-v2-2-acceptance-report', 'Prompt 37 requires the V2-2 acceptance report.')
  } else {
    for (const requiredText of ['Production Table Mode Inventory', 'Stock Status Filter Correctness', 'V2-3 remains blocked', 'Website asset production remains paused']) {
      if (!acceptanceSource.includes(requiredText)) {
        addFinding(findings, root, join(root, acceptancePath), 'incomplete-v2-2-acceptance-report', `V2-2 acceptance evidence is missing: ${requiredText}.`)
      }
    }
  }

  for (const path of required.slice(1)) {
    const source = readIfExists(join(root, path)) ?? ''
    if (source.includes('mode="client"')) {
      addFinding(findings, root, join(root, path), 'growth-table-client-mode', 'Prompt 37 growth and production tables must use server mode.')
    }
  }

  const inventoryServicePath = 'src/modules/inventory/service.ts'
  const inventoryService = readIfExists(join(root, inventoryServicePath)) ?? ''
  for (const forbiddenText of ['candidateTotal', 'allRows.slice(', 'limited to 100 candidate', 'total: allRows.length']) {
    if (inventoryService.includes(forbiddenText)) {
      addFinding(findings, root, join(root, inventoryServicePath), 'stock-status-candidate-cap', `Stock Status must not use partial candidate logic: ${forbiddenText}.`)
    }
  }

  const stockSchemaPath = 'src/modules/inventory/schema.ts'
  const stockSchema = readIfExists(join(root, stockSchemaPath)) ?? ''
  if (stockSchema.includes("status: z.enum(['in_stock'") || stockSchema.includes('lowStockOnly:')) {
    addFinding(findings, root, join(root, stockSchemaPath), 'inexact-stock-status-query', 'The deferred Stock Status filter must remain rejected until an exact query is approved.')
  }

  const presenterPath = 'src/app/[orgSlug]/records/_components/shared-record-pages.tsx'
  const presenterSource = readIfExists(join(root, presenterPath)) ?? ''
  if (presenterSource.includes('.list(ctx, {})') || !presenterSource.includes('.listPage(ctx, query)')) {
    addFinding(findings, root, join(root, presenterPath), 'unbounded-shared-record-list', 'Shared Records presenters must use exact server page services.')
  }

  for (const path of [
    'src/app/[orgSlug]/organization/people/page.tsx',
    'src/app/[orgSlug]/organization/branches-departments/page.tsx',
  ]) {
    if ((readIfExists(join(root, path)) ?? '').includes('.findMany(')) {
      addFinding(findings, root, join(root, path), 'unbounded-organization-list', 'Organization production pages must query through the bounded server table service.')
    }
  }

  for (const path of [
    'src/app/api/orgs/[orgSlug]/inventory/stock-levels/route.ts',
    'src/app/api/orgs/[orgSlug]/inventory/stock-movements/route.ts',
    'src/app/api/orgs/[orgSlug]/inventory/stock-adjustments/route.ts',
  ]) {
    const source = readIfExists(join(root, path)) ?? ''
    if (source.includes('total: 0') || !source.includes('result.meta')) {
      addFinding(findings, root, join(root, path), 'inaccurate-list-api-meta', 'Inventory list APIs must return truthful service pagination metadata.')
    }
  }
}

function checkDashboardChartsV2(root: string, findings: UxFinding[]) {
  const packageSource = readIfExists(join(root, 'package.json')) ?? ''
  if (!packageSource.includes('"recharts"')) return

  let packageJson: { dependencies?: Record<string, string> } = {}
  try {
    packageJson = JSON.parse(packageSource) as { dependencies?: Record<string, string> }
  } catch {
    addFinding(findings, root, join(root, 'package.json'), 'invalid-package-json', 'package.json must remain valid JSON.')
  }

  if (packageJson.dependencies?.recharts !== '3.10.0') {
    addFinding(findings, root, join(root, 'package.json'), 'invalid-recharts-version', 'V2-4 requires exact stable recharts@3.10.0.')
  }

  const prompt43 = readIfExists(join(root, 'docs/engineering-manual/prompts/CODEX_PROMPT_43_V2_5_BOUNDED_TABLE_EXPORT.md'))
  for (const forbiddenDependency of [
    ...(prompt43 ? [] : ['exceljs']),
    'chart.js',
    'echarts',
    '@nivo/core',
    'victory',
    'reactflow',
    'react-flow-renderer',
    'mermaid',
  ]) {
    if (packageJson.dependencies?.[forbiddenDependency]) {
      addFinding(findings, root, join(root, 'package.json'), 'forbidden-v2-4-visual-dependency', `V2-4 must not add ${forbiddenDependency}.`)
    }
  }

  const requiredPaths = [
    'src/components/onedayos/charts/chart-container.tsx',
    'src/components/onedayos/charts/chart-data-table.tsx',
    'src/components/onedayos/charts/chart-tooltip.tsx',
    'src/components/onedayos/charts/chart-states.tsx',
    'src/app/[orgSlug]/inventory/_components/inventory-dashboard-charts.tsx',
    'src/components/onedayos/patterns/process-flow-diagram.tsx',
  ]
  for (const path of requiredPaths) {
    if (!readIfExists(join(root, path))) {
      addFinding(findings, root, join(root, path), 'missing-v2-4-visual-contract', 'V2-4 requires the shared chart layer, Dashboard presenter, and Process Flow diagram.')
    }
  }

  const chartRoot = join(root, 'src/components/onedayos/charts')
  const chartWrapperSource = existsSync(chartRoot)
    ? readdirSync(chartRoot)
      .filter((entry) => /\.(?:ts|tsx)$/.test(entry))
      .map((entry) => readIfExists(join(chartRoot, entry)) ?? '')
      .join('\n')
    : ''
  for (const forbiddenText of ['fetch(', 'PlatformContext', 'orgId', '@/sdk/server', '@prisma/client']) {
    if (chartWrapperSource.includes(forbiddenText)) {
      addFinding(findings, root, chartRoot, 'chart-wrapper-business-boundary', `The chart wrapper must not own data or tenant concerns: ${forbiddenText}.`)
    }
  }

  const presenterPath = 'src/app/[orgSlug]/inventory/_components/inventory-dashboard-charts.tsx'
  const presenterSource = readIfExists(join(root, presenterPath)) ?? ''
  for (const requiredText of [
    "from 'recharts'",
    'ChartContainer',
    'ChartDataTable',
    'StockHealthChart',
    'MovementTrendChart',
    'WarehouseStockChart',
    'isAnimationActive={false}',
    'var(--chart-positive)',
    'var(--chart-warning)',
    'Unique tracked Products by organization-wide stock status.',
    'Warehouse Stock Positions',
    'Tracked Product positions by Warehouse.',
    'unit="product positions"',
  ]) {
    if (!presenterSource.includes(requiredText)) {
      addFinding(findings, root, join(root, presenterPath), 'incomplete-dashboard-chart-presenter', `Dashboard chart presenter is missing: ${requiredText}.`)
    }
  }
  if (/#[0-9a-f]{3,8}\b/i.test(presenterSource) || presenterSource.includes('fetch(') || presenterSource.includes('orgId')) {
    addFinding(findings, root, join(root, presenterPath), 'unsafe-dashboard-chart-presenter', 'Chart presenters must use semantic tokens and serializable server data without fetching or tenant identity.')
  }
  if (presenterSource.includes('Tracked Products by Warehouse') || presenterSource.includes('unit="products"')) {
    addFinding(
      findings,
      root,
      join(root, presenterPath),
      'ambiguous-dashboard-warehouse-unit',
      'Warehouse analytics must use the explicit Product-position unit rather than implying unique Products.',
    )
  }

  const globalsSource = readIfExists(join(root, 'src/app/globals.css')) ?? ''
  for (const token of ['--chart-primary', '--chart-secondary', '--chart-positive', '--chart-negative', '--chart-warning', '--chart-neutral']) {
    if ((globalsSource.match(new RegExp(`${token}:`, 'g')) ?? []).length < 2) {
      addFinding(findings, root, join(root, 'src/app/globals.css'), 'missing-chart-token', `Chart token must exist in Light and Dark maps: ${token}.`)
    }
  }

  const servicePath = 'src/modules/inventory/service.ts'
  const serviceSource = readIfExists(join(root, servicePath)) ?? ''
  for (const requiredText of [
    'getDashboard(',
    'DASHBOARD_READ',
    'buildMovementTrend',
    'buildDashboardStockSummary',
    'assertDashboardAggregationCapacity',
    'DASHBOARD_AGGREGATION_MAX_CANDIDATES',
    'activeProductWhere(ctx)',
    'activeWarehouseWhere(ctx)',
  ]) {
    if (!serviceSource.includes(requiredText)) {
      addFinding(findings, root, join(root, servicePath), 'incomplete-dashboard-aggregation', `Dashboard aggregation is missing: ${requiredText}.`)
    }
  }
  if (/unstable_cache|cacheTag|cacheLife|revalidateTag/.test(serviceSource)) {
    addFinding(findings, root, join(root, servicePath), 'premature-dashboard-cache', 'Dashboard caching remains blocked until V2-7.')
  }

  const dashboardTestSource = readIfExists(join(root, 'src/modules/inventory/__tests__/dashboard.test.ts')) ?? ''
  for (const requiredText of [
    'stockHealth.reduce',
    'includes both range boundaries',
    'month boundary',
    'year boundary',
    'leap-day boundary',
    'fails safely before returning partial Dashboard data',
  ]) {
    if (!dashboardTestSource.includes(requiredText)) {
      addFinding(findings, root, join(root, 'src/modules/inventory/__tests__/dashboard.test.ts'), 'missing-dashboard-consistency-test', `Dashboard hardening evidence is missing: ${requiredText}.`)
    }
  }

  const resetSource = readIfExists(join(root, 'scripts/reset-sandbox-demo.ts')) ?? ''
  for (const requiredText of [
    'buildCanonicalDemoActivity',
    'tx.stockAdjustment.create',
    'tx.stockMovement.create',
    'occurredAt: activity.occurredAt',
    'code: { notIn: CANONICAL_DEMO_PRODUCTS.map',
  ]) {
    if (!resetSource.includes(requiredText)) {
      addFinding(findings, root, join(root, 'scripts/reset-sandbox-demo.ts'), 'incomplete-canonical-dashboard-activity', `Controlled-demo analytics hardening is missing: ${requiredText}.`)
    }
  }

  const processDefinitionPath = 'src/modules/inventory/process-flow.ts'
  const processDefinition = readIfExists(join(root, processDefinitionPath)) ?? ''
  for (const requiredText of ['connections:', 'plannedSteps:', 'plannedLabel:', "'Receipts'", "'Issues'", "'Transfers'"]) {
    if (!processDefinition.includes(requiredText)) {
      addFinding(findings, root, join(root, processDefinitionPath), 'incomplete-process-flow-v2-definition', `Canonical Process Flow is missing: ${requiredText}.`)
    }
  }

  const processPagePath = 'src/components/onedayos/patterns/process-flow-page.tsx'
  const processPage = readIfExists(join(root, processPagePath)) ?? ''
  const diagramSource = readIfExists(join(root, 'src/components/onedayos/patterns/process-flow-diagram.tsx')) ?? ''
  for (const requiredText of ['ProcessFlowDiagram', 'data-semantic-process-fallback', 'data-planned-workflows']) {
    if (!processPage.includes(requiredText)) {
      addFinding(findings, root, join(root, processPagePath), 'incomplete-process-flow-v2-page', `Process Flow page is missing: ${requiredText}.`)
    }
  }
  for (const requiredText of ['definition.connections', 'aria-hidden="true"', 'data-mobile-layout="vertical"']) {
    if (!diagramSource.includes(requiredText)) {
      addFinding(findings, root, join(root, 'src/components/onedayos/patterns/process-flow-diagram.tsx'), 'incomplete-process-flow-v2-diagram', `Process Flow diagram is missing: ${requiredText}.`)
    }
  }
  if (/reactflow|react-flow|mermaid/i.test(diagramSource + processPage)) {
    addFinding(findings, root, join(root, 'src/components/onedayos/patterns/process-flow-diagram.tsx'), 'forbidden-diagram-engine', 'Process Flow V2 must use semantic HTML, CSS, and local SVG only.')
  }
}

function checkBoundedTableExport(root: string, findings: UxFinding[]) {
  const prompt43 = readIfExists(join(root, 'docs/engineering-manual/prompts/CODEX_PROMPT_43_V2_5_BOUNDED_TABLE_EXPORT.md'))
  if (!prompt43) return

  const packageSource = readIfExists(join(root, 'package.json')) ?? ''
  let packageJson: {
    dependencies?: Record<string, string>
    overrides?: Record<string, unknown>
  } = {}
  try {
    packageJson = JSON.parse(packageSource)
  } catch {
    return
  }
  if (packageJson.dependencies?.exceljs !== '4.4.0') {
    addFinding(findings, root, join(root, 'package.json'), 'invalid-exceljs-version', 'V2-5 requires exact exceljs@4.4.0.')
  }
  const excelOverride = packageJson.overrides?.exceljs as { uuid?: string } | undefined
  if (excelOverride?.uuid !== '11.1.1') {
    addFinding(findings, root, join(root, 'package.json'), 'missing-exceljs-uuid-override', 'ExcelJS must use only the scoped uuid@11.1.1 override.')
  }
  if (packageJson.overrides?.uuid) {
    addFinding(findings, root, join(root, 'package.json'), 'global-uuid-override', 'V2-5 forbids a global UUID override.')
  }

  for (const path of [
    'src/platform/table-export/schema.ts',
    'src/platform/table-export/spreadsheet-safety.ts',
    'src/platform/table-export/csv-exporter.ts',
    'src/platform/table-export/xlsx-exporter.ts',
    'src/platform/table-export/resources.ts',
    'src/platform/table-export/__tests__/table-export.test.ts',
  ]) {
    if (!readIfExists(join(root, path))) {
      addFinding(findings, root, join(root, path), 'missing-bounded-export-contract', `V2-5 requires ${path}.`)
    }
  }

  const xlsxSource = readIfExists(join(root, 'src/platform/table-export/xlsx-exporter.ts')) ?? ''
  if (!xlsxSource.includes("import 'server-only'") || !xlsxSource.includes("from 'exceljs'")) {
    addFinding(findings, root, join(root, 'src/platform/table-export/xlsx-exporter.ts'), 'unsafe-exceljs-boundary', 'ExcelJS must remain behind the server-only XLSX adapter.')
  }
  const tableSource = readIfExists(join(root, 'src/components/onedayos/data-table/data-table-v2.tsx')) ?? ''
  if (tableSource.includes("from 'exceljs'") || tableSource.includes("require('exceljs')")) {
    addFinding(findings, root, join(root, 'src/components/onedayos/data-table/data-table-v2.tsx'), 'client-side-exceljs', 'Client components must not import ExcelJS.')
  }
  const schemaSource = readIfExists(join(root, 'src/platform/table-export/schema.ts')) ?? ''
  for (const requiredText of ['MAX_FILTERED_EXPORT_ROWS = 10_000', 'MAX_SELECTED_EXPORT_IDS = 1_000']) {
    if (!schemaSource.includes(requiredText)) {
      addFinding(findings, root, join(root, 'src/platform/table-export/schema.ts'), 'missing-export-limit', `V2-5 requires ${requiredText}.`)
    }
  }
  const demoSource = readIfExists(join(root, 'scripts/demo-ops.ts')) ?? ''
  if (demoSource.includes('STOCK_LEVEL_EXPORT') || demoSource.includes("action: 'export'")) {
    addFinding(findings, root, join(root, 'scripts/demo-ops.ts'), 'warehouse-export-grant', 'Warehouse Operator must not receive export permission.')
  }
}

function checkRouteModalV2(root: string, findings: UxFinding[]) {
  const packageSource = readIfExists(join(root, 'package.json')) ?? ''
  if (!packageSource.includes('"@radix-ui/react-dialog"')) return

  const requiredPaths = [
    'src/components/onedayos/modal/route-modal.tsx',
    'src/app/[orgSlug]/@modal/default.tsx',
    'src/app/[orgSlug]/@modal/(.)inventory/stock-adjustments/new/page.tsx',
    'src/app/[orgSlug]/@modal/(.)inventory/stock-levels/[id]/page.tsx',
    'src/app/[orgSlug]/@modal/(.)inventory/stock-movements/[id]/page.tsx',
    'src/app/[orgSlug]/@modal/(.)inventory/stock-adjustments/[id]/page.tsx',
    'src/app/[orgSlug]/@modal/(.)records/[area]/[id]/page.tsx',
    'src/app/[orgSlug]/@modal/(.)records/[area]/[id]/edit/page.tsx',
    'src/app/[orgSlug]/@modal/(.)records/[area]/new/page.tsx',
  ]
  for (const path of requiredPaths) {
    if (!readIfExists(join(root, path))) {
      addFinding(findings, root, join(root, path), 'missing-route-modal-contract', 'V2-3 requires the approved modal primitive, slot, and intercepted targets.')
    }
  }

  const modalSource = readIfExists(join(root, requiredPaths[0])) ?? ''
  for (const requiredText of ['@radix-ui/react-dialog', 'Dialog.Title', 'Dialog.Description', 'requestClose', 'markDirty', 'beforeunload', 'popstate']) {
    if (!modalSource.includes(requiredText)) {
      addFinding(findings, root, join(root, requiredPaths[0]), 'incomplete-route-modal-contract', `Route modal is missing: ${requiredText}.`)
    }
  }

  const defaultSource = readIfExists(join(root, requiredPaths[1])) ?? ''
  if (!defaultSource.includes('return null')) {
    addFinding(findings, root, join(root, requiredPaths[1]), 'invalid-modal-slot-default', 'The unmatched modal slot must return null.')
  }

  for (const path of requiredPaths.slice(2)) {
    const source = readIfExists(join(root, path)) ?? ''
    if (!source.includes('Presenter') || /InventoryService|ProductService|CustomerService|SupplierService|WarehouseService/.test(source)) {
      addFinding(findings, root, join(root, path), 'duplicated-modal-business-logic', 'Intercept routes must reuse canonical presenters without direct business services.')
    }
  }
}

function checkRouteSource(root: string, moduleId: string, findings: UxFinding[]) {
  const routeRoot = join(root, 'src/app/[orgSlug]', moduleId)

  for (const file of listFiles(routeRoot)) {
    const source = readFileSync(file, 'utf8')
    const normalized = rel(root, file)

    if (source.includes('Loading...')) {
      addFinding(findings, root, file, 'generic-loading-text', 'Use contextual loading skeletons instead of final plain Loading... text.')
    }

    if (/(>\s*Error\s*<)|(['"`]Error['"`])/.test(source) && !source.includes('ErrorState')) {
      addFinding(findings, root, file, 'generic-error-text', 'Use safe contextual error states instead of final plain Error text.')
    }

    if (/fake\s+(?:dashboard\s+)?metrics|placeholder\s+(?:metric|dashboard)|TODO\(metric\)|Coming soon metric/i.test(source)) {
      addFinding(findings, root, file, 'fake-dashboard-metric', 'Official module dashboards must not include fake metric placeholders.')
    }

    if (/<input[^>]+name\s*=\s*(?:["']orgId["']|\{["']orgId["']\})/.test(source)) {
      addFinding(findings, root, file, 'hidden-org-id-field', 'UX surfaces must not submit tenant identity fields.')
    }

    if (/^\s*['"]use client['"]/.test(source)) {
      for (const [rule, pattern, detail] of [
        ['client-server-sdk-import', /from\s+['"]@\/sdk\/server['"]/, 'Client UX files must not import @/sdk/server.'],
        ['client-kernel-import', /from\s+['"]@\/kernel\//, 'Client UX files must not import Kernel internals.'],
        ['client-raw-prisma-import', /from\s+['"]@prisma\/client['"]|from\s+['"]@\/kernel\/db/, 'Client UX files must not import raw Prisma.'],
        ['client-org-id-json', /JSON\.stringify\s*\(\s*\{[\s\S]{0,400}\borgId\s*:/, 'Client UX files must not submit orgId JSON.'],
      ] as const) {
        if (pattern.test(source)) {
          addFinding(findings, root, file, rule, detail)
        }
      }
    }

    if (/<nav[\s\S]{0,240}aria-label\s*=\s*["'][^"']*(?:section|module navigation)[^"']*["']/i.test(source)) {
      addFinding(
        findings,
        root,
        file,
        'duplicate-module-content-navbar',
        `Official module route ${normalized} appears to define a content navbar instead of relying on the app shell.`,
      )
    }

    if (source.includes('Shared Products')) {
      addFinding(
        findings,
        root,
        file,
        'old-shared-products-peer-nav',
        'Use related shared record links, not a retired Shared Products peer navigation tab.',
      )
    }
  }
}

function checkSharedPatternSources(root: string, findings: UxFinding[]) {
  const patternRoot = join(root, 'src/components/onedayos/patterns')
  const globalsSource = readIfExists(join(root, 'src/app/globals.css'))
  const buttonSource = readIfExists(join(root, 'src/components/ui/button.tsx'))
  const appShellSource = readIfExists(join(root, 'src/components/onedayos/app-shell.tsx'))

  if (globalsSource) {
    for (const token of [
      '--color-brand',
      '--color-primary',
      '--color-primary-foreground',
      '--color-accent',
      '--color-accent-foreground',
      '--color-sidebar-background',
      '--color-popover-background',
      '--color-destructive',
      '--color-success',
      '--color-warning',
      '--color-information',
      '--color-focus-ring',
      '--radius-small',
      '--radius-medium',
      '--radius-large',
    ]) {
      if (!globalsSource.includes(token)) {
        addFinding(findings, root, join(root, 'src/app/globals.css'), 'missing-compact-preset-token', `OneDayOS Compact token is missing: ${token}.`)
      }
    }

    if (!/--color-brand\s*:\s*#F97316\b/.test(globalsSource)) {
      addFinding(findings, root, join(root, 'src/app/globals.css'), 'brand-token-drift', 'OneDayOS brand token must remain #F97316.')
    }

    if (/--color-accent\s*:\s*#F97316\b/i.test(globalsSource)) {
      addFinding(findings, root, join(root, 'src/app/globals.css'), 'orange-accent-token', 'Generic accent must remain neutral and must not equal brand orange.')
    }

    if (/--font-sans\s*:[^;]*\bInter\b/.test(globalsSource)) {
      addFinding(findings, root, join(root, 'src/app/globals.css'), 'stale-inter-font', 'OneDayOS Compact uses a system UI font stack, not an unloaded Inter-first declaration.')
    }
  }

  if (buttonSource) {
    if (/#F97316|f97316/.test(buttonSource)) {
      addFinding(findings, root, join(root, 'src/components/ui/button.tsx'), 'raw-orange-button', 'Button must use semantic primary/brand tokens, not hardcoded orange.')
    }

    for (const variant of ['primary', 'secondary', 'outline', 'ghost', 'destructive', 'link']) {
      if (!buttonSource.includes(variant)) {
        addFinding(findings, root, join(root, 'src/components/ui/button.tsx'), 'missing-button-variant', `Shared Button variant is missing: ${variant}.`)
      }
    }
  }

  for (const file of listFiles(patternRoot)) {
    const source = readFileSync(file, 'utf8')

    if (/^\s*['"]use client['"]/.test(source)) {
      if (/from\s+['"]@\/sdk\/server['"]|from\s+['"]@\/kernel\/|from\s+['"]@prisma\/client['"]/.test(source)) {
        addFinding(
          findings,
          root,
          file,
          'server-import-in-page-pattern',
          'Shared UX page-pattern client files must not import server-only paths.',
        )
      }
    }
  }

  if (appShellSource) {
    if (!/aria-label\s*=\s*["']Switch apps["']/.test(appShellSource)) {
      addFinding(
        findings,
        root,
        join(root, 'src/components/onedayos/app-shell.tsx'),
        'app-switcher-accessible-name',
        'The app switcher button must expose an accessible name.',
      )
    }

    if (!/aria-label\s*=\s*["']Open profile menu["']/.test(appShellSource)) {
      addFinding(
        findings,
        root,
        join(root, 'src/components/onedayos/app-shell.tsx'),
        'profile-menu-accessible-name',
        'The profile menu button must expose an accessible name.',
      )
    }

    if (appShellSource.includes('Apps >') || appShellSource.includes('CURRENT APP')) {
      addFinding(
        findings,
        root,
        join(root, 'src/components/onedayos/app-shell.tsx'),
        'retired-app-switcher-label',
        'The app switcher must use compact icon affordance, not retired CURRENT APP or Apps > labels.',
      )
    }

    if (!/from\s+['"]lucide-react['"]/.test(appShellSource)) {
      addFinding(
        findings,
        root,
        join(root, 'src/components/onedayos/app-shell.tsx'),
        'missing-lucide-shell-icons',
        'OneDayOS Compact uses Lucide for shared chrome icons.',
      )
    }
  }

  const activeSourceFiles = [
    ...listFiles(join(root, 'src/app')),
    ...listFiles(join(root, 'src/components')),
    ...listFiles(join(root, 'src/modules')),
  ]

  for (const file of activeSourceFiles) {
    const source = readFileSync(file, 'utf8')

    if (/from\s+['"](?:react-icons|@heroicons\/react(?:\/[^'"]*)?|@mui\/icons-material(?:\/[^'"]*)?)['"]/.test(source)) {
      addFinding(findings, root, file, 'mixed-icon-library', 'OneDayOS Compact permits Lucide only for active source icons.')
    }

    if (file !== join(root, 'src/app/globals.css') && /#F97316|f97316/.test(source)) {
      addFinding(findings, root, file, 'raw-orange-outside-tokens', 'Brand orange must be referenced through tokens outside globals.css.')
    }
  }
}

function checkRuntimeAppearance(root: string, findings: UxFinding[]) {
  for (const requiredPath of REQUIRED_RUNTIME_APPEARANCE_DOCS) {
    checkRequiredFile(
      findings,
      root,
      join(root, requiredPath),
      'missing-runtime-appearance-document',
      'Runtime Appearance must be governed by ADR-0013, a frozen spec, and an implementation note.',
    )
  }

  const providerPath = existsSync(join(root, 'src/components/onedayos/appearance-provider.tsx'))
    ? join(root, 'src/components/onedayos/appearance-provider.tsx')
    : join(root, 'src/components/onedayos/theme-provider.tsx')
  const providerSource = readIfExists(providerPath)
  const scriptPath = join(root, 'src/components/onedayos/theme-script.ts')
  const scriptSource = readIfExists(scriptPath)
  const appShellPath = join(root, 'src/components/onedayos/app-shell.tsx')
  const appShellSource = readIfExists(appShellPath)
  const packageSource = readIfExists(join(root, 'package.json'))
  const prismaSource = readIfExists(join(root, 'prisma/schema.prisma'))

  if (!providerSource) {
    addFinding(
      findings,
      root,
      providerPath,
      'missing-runtime-appearance-provider',
      'Runtime Appearance requires a local client provider.',
    )
  }

  if (!scriptSource) {
    addFinding(
      findings,
      root,
      scriptPath,
      'missing-runtime-appearance-script',
      'Runtime Appearance requires a pre-hydration bootstrap script.',
    )
  }

  const combinedAppearanceSource = `${providerSource ?? ''}\n${scriptSource ?? ''}`

  if (!combinedAppearanceSource.includes('onedayos.appearance')) {
    addFinding(
      findings,
      root,
      scriptPath,
      'unstable-appearance-storage-key',
      'Runtime Appearance must use the approved browser-local key onedayos.appearance.',
    )
  }

  for (const value of ['light', 'dark', 'system']) {
    if (!combinedAppearanceSource.includes(`'${value}'`) && !combinedAppearanceSource.includes(`"${value}"`)) {
      addFinding(
        findings,
        root,
        providerPath,
        'missing-appearance-value',
        `Runtime Appearance value is missing: ${value}.`,
      )
    }
  }

  for (const requiredDomPart of ['data-appearance', 'data-resolved-appearance', 'colorScheme']) {
    if (!combinedAppearanceSource.includes(requiredDomPart)) {
      addFinding(
        findings,
        root,
        scriptPath,
        'missing-appearance-dom-contract',
        `Runtime Appearance DOM contract is missing: ${requiredDomPart}.`,
      )
    }
  }

  if (/orgId|organizationId|tenantId/.test(combinedAppearanceSource)) {
    addFinding(
      findings,
      root,
      providerPath,
      'tenant-coupled-appearance',
      'Runtime Appearance must remain browser-local and must not read or submit tenant identity.',
    )
  }

  if (appShellSource) {
    if (!appShellSource.includes('Appearance') || !appShellSource.includes('Light') || !appShellSource.includes('Dark') || !appShellSource.includes('System')) {
      addFinding(
        findings,
        root,
        appShellPath,
        'missing-profile-appearance-menu',
        'The profile menu must expose Appearance choices for Light, Dark, and System.',
      )
    }
  }

  if (packageSource && /"next-themes"\s*:/.test(packageSource)) {
    addFinding(
      findings,
      root,
      join(root, 'package.json'),
      'next-themes-runtime-dependency',
      'The approved Runtime Appearance implementation uses the local provider; next-themes must not be added.',
    )
  }

  if (prismaSource && /\b(?:appearancePreference|themePreference|appearanceMode|themeMode)\b/.test(prismaSource)) {
    addFinding(
      findings,
      root,
      join(root, 'prisma/schema.prisma'),
      'appearance-persisted-in-database',
      'Runtime Appearance is a browser-local preference and must not add Prisma fields or models.',
    )
  }

  for (const forbiddenPath of [
    'src/themes',
    'src/client-themes',
    'src/app/themes',
    'src/app/client-themes',
  ]) {
    if (existsSync(join(root, forbiddenPath))) {
      addFinding(
        findings,
        root,
        join(root, forbiddenPath),
        'custom-client-theme-directory',
        'Organization/client CSS themes remain deferred and must not be added.',
      )
    }
  }
}

function checkPlatformRouteSources(root: string, findings: UxFinding[]) {
  for (const routeRoot of [join(root, 'src/app/[orgSlug]/organization'), join(root, 'src/app/[orgSlug]/records')]) {
    for (const file of listFiles(routeRoot)) {
      const source = readFileSync(file, 'utf8')

      if (source.includes('Loading...')) {
        addFinding(findings, root, file, 'generic-platform-loading-text', 'Organization and Records routes must use contextual loading states.')
      }

      if (/(>\s*Error\s*<)|(['"`]Error['"`])/.test(source) && !source.includes('ErrorState') && !source.includes('SafePageErrorState')) {
        addFinding(findings, root, file, 'generic-platform-error-text', 'Organization and Records routes must use safe contextual error states.')
      }

      if (/<input[^>]+name\s*=\s*(?:["']orgId["']|\{["']orgId["']\})/.test(source)) {
        addFinding(findings, root, file, 'platform-hidden-org-id-field', 'Organization and Records UX surfaces must not submit tenant identity fields.')
      }

      if (/<nav[\s\S]{0,240}aria-label\s*=\s*["'][^"']*(?:section|module navigation)[^"']*["']/i.test(source)) {
        addFinding(
          findings,
          root,
          file,
          'duplicate-platform-content-navbar',
          'Organization and Records routes must rely on the app shell and shared page headers, not duplicate content navbars.',
        )
      }
    }
  }
}

function requireSourceIncludes(
  findings: UxFinding[],
  root: string,
  path: string,
  expected: string,
  rule: string,
  detail: string,
) {
  const source = readIfExists(join(root, path))

  if (!source) {
    addFinding(findings, root, join(root, path), rule, detail)
    return
  }

  if (!source.includes(expected)) {
    addFinding(findings, root, join(root, path), rule, detail)
  }
}

function checkPlatformSurfaceUx(root: string, findings: UxFinding[]) {
  for (const requiredPath of REQUIRED_PLATFORM_UX_DOCS) {
    checkRequiredFile(
      findings,
      root,
      join(root, requiredPath),
      'missing-platform-ux-conformance-document',
      'Organization and Shared Records UX conformance evidence must be recorded.',
    )
  }

  const organizationConformance = readIfExists(join(root, 'src/platform/organization/UX-CONFORMANCE.md'))
  const recordsConformance = readIfExists(join(root, 'src/business-objects/UX-CONFORMANCE.md'))

  if (organizationConformance) {
    for (const requiredText of ['Implementation Conformance Complete', 'Independent Org Admin Validation Pending']) {
      if (!organizationConformance.includes(requiredText)) {
        addFinding(
          findings,
          root,
          join(root, 'src/platform/organization/UX-CONFORMANCE.md'),
          'incomplete-organization-ux-conformance',
          `Organization UX conformance status is missing: ${requiredText}.`,
        )
      }
    }
  }

  if (recordsConformance) {
    for (const requiredText of ['Implementation Conformance Complete', 'Representative-User Validation Pending']) {
      if (!recordsConformance.includes(requiredText)) {
        addFinding(
          findings,
          root,
          join(root, 'src/business-objects/UX-CONFORMANCE.md'),
          'incomplete-records-ux-conformance',
          `Shared Records UX conformance status is missing: ${requiredText}.`,
        )
      }
    }
  }

  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/organization/page.tsx',
    'AppPage',
    'organization-landing-pattern',
    'Organization landing must use AppPage.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/organization/people/page.tsx',
    'ListPage',
    'organization-people-pattern',
    'Organization People must use ListPage.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/organization/branches-departments/page.tsx',
    'ListPage',
    'organization-branches-pattern',
    'Organization Branches & Departments must use ListPage.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/organization/settings/page.tsx',
    'SettingsPage',
    'organization-settings-pattern',
    'Organization Settings must use SettingsPage.',
  )

  for (const path of [
    'src/app/[orgSlug]/organization/page.tsx',
    'src/app/[orgSlug]/organization/people/page.tsx',
    'src/app/[orgSlug]/organization/branches-departments/page.tsx',
    'src/app/[orgSlug]/organization/settings/page.tsx',
  ]) {
    requireSourceIncludes(
      findings,
      root,
      path,
      'requireOrganizationAdmin(ctx)',
      'organization-admin-enforcement',
      'Organization routes must require Org Admin access.',
    )
  }

  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/records/page.tsx',
    'AppPage',
    'records-landing-pattern',
    'Shared Records landing must use AppPage.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/records/_components/records-list-page.tsx',
    '<ListPage',
    'records-list-pattern',
    'Shared Records list wrapper must use ListPage.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/records/_components/records-form-page.tsx',
    '<FormPage',
    'records-form-pattern',
    'Shared Records form wrapper must use FormPage.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/records/page.tsx',
    "area.id === 'employees'",
    'records-landing-promotes-people',
    'Records landing should not promote Employees beside shared Inventory-supporting records.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/records/page.tsx',
    'sdk.permissions.can',
    'records-landing-permission-awareness',
    'Shared Records landing must filter areas through existing permissions.',
  )

  const recordsConfigPath = join(root, 'src/app/[orgSlug]/records/_components/records-config.ts')
  const recordsConfigSource = readIfExists(recordsConfigPath)

  if (recordsConfigSource) {
    for (const requiredText of [
      'Shared product/SKU identity used by Inventory and future modules.',
      'Shared product classification used across product-based workflows.',
      'Shared customer identity used by CRM and future customer-facing workflows. CRM is not implemented in this MVP.',
      'Shared supplier identity used by Inventory, Purchasing, and future procurement workflows. Purchasing is not implemented in this MVP.',
      'Shared warehouse/location identity used by Inventory and future stock workflows.',
    ]) {
      if (!recordsConfigSource.includes(requiredText)) {
        addFinding(
          findings,
          root,
          recordsConfigPath,
          'shared-record-ownership-wording',
          `Shared Records wording is missing: ${requiredText}.`,
        )
      }
    }
  }

  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/apps/app-launcher.tsx',
    'Shared Records',
    'missing-shared-records-app',
    'Shared Records must be available as a built-in app.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/components/onedayos/page-header.tsx',
    "export type PageHeaderMode = 'compact' | 'explanatory'",
    'missing-page-header-modes',
    'The page header must expose compact and explanatory modes.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/components/onedayos/patterns/process-flow-page.tsx',
    'headerMode="explanatory"',
    'process-flow-header-mode',
    'Process Flow must preserve the explanatory header.',
  )

  const navigationSource = readIfExists(join(root, 'src/platform/navigation/tenant-navigation.ts'))
  if (navigationSource) {
    if (!/id:\s*['"]shared-records['"]\s+as\s+const/.test(navigationSource) || !navigationSource.includes('allSharedRecords.length > 0')) {
      addFinding(
        findings,
        root,
        join(root, 'src/platform/navigation/tenant-navigation.ts'),
        'invalid-shared-records-app',
        'Shared Records must be a permission-derived built-in app.',
      )
    }

    if (/\bOrgModule\b[\s\S]{0,240}\borganization\b|\borganization[\s\S]{0,120}\bOrgModule\b/.test(navigationSource)) {
      addFinding(
        findings,
        root,
        join(root, 'src/platform/navigation/tenant-navigation.ts'),
        'organization-controlled-by-module-enablements',
        'Organization is a built-in admin app and must not be controlled by OrgModule enablement.',
      )
    }

    const relatedRecordsMatch = navigationSource.match(/const relatedInventoryRecords = \[([\s\S]*?)\]\.filter/)
    const relatedRecordsSource = relatedRecordsMatch?.[1] ?? ''

    if (/Employees|People/.test(relatedRecordsSource) || !/Customers/.test(relatedRecordsSource)) {
      addFinding(
        findings,
        root,
        join(root, 'src/platform/navigation/tenant-navigation.ts'),
        'inventory-sidebar-platform-record-leak',
        'Inventory Related Records must include Customers and exclude People and Employees.',
      )
    }

    if (!relatedRecordsSource.includes('/inventory/related/')) {
      addFinding(
        findings,
        root,
        join(root, 'src/platform/navigation/tenant-navigation.ts'),
        'inventory-related-record-context-loss',
        'Inventory Related Records links must use Inventory-context routes.',
      )
    }

    if (navigationSource.includes('inventory-product-settings')) {
      addFinding(
        findings,
        root,
        join(root, 'src/platform/navigation/tenant-navigation.ts'),
        'product-settings-top-level-navigation',
        'Product Settings must not remain in top-level Inventory navigation.',
      )
    }
  }

  requireSourceIncludes(
    findings,
    root,
    'src/components/onedayos/app-shell.tsx',
    "return 'shared-records'",
    'records-current-app-context',
    'Direct Records routes must resolve the Shared Records app context.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/inventory/product-settings/page.tsx',
    'Inventory Tracking Settings',
    'missing-product-settings-compatibility',
    'Inventory tracking settings must remain available through the compatibility surface.',
  )

  const moduleNavigationSource = readIfExists(join(root, 'src/modules/inventory/navigation.ts'))
  if (moduleNavigationSource?.includes('inventory.product-settings')) {
    addFinding(
      findings,
      root,
      join(root, 'src/modules/inventory/navigation.ts'),
      'product-settings-module-navigation',
      'Product Settings must be removed from Inventory module navigation metadata.',
    )
  }

  const v21Note = readIfExists(join(root, 'docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-1-compact-header-shared-records-ia.md'))
  if (v21Note && !v21Note.includes('website asset production remains paused')) {
    addFinding(
      findings,
      root,
      join(root, 'docs/engineering-manual/16-client-delivery/IMPLEMENTATION-NOTE-v2-1-compact-header-shared-records-ia.md'),
      'website-asset-pause-missing',
      'V2-1 must preserve the website asset production pause.',
    )
  }

  checkPlatformRouteSources(root, findings)
}

function checkRoleBasedUxValidationPreparation(root: string, findings: UxFinding[]) {
  for (const requiredPath of REQUIRED_ROLE_BASED_UX_VALIDATION_DOCS) {
    checkRequiredFile(
      findings,
      root,
      join(root, requiredPath),
      'missing-role-based-ux-validation-artifact',
      'Role-based UX validation preparation requires Founder guides, review templates, findings log, and implementation note.',
    )
  }

  const guidePath = join(root, 'docs/demo/ROLE-BASED-UX-VALIDATION-GUIDE.md')
  const guideSource = readIfExists(guidePath)

  if (guideSource) {
    for (const requiredText of [
      'Org Admin',
      'Warehouse User',
      'This guide does not claim representative-user validation has occurred.',
      'Inventory only',
      'Organization app must not appear',
      'Manual Accessibility Checklist',
    ]) {
      if (!guideSource.includes(requiredText)) {
        addFinding(
          findings,
          root,
          guidePath,
          'incomplete-role-based-ux-validation-guide',
          `Role-based validation guide is missing: ${requiredText}.`,
        )
      }
    }
  }

  for (const path of [
    'src/modules/inventory/UX-CONFORMANCE.md',
    'src/platform/organization/UX-CONFORMANCE.md',
    'src/business-objects/UX-CONFORMANCE.md',
  ]) {
    const source = readIfExists(join(root, path))

    if (!source) continue

    if (!source.includes('Role-Based UX Validation Preparation Complete')) {
      addFinding(
        findings,
        root,
        join(root, path),
        'missing-role-based-ux-prep-status',
        'UX conformance docs must record that role-based validation artifacts were prepared.',
      )
    }

    if (
      /Representative-User Validation Complete|Independent Org Admin Validation Complete|Formal Accessibility Review Complete|Public Demo Approval:\s*Approved|Public Website Demo Approved/i.test(
        source,
      )
    ) {
      addFinding(
        findings,
        root,
        join(root, path),
        'premature-human-validation-claim',
        'UX conformance docs must not claim human validation, formal accessibility completion, or public demo approval.',
      )
    }
  }

  const provisionPath = join(root, 'scripts/provision-sandbox-demo.ts')
  const demoOpsPath = join(root, 'scripts/demo-ops.ts')
  const provisionSource = readIfExists(provisionPath)
  const demoOpsSource = readIfExists(demoOpsPath) ?? ''

  if (provisionSource) {
    const combinedProvisionSource = `${provisionSource}\n${demoOpsSource}`

    for (const requiredText of [
      'ONEDAYOS_DEMO_WAREHOUSE_EMAIL',
      'ONEDAYOS_DEMO_WAREHOUSE_PASSWORD',
      'ONEDAYOS_DEMO_WAREHOUSE_NAME',
      'WAREHOUSE_OPERATOR_ROLE_NAME',
      'WAREHOUSE_OPERATOR_PERMISSION_PROFILE',
      'staleWarehousePermissionIds',
    ]) {
      if (!combinedProvisionSource.includes(requiredText)) {
        addFinding(
          findings,
          root,
          provisionPath,
          'incomplete-warehouse-persona-provisioning',
          `Sandbox provisioner is missing Warehouse Operator support: ${requiredText}.`,
        )
      }
    }

    const profileSource = combinedProvisionSource.match(/const WAREHOUSE_OPERATOR_PERMISSION_PROFILE = \[([\s\S]*?)\] as const/)?.[1] ?? ''

    for (const forbidden of [
      'PRODUCT_SETTING_UPDATE',
      'EMPLOYEE_PERMISSIONS',
      'CUSTOMER_PERMISSIONS',
      "module: '*'",
      "resource: '*'",
      "action: '*'",
      "resource: 'organization'",
    ]) {
      if (profileSource.includes(forbidden)) {
        addFinding(
          findings,
          root,
          provisionPath,
          'overprivileged-warehouse-persona',
          `Warehouse Operator profile must not include: ${forbidden}.`,
        )
      }
    }
  }
}

function checkControlledDemoPreparation(root: string, findings: UxFinding[]) {
  for (const requiredPath of REQUIRED_CONTROLLED_DEMO_DOCS) {
    checkRequiredFile(
      findings,
      root,
      join(root, requiredPath),
      'missing-controlled-demo-artifact',
      'Controlled demo preparation requires runbook, storyboard, readiness checklist, limitations, sample asset plan, and implementation note.',
    )
  }

  const packageSource = readIfExists(join(root, 'package.json')) ?? ''
  const envExampleSource = readIfExists(join(root, '.env.example')) ?? ''
  const registerRouteSource = readIfExists(join(root, 'src/app/api/kernel/auth/register/route.ts')) ?? ''
  const registerPageSource = readIfExists(join(root, 'src/app/register/page.tsx')) ?? ''
  const loginPageSource = readIfExists(join(root, 'src/app/login/page.tsx')) ?? ''
  const layoutSource = readIfExists(join(root, 'src/app/layout.tsx')) ?? ''
  const robotsSource = readIfExists(join(root, 'src/app/robots.ts')) ?? ''
  const resetSource = readIfExists(join(root, 'scripts/reset-sandbox-demo.ts')) ?? ''
  const readinessSource = readIfExists(join(root, 'scripts/check-demo-readiness.ts')) ?? ''

  for (const [scriptName, expected] of [
    ['demo:check', '"demo:check"'],
    ['demo:reset', '"demo:reset"'],
    ['check:all', '"check:all"'],
  ] as const) {
    if (!packageSource.includes(expected)) {
      addFinding(
        findings,
        root,
        join(root, 'package.json'),
        'missing-controlled-demo-script',
        `Controlled demo script is missing from package.json: ${scriptName}.`,
      )
    }
  }

  for (const requiredText of [
    'ONEDAYOS_DEMO_MODE=false',
    'ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=true',
    'ONEDAYOS_DEMO_RESET_APPROVED=false',
  ]) {
    if (!envExampleSource.includes(requiredText)) {
      addFinding(
        findings,
        root,
        join(root, '.env.example'),
        'missing-controlled-demo-env-example',
        `Controlled demo env example is missing: ${requiredText}.`,
      )
    }
  }

  for (const [path, source, requiredText, rule, detail] of [
    ['src/app/api/kernel/auth/register/route.ts', registerRouteSource, 'registrationDisabled', 'missing-registration-disabled-api', 'Controlled demo mode must disable registration before account creation.'],
    ['src/app/register/page.tsx', registerPageSource, 'Registration is currently invite-only.', 'missing-invite-only-register-page', 'Register page must show an invite-only controlled-demo state.'],
    ['src/app/login/page.tsx', loginPageSource, 'publicRegistrationEnabled', 'missing-login-registration-gating', 'Login page must hide registration links when registration is disabled.'],
    ['src/app/layout.tsx', layoutSource, 'index: false', 'missing-demo-noindex', 'Demo mode must noindex app metadata.'],
    ['src/app/robots.ts', robotsSource, "disallow: '/'", 'missing-demo-robots-disallow', 'Demo mode robots must disallow crawling.'],
    ['scripts/check-demo-readiness.ts', readinessSource, 'Public self-service demo approval is not implied.', 'missing-demo-readiness-disclaimer', 'Readiness checker must not imply public self-service demo approval.'],
    ['scripts/reset-sandbox-demo.ts', resetSource, 'ONEDAYOS_DEMO_RESET_APPROVED', 'missing-demo-reset-approval-guard', 'Reset script must require explicit demo reset approval.'],
  ] as const) {
    if (!source.includes(requiredText)) {
      addFinding(findings, root, join(root, path), rule, detail)
    }
  }

  for (const requiredText of ['ONEDAYOS_DEMO_MODE', 'ONEDAYOS_SANDBOX_DB_APPROVED', 'ONEDAYOS_DEMO_ORG_SLUG']) {
    if (!resetSource.includes(requiredText)) {
      addFinding(
        findings,
        root,
        join(root, 'scripts/reset-sandbox-demo.ts'),
        'incomplete-demo-reset-guard',
        `Reset script guard is missing: ${requiredText}.`,
      )
    }
  }

  if (/process\.argv\.slice\(2\)\[0\]|tx\.organization\.delete|tx\.user\.delete|tx\.role\.delete|tx\.permission\.delete/.test(resetSource)) {
    addFinding(
      findings,
      root,
      join(root, 'scripts/reset-sandbox-demo.ts'),
      'unsafe-demo-reset-scope',
      'Demo reset must not accept arbitrary org arguments or delete foundation identity/permission records.',
    )
  }

  for (const reviewPath of [
    'docs/demo/reviews/FOUNDER-ORG-ADMIN-UX-REVIEW.md',
    'docs/demo/reviews/FOUNDER-WAREHOUSE-PROXY-UX-REVIEW.md',
  ]) {
    const reviewSource = readIfExists(join(root, reviewPath))
    if (!reviewSource) continue

    for (const requiredText of ['Status: Completed', 'Score: Not scored', 'Must-Fix findings: None reported', 'Blocker findings: None reported']) {
      if (!reviewSource.includes(requiredText)) {
        addFinding(
          findings,
          root,
          join(root, reviewPath),
          'incomplete-founder-controlled-review-record',
          `Founder controlled review record is missing: ${requiredText}.`,
        )
      }
    }

    if (/Representative-User Validation Complete|Independent Org Admin Validation Complete|Public Demo Approval:\s*Approved|WCAG Conformance:\s*Complete/i.test(reviewSource)) {
      addFinding(
        findings,
        root,
        join(root, reviewPath),
        'premature-controlled-demo-validation-claim',
        'Founder proxy walkthrough records must not claim independent validation, public demo approval, or formal WCAG conformance.',
      )
    }
  }
}

export function checkUx(root: string): UxFinding[] {
  const findings: UxFinding[] = []
  const modules = discoverOfficialModules(root)

  if (modules.length === 0) {
    addFinding(
      findings,
      root,
      join(root, 'src/modules/index.ts'),
      'missing-official-modules',
      'No official modules were discovered from the static module composition root.',
    )
    return findings
  }

  for (const moduleId of modules) {
    checkOfficialModuleContract(root, moduleId, findings)
    checkRouteSource(root, moduleId, findings)
  }

  checkSharedPatternSources(root, findings)
  checkDataTableV2(root, findings)
  checkRouteModalV2(root, findings)
  checkDashboardChartsV2(root, findings)
  checkBoundedTableExport(root, findings)
  checkRuntimeAppearance(root, findings)
  checkPlatformSurfaceUx(root, findings)
  checkRoleBasedUxValidationPreparation(root, findings)
  checkControlledDemoPreparation(root, findings)

  if (existsSync(join(root, 'src/modules/inventory/transactions'))) {
    const navigationPath = join(root, 'src/modules/inventory/navigation.ts')
    const navigationSource = readIfExists(navigationPath) ?? ''
    if (navigationSource.includes('/inventory/transactions')) {
      addFinding(
        findings,
        root,
        navigationPath,
        'premature-inventory-v2-navigation',
        'V2-6C must not expose transaction navigation before V2-6D cutover.',
      )
    }
  }

  return findings
}

function main() {
  const root = process.cwd()
  const findings = checkUx(root)

  if (findings.length > 0) {
    console.error('UX check failed:')
    for (const finding of findings) {
      console.error(`- ${finding.file}: ${finding.rule} — ${finding.detail}`)
    }
    process.exit(1)
  }

  const modules = discoverOfficialModules(root)
  console.log(`UX check passed for ${modules.length} official module${modules.length === 1 ? '' : 's'}: ${modules.join(', ')}`)
  console.log('Automated UX checks are structural only; human usability and formal accessibility review are still required.')
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectRun) {
  main()
}
