import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs'
import { join, relative, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

type Finding = {
  file: string
  rule: string
  detail: string
}

type Rule = {
  id: string
  detail: string
  appliesTo?: (file: string, content: string) => boolean
  pattern: RegExp
}

const ACTIVE_EXTENSIONS = new Set([
  '.ts',
  '.tsx',
  '.js',
  '.jsx',
  '.mjs',
  '.cjs',
  '.json',
  '.prisma',
  '.css',
])

const DEFAULT_IGNORES = [
  'docs',
  'node_modules',
  '.git',
  '.next',
  'coverage',
  'dist',
  '_archive',
  'package-lock.json',
]

function normalizePath(path: string): string {
  return path.split(sep).join('/')
}

function extensionOf(file: string): string {
  const index = file.lastIndexOf('.')
  return index === -1 ? '' : file.slice(index)
}

function shouldIgnore(relativePath: string): boolean {
  const normalized = normalizePath(relativePath)

  if (DEFAULT_IGNORES.some((entry) => normalized === entry || normalized.startsWith(`${entry}/`))) {
    return true
  }

  return (
    normalized.includes('/__fixtures__/') ||
    normalized.includes('/fixtures/') ||
    normalized.endsWith('.test.ts') ||
    normalized.endsWith('.test.tsx') ||
    normalized.endsWith('/check-architecture.ts')
  )
}

function listFiles(root: string, current = root): string[] {
  const entries = readdirSync(current)
  const files: string[] = []

  for (const entry of entries) {
    const absolute = join(current, entry)
    const rel = normalizePath(relative(root, absolute))

    if (shouldIgnore(rel)) {
      continue
    }

    const stats = statSync(absolute)

    if (stats.isDirectory()) {
      files.push(...listFiles(root, absolute))
      continue
    }

    const extension = extensionOf(entry)

    if (ACTIVE_EXTENSIONS.has(extension) || entry === 'package.json' || extension === '.py') {
      files.push(absolute)
    }
  }

  return files
}

const rules: Rule[] = [
  {
    id: 'no-sdk-get-db-org-id',
    detail: 'Use sdk.getDb(ctx), not sdk.getDb(orgId).',
    pattern: /\bsdk\.getDb\s*\(\s*orgId\s*\)/,
  },
  {
    id: 'no-get-db-org-id',
    detail: 'Use getDb(ctx), not getDb(orgId).',
    pattern: /\bgetDb\s*\(\s*orgId\s*\)/,
  },
  {
    id: 'no-body-org-id',
    detail: 'Reject client-supplied tenant identity.',
    pattern: /\bbody\.orgId\b/,
  },
  {
    id: 'no-input-org-id',
    detail: 'Reject client-supplied tenant identity.',
    pattern: /\binput\.orgId\b/,
  },
  {
    id: 'no-search-param-org-id',
    detail: 'Do not read orgId from URL query strings.',
    pattern: /searchParams\.get\(\s*['"]orgId['"]\s*\)/,
  },
  {
    id: 'no-old-module-api-pattern',
    detail: 'Use /api/orgs/[orgSlug]/..., not /api/[module].',
    pattern: /\/api\/\[module\]/,
  },
  {
    id: 'no-inventory-api',
    detail: 'Inventory APIs must be tenant-scoped under /api/orgs/[orgSlug]/inventory.',
    pattern: /\/api\/inventory/,
  },
  {
    id: 'no-unscoped-sample-module-api',
    detail: 'Generated module APIs must live under /api/orgs/[orgSlug]/[moduleId].',
    pattern: /\/api\/sample-module/,
  },
  {
    id: 'no-id-current-user-api',
    detail: 'Use /api/kernel/auth/me for current user lookup.',
    pattern: /\/api\/kernel\/users\/(?:\[id\]|[A-Za-z0-9_-]+)/,
  },
  {
    id: 'no-framer-motion',
    detail: 'Use Motion for React later via motion/react, not framer-motion.',
    pattern: /from\s+['"]framer-motion['"]|["']framer-motion["']\s*:/,
  },
  {
    id: 'no-fastapi',
    detail: 'FastAPI is excluded from the core platform.',
    pattern: /\bFastAPI\b|fastapi/,
  },
  {
    id: 'no-api-page-auth-helper',
    detail: 'API routes must not use page redirect auth helpers.',
    appliesTo: (file) => normalizePath(file).includes('/src/app/api/'),
    pattern: /requirePageAuth|from\s+['"]next\/navigation['"]|redirect\(\s*['"]\/login['"]\s*\)/,
  },
  {
    id: 'no-module-kernel-imports',
    detail: 'Modules must use SDK boundaries, not Kernel internals.',
    appliesTo: (file) => normalizePath(file).includes('/src/modules/'),
    pattern: /from\s+['"]@\/kernel\//,
  },
  {
    id: 'no-raw-prisma-in-modules',
    detail: 'Modules must not import raw Prisma.',
    appliesTo: (file) => normalizePath(file).includes('/src/modules/'),
    pattern: /from\s+['"]@prisma\/client['"]|from\s+['"]@\/kernel\/db/,
  },
  {
    id: 'no-module-to-module-imports',
    detail: 'Modules must not import other modules.',
    appliesTo: (file) => normalizePath(file).includes('/src/modules/'),
    pattern: /from\s+['"]@\/modules\//,
  },
  {
    id: 'no-module-self-registration',
    detail: 'Module manifests must be pure metadata and registered only through the static composition root.',
    appliesTo: (file) => normalizePath(file).includes('/src/modules/'),
    pattern: /sdk\.modules\.register\s*\(/,
  },
  {
    id: 'no-module-action-array-permissions',
    detail: 'Module permissions must use full permission objects, not action arrays.',
    appliesTo: (file) => normalizePath(file).includes('/src/modules/'),
    pattern: /permissions\s*:\s*\[\s*['"][a-z]+['"]/,
  },
  {
    id: 'no-module-wildcard-permissions',
    detail: 'Module manifests must not declare wildcard permissions.',
    appliesTo: (file) => normalizePath(file).includes('/src/modules/'),
    pattern: /(module|resource|action)\s*:\s*['"]\*['"]/,
  },
  {
    id: 'no-duplicate-business-object-identity',
    detail: 'Modules must not duplicate shared Business Object identities.',
    appliesTo: (file) => normalizePath(file).includes('/src/modules/'),
    pattern: /\b(?:InventoryProduct|InventoryWarehouse|InventorySupplier|CRMCustomer|LeaveEmployee|HREmployee|PurchasingSupplier|AssetEmployee|WarehouseInventoryLocation)\b/,
  },
  {
    id: 'no-business-object-models-in-modules',
    detail: 'Business Object Prisma models belong in the shared Business Objects layer, not modules.',
    appliesTo: (file) => normalizePath(file).includes('/src/modules/'),
    pattern: /\bmodel\s+(?:Employee|Product|ProductCategory|Customer|Supplier|Warehouse)\b/,
  },
  {
    id: 'no-brand-accent-remap',
    detail: 'Keep OneDayOS brand orange on --color-brand, not generic accent tokens.',
    appliesTo: (file) => normalizePath(file).endsWith('/src/app/globals.css'),
    pattern: /--color-accent\s*:\s*#F97316/i,
  },
  {
    id: 'no-client-server-sdk-import',
    detail: 'Client components must not import @/sdk/server.',
    appliesTo: (_file, content) => /^\s*['"]use client['"]/.test(content),
    pattern: /from\s+['"]@\/sdk\/server['"]/,
  },
  {
    id: 'no-client-kernel-import',
    detail: 'Client components must not import Kernel internals.',
    appliesTo: (_file, content) => /^\s*['"]use client['"]/.test(content),
    pattern: /from\s+['"]@\/kernel\//,
  },
  {
    id: 'no-client-raw-prisma',
    detail: 'Client components must not import raw Prisma.',
    appliesTo: (_file, content) => /^\s*['"]use client['"]/.test(content),
    pattern: /from\s+['"]@prisma\/client['"]|from\s+['"]@\/kernel\/db/,
  },
  {
    id: 'no-client-exceljs',
    detail: 'ExcelJS is server-only and must not enter client components.',
    appliesTo: (_file, content) => /^\s*['"]use client['"]/.test(content),
    pattern: /from\s+['"]exceljs['"]|require\(\s*['"]exceljs['"]\s*\)/,
  },
  {
    id: 'no-org-id-form-field',
    detail: 'Client forms must not submit orgId fields.',
    pattern: /<input[^>]+name\s*=\s*(?:["']orgId["']|\{["']orgId["']\})/,
  },
  {
    id: 'no-client-org-id-json',
    detail: 'Client code must not submit orgId in JSON payloads.',
    appliesTo: (_file, content) => /^\s*['"]use client['"]/.test(content),
    pattern: /JSON\.stringify\s*\(\s*\{[\s\S]{0,400}\borgId\s*:/,
  },
  {
    id: 'no-client-supabase-signup',
    detail: 'Platform registration must use the server-owned Kernel route, not client-side Supabase signUp.',
    appliesTo: (_file, content) => /^\s*['"]use client['"]/.test(content),
    pattern: /\.auth\.signUp\s*\(/,
  },
  {
    id: 'no-old-records-products-button',
    detail: 'Use app switcher/sidebar IA instead of the retired Records / Products shortcut button.',
    appliesTo: (file) => normalizePath(file).includes('/src/'),
    pattern: /Records\s*\/\s*Products/,
  },
  {
    id: 'no-current-app-label',
    detail: 'The current app switcher must be a compact popover row without a CURRENT APP label.',
    appliesTo: (file) => normalizePath(file).endsWith('/src/components/onedayos/app-shell.tsx'),
    pattern: /Current App|CURRENT APP/,
  },
  {
    id: 'no-apps-arrow-label',
    detail: 'The app switcher should use a compact icon affordance, not the retired Apps > text.',
    appliesTo: (file) => normalizePath(file).endsWith('/src/components/onedayos/app-shell.tsx'),
    pattern: /Apps\s*(?:&gt;|>)/,
  },
  {
    id: 'no-sidebar-active-dot',
    detail: 'Sidebar active state must not use notification-style dot indicators.',
    appliesTo: (file) => normalizePath(file).endsWith('/src/components/onedayos/app-shell.tsx'),
    pattern: /size-1\.5\s+rounded-full/,
  },
  {
    id: 'no-sidebar-active-left-rail',
    detail: 'Sidebar active state must not use a selected left rail or left border.',
    appliesTo: (file) => normalizePath(file).endsWith('/src/components/onedayos/app-shell.tsx'),
    pattern: /border-l-(?:2|\[)/,
  },
]

export function checkArchitecture(root: string): Finding[] {
  const files = existsSync(root) ? listFiles(root) : []
  const findings: Finding[] = []

  for (const file of files) {
    const rel = normalizePath(relative(root, file))
    const extension = extensionOf(file)

    if (extension === '.py') {
      findings.push({
        file: rel,
        rule: 'no-python-backend',
        detail: 'Python backend files are outside the core platform scope.',
      })
      continue
    }

    const content = readFileSync(file, 'utf8')

    for (const rule of rules) {
      if (rule.appliesTo && !rule.appliesTo(file, content)) {
        continue
      }

      if (rule.pattern.test(content)) {
        findings.push({
          file: rel,
          rule: rule.id,
          detail: rule.detail,
        })
      }
    }
  }

  return findings
}

function main() {
  const root = process.cwd()
  const findings = checkArchitecture(root)

  if (findings.length > 0) {
    console.error('Architecture check failed:')
    for (const finding of findings) {
      console.error(`- ${finding.file}: ${finding.rule} — ${finding.detail}`)
    }
    process.exit(1)
  }

  console.log('Architecture check passed.')
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectRun) {
  main()
}
