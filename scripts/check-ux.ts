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

  if (formSource && !formSource.includes('FormPage')) {
    addFinding(findings, root, join(routeRoot, 'stock-adjustments/new/page.tsx'), 'inventory-form-pattern', 'Inventory adjustment form page must use FormPage.')
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
    "area.id !== 'employees'",
    'records-landing-promotes-people',
    'Records landing should not promote Employees beside shared Inventory-supporting records.',
  )
  requireSourceIncludes(
    findings,
    root,
    'src/app/[orgSlug]/records/page.tsx',
    'Records are not an app',
    'records-treated-as-app',
    'Records landing must state that Records are not an app.',
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

  const appLauncherSource = readIfExists(join(root, 'src/app/[orgSlug]/apps/app-launcher.tsx'))
  if (appLauncherSource?.includes('Open Records')) {
    addFinding(
      findings,
      root,
      join(root, 'src/app/[orgSlug]/apps/app-launcher.tsx'),
      'records-shown-as-app',
      'Records must not be shown as an app in the app launcher.',
    )
  }

  const navigationSource = readIfExists(join(root, 'src/platform/navigation/tenant-navigation.ts'))
  if (navigationSource) {
    if (/id:\s*['"]records['"]\s+as\s+const|label:\s*['"]Records['"][\s\S]{0,180}description:/.test(navigationSource)) {
      addFinding(
        findings,
        root,
        join(root, 'src/platform/navigation/tenant-navigation.ts'),
        'records-shown-as-app',
        'Records must not appear as an app-switcher app.',
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

    if (/Employees|People|Customers/.test(relatedRecordsSource)) {
      addFinding(
        findings,
        root,
        join(root, 'src/platform/navigation/tenant-navigation.ts'),
        'inventory-sidebar-platform-record-leak',
        'Inventory related Records navigation must not include People, Employees, or Customers.',
      )
    }
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
  checkRuntimeAppearance(root, findings)
  checkPlatformSurfaceUx(root, findings)
  checkRoleBasedUxValidationPreparation(root, findings)
  checkControlledDemoPreparation(root, findings)

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
