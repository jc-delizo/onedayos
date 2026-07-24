import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import { resolveSupabaseAdminApiKey } from '../src/kernel/env/supabase-admin-key'
import {
  CANONICAL_DEMO_CATEGORY,
  CANONICAL_DEMO_PRODUCTS,
  CANONICAL_DEMO_SUPPLIER,
  CANONICAL_DEMO_WAREHOUSE,
  CONTROLLED_DEMO_REQUIRED_ENV,
  hasPlaceholderValue,
  loadDemoEnvFiles,
  parseBooleanFlag,
  permissionKey,
  usesPort1320,
  WAREHOUSE_OPERATOR_PERMISSION_KEYS,
  WAREHOUSE_OPERATOR_ROLE_NAME,
} from './demo-ops'

export type DemoCheck = {
  name: string
  ok: boolean
  nextAction?: string
}

export type DemoDataSnapshot = {
  orgExists: boolean
  subscriptionExists: boolean
  inventoryEnabled: boolean
  adminAuthUserExists: boolean
  adminPrismaUserMapped: boolean
  adminWildcardPermissionExists: boolean
  warehouseAuthUserExists: boolean
  warehousePrismaUserMapped: boolean
  warehouseRoleExists: boolean
  warehousePermissionProfile: string[]
  warehouseWildcardPermissionCount: number
  warehouseOrgAdminPermissionCount: number
  productCategoryExists: boolean
  canonicalProductCount: number
  activeProductCount: number
  supplierExists: boolean
  warehouseExists: boolean
  activeWarehouseCount: number
  productExtensionCount: number
  stockBalanceCount: number
  stockMovementCount: number
  stockAdjustmentCount: number
  recentInboundMovementCount: number
  recentOutboundMovementCount: number
  recentAdjustmentCount: number
  unsupportedMovementTypeCount: number
  canonicalBalancesExact: boolean
  coffeeBeansLowStock: boolean
}

export type DemoReadinessDeps = {
  env: Record<string, string | undefined>
  root: string
  readFile?: (path: string) => string | null
  getDataSnapshot?: () => Promise<DemoDataSnapshot>
  probeServer?: () => Promise<DemoCheck[]>
}

type SupabaseAuthUserSummary = {
  id: string
  email?: string | null
}

type SupabaseAdminUserReader = {
  auth: {
    admin: {
      listUsers(input: { page: number; perPage: number }): Promise<{
        data: { users: SupabaseAuthUserSummary[] }
        error: unknown
      }>
    }
  }
}

function check(name: string, ok: boolean, nextAction?: string): DemoCheck {
  return { name, ok, nextAction }
}

function readProjectFile(root: string, path: string): string | null {
  const absolute = join(root, path)
  return existsSync(absolute) ? readFileSync(absolute, 'utf8') : null
}

function envEquals(env: Record<string, string | undefined>, key: string, expected: string): boolean {
  return env[key] === expected
}

export function validateControlledDemoEnv(env: Record<string, string | undefined>): DemoCheck[] {
  const checks: DemoCheck[] = [
    check('Demo mode enabled', envEquals(env, 'ONEDAYOS_DEMO_MODE', 'true'), 'Set ONEDAYOS_DEMO_MODE=true.'),
    check(
      'Public registration disabled',
      envEquals(env, 'ONEDAYOS_PUBLIC_REGISTRATION_ENABLED', 'false'),
      'Set ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=false.',
    ),
    check(
      'Sandbox DB approval enabled',
      envEquals(env, 'ONEDAYOS_SANDBOX_DB_APPROVED', 'true'),
      'Set ONEDAYOS_SANDBOX_DB_APPROVED=true only for the approved sandbox DB.',
    ),
    check('App URL uses port 1320', usesPort1320(env.NEXT_PUBLIC_APP_URL), 'Set NEXT_PUBLIC_APP_URL to a port 1320 URL.'),
  ]

  for (const key of CONTROLLED_DEMO_REQUIRED_ENV) {
    checks.push(check(`Env ${key} present`, Boolean(env[key]), `Set ${key} in .env.local or the shell environment.`))
  }

  try {
    resolveSupabaseAdminApiKey(env)
    checks.push(check('Supabase admin API key is valid', true))
  } catch {
    checks.push(check('Supabase admin API key is valid', false, 'Set SUPABASE_SECRET_KEY or a valid legacy service-role key.'))
  }

  for (const key of ['ONEDAYOS_DEMO_ADMIN_PASSWORD', 'ONEDAYOS_DEMO_WAREHOUSE_PASSWORD']) {
    checks.push(check(`Env ${key} is non-placeholder`, !hasPlaceholderValue(env[key]), `Replace ${key} with a strong private value.`))
  }

  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    checks.push(check(`Env ${key} is non-placeholder`, !hasPlaceholderValue(env[key]), `Set ${key} to the approved sandbox database.`))
  }

  for (const key of ['ONEDAYOS_DEMO_MODE', 'ONEDAYOS_PUBLIC_REGISTRATION_ENABLED', 'ONEDAYOS_DEMO_RESET_APPROVED']) {
    try {
      parseBooleanFlag(env[key], false)
      checks.push(check(`Env ${key} parses as boolean`, true))
    } catch {
      checks.push(check(`Env ${key} parses as boolean`, false, `Set ${key} to true or false.`))
    }
  }

  return checks
}

export function checkApplicationSource(root: string, readFile = (path: string) => readProjectFile(root, path)): DemoCheck[] {
  const packageSource = readFile('package.json') ?? ''
  const registerRouteSource = readFile('src/app/api/kernel/auth/register/route.ts') ?? ''
  const registerPageSource = readFile('src/app/register/page.tsx') ?? ''
  const loginPageSource = readFile('src/app/login/page.tsx') ?? ''
  const layoutSource = readFile('src/app/layout.tsx') ?? ''
  const robotsSource = readFile('src/app/robots.ts') ?? ''
  const envExampleSource = readFile('.env.example') ?? ''

  return [
    check('Server start uses port 1320', packageSource.includes('"start": "next start -p 1320"')),
    check('check:all script is available', packageSource.includes('"check:all"')),
    check('demo:check script is available', packageSource.includes('"demo:check"')),
    check('demo:reset script is available', packageSource.includes('"demo:reset"')),
    check('Registration disabled API behavior exists', registerRouteSource.includes('registrationDisabled')),
    check('Registration page invite-only state exists', registerPageSource.includes('Registration is currently invite-only.')),
    check('Login hides registration link when disabled', loginPageSource.includes('publicRegistrationEnabled')),
    check('Demo root metadata can noindex/nofollow', layoutSource.includes('index: false') && layoutSource.includes('follow: false')),
    check('Robots demo behavior disallows all', robotsSource.includes("disallow: '/'")),
    check('Demo env contract documented', envExampleSource.includes('ONEDAYOS_DEMO_MODE=false') && envExampleSource.includes('ONEDAYOS_PUBLIC_REGISTRATION_ENABLED=true')),
  ]
}

export function checksFromDemoData(snapshot: DemoDataSnapshot): DemoCheck[] {
  const sortedWarehousePermissions = [...snapshot.warehousePermissionProfile].sort()
  const exactWarehouseProfile =
    sortedWarehousePermissions.length === WAREHOUSE_OPERATOR_PERMISSION_KEYS.length &&
    sortedWarehousePermissions.every((permission, index) => permission === WAREHOUSE_OPERATOR_PERMISSION_KEYS[index])

  return [
    check('Demo org exists', snapshot.orgExists, 'Run npm run demo:provision.'),
    check('Demo subscription exists', snapshot.subscriptionExists, 'Run npm run demo:provision.'),
    check('Inventory is enabled', snapshot.inventoryEnabled, 'Run npm run demo:provision.'),
    check('Org Admin auth user exists', snapshot.adminAuthUserExists, 'Run npm run demo:provision.'),
    check('Org Admin Prisma user mapping exists', snapshot.adminPrismaUserMapped, 'Run npm run demo:provision.'),
    check('Org Admin wildcard permission exists', snapshot.adminWildcardPermissionExists, 'Run npm run demo:provision.'),
    check('Warehouse auth user exists', snapshot.warehouseAuthUserExists, 'Run npm run demo:provision.'),
    check('Warehouse Prisma user mapping exists', snapshot.warehousePrismaUserMapped, 'Run npm run demo:provision.'),
    check('Warehouse Operator role exists', snapshot.warehouseRoleExists, 'Run npm run demo:provision.'),
    check('Warehouse Operator exact permission profile', exactWarehouseProfile, 'Run npm run demo:provision to repair the Warehouse Operator role.'),
    check('Warehouse Operator has no wildcard permission', snapshot.warehouseWildcardPermissionCount === 0, 'Run npm run demo:provision to repair stale permissions.'),
    check('Warehouse Operator has no Org Admin permission', snapshot.warehouseOrgAdminPermissionCount === 0, 'Run npm run demo:provision to repair stale permissions.'),
    check('Canonical Product Category exists', snapshot.productCategoryExists, 'Run npm run demo:provision.'),
    check('Three canonical Products exist', snapshot.canonicalProductCount === 3, 'Run npm run demo:provision.'),
    check('Exactly three active Products exist', snapshot.activeProductCount === 3, 'Run npm run demo:reset to remove noncanonical sandbox Product rows.'),
    check('Canonical Supplier exists', snapshot.supplierExists, 'Run npm run demo:provision.'),
    check('Canonical Warehouse exists', snapshot.warehouseExists, 'Run npm run demo:provision.'),
    check('Exactly one active Warehouse exists', snapshot.activeWarehouseCount === 1, 'Run npm run demo:reset to remove noncanonical sandbox Warehouse rows.'),
    check('Three InventoryProductExtension rows exist', snapshot.productExtensionCount === 3, 'Run npm run demo:provision.'),
    check('Three StockBalance rows exist', snapshot.stockBalanceCount === 3, 'Run npm run demo:provision.'),
    check('StockMovement rows exist', snapshot.stockMovementCount > 0, 'Run npm run demo:provision.'),
    check('StockAdjustment rows exist', snapshot.stockAdjustmentCount > 0, 'Run npm run demo:provision.'),
    check('Recent inbound demo movement exists', snapshot.recentInboundMovementCount > 0, 'Run npm run demo:reset to rebuild recent canonical activity.'),
    check('Recent outbound demo movement exists', snapshot.recentOutboundMovementCount > 0, 'Run npm run demo:reset to rebuild recent canonical activity.'),
    check('Recent demo adjustments exist', snapshot.recentAdjustmentCount > 0, 'Run npm run demo:reset to rebuild recent canonical activity.'),
    check('No unsupported demo movement type exists', snapshot.unsupportedMovementTypeCount === 0, 'Run npm run demo:reset to repair the movement vocabulary.'),
    check('Canonical final balances are exact', snapshot.canonicalBalancesExact, 'Run npm run demo:reset to repair canonical balances.'),
    check('Coffee Beans canonical low-stock state exists', snapshot.coffeeBeansLowStock, 'Run npm run demo:reset, then npm run demo:check.'),
  ]
}

async function findAuthUsersByEmail(
  supabaseAdmin: SupabaseAdminUserReader,
  emails: string[],
): Promise<Map<string, SupabaseAuthUserSummary>> {
  const normalizedEmails = new Set(emails.map((email) => email.toLowerCase()))
  const found = new Map<string, SupabaseAuthUserSummary>()
  const perPage = 1000

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })

    if (error) {
      const status = typeof error === 'object' && error && 'status' in error ? String(error.status) : 'unknown'
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : 'unknown'
      throw new Error(`Could not inspect Supabase Auth users for demo readiness (status ${status}, code ${code}).`)
    }

    for (const user of data.users) {
      const email = user.email?.toLowerCase()
      if (email && normalizedEmails.has(email)) found.set(email, user)
    }

    if (found.size === normalizedEmails.size || data.users.length < perPage) return found
  }

  throw new Error('Supabase Auth user list exceeded the readiness safety page limit.')
}

export async function createLiveDemoDataSnapshot(env: Record<string, string | undefined>): Promise<DemoDataSnapshot> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.DIRECT_URL ?? env.DATABASE_URL,
    }),
  })
  const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL ?? '', resolveSupabaseAdminApiKey(env), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  })

  try {
    const adminEmail = (env.ONEDAYOS_DEMO_ADMIN_EMAIL ?? '').toLowerCase()
    const warehouseEmail = (env.ONEDAYOS_DEMO_WAREHOUSE_EMAIL ?? '').toLowerCase()
    const authUsers = await findAuthUsersByEmail(supabaseAdmin, [adminEmail, warehouseEmail])
    const adminAuthUser = authUsers.get(adminEmail) ?? null
    const warehouseAuthUser = authUsers.get(warehouseEmail) ?? null
    const org = await prisma.organization.findUnique({
      where: { slug: env.ONEDAYOS_DEMO_ORG_SLUG ?? '' },
      select: { id: true },
    })

    if (!org) {
      return {
        orgExists: false,
        subscriptionExists: false,
        inventoryEnabled: false,
        adminAuthUserExists: Boolean(adminAuthUser),
        adminPrismaUserMapped: false,
        adminWildcardPermissionExists: false,
        warehouseAuthUserExists: Boolean(warehouseAuthUser),
        warehousePrismaUserMapped: false,
        warehouseRoleExists: false,
        warehousePermissionProfile: [],
        warehouseWildcardPermissionCount: 0,
        warehouseOrgAdminPermissionCount: 0,
        productCategoryExists: false,
        canonicalProductCount: 0,
        activeProductCount: 0,
        supplierExists: false,
        warehouseExists: false,
        activeWarehouseCount: 0,
        productExtensionCount: 0,
        stockBalanceCount: 0,
        stockMovementCount: 0,
        stockAdjustmentCount: 0,
        recentInboundMovementCount: 0,
        recentOutboundMovementCount: 0,
        recentAdjustmentCount: 0,
        unsupportedMovementTypeCount: 0,
        canonicalBalancesExact: false,
        coffeeBeansLowStock: false,
      }
    }

    const [
      subscription,
      inventoryModule,
      adminUser,
      warehouseUser,
      warehouseRole,
      category,
      products,
      supplier,
      warehouse,
    ] = await Promise.all([
      prisma.subscription.findUnique({ where: { orgId: org.id }, select: { id: true } }),
      prisma.orgModule.findUnique({ where: { orgId_moduleId: { orgId: org.id, moduleId: 'inventory' } }, select: { isEnabled: true } }),
      adminAuthUser
        ? prisma.user.findUnique({ where: { id: adminAuthUser.id }, select: { id: true, orgId: true } })
        : Promise.resolve(null),
      warehouseAuthUser
        ? prisma.user.findUnique({ where: { id: warehouseAuthUser.id }, select: { id: true, orgId: true } })
        : Promise.resolve(null),
      prisma.role.findUnique({ where: { orgId_name: { orgId: org.id, name: WAREHOUSE_OPERATOR_ROLE_NAME } }, select: { id: true } }),
      prisma.productCategory.findFirst({ where: { orgId: org.id, name: CANONICAL_DEMO_CATEGORY.name, deletedAt: null }, select: { id: true } }),
      prisma.product.findMany({
        where: { orgId: org.id, code: { in: CANONICAL_DEMO_PRODUCTS.map((product) => product.code) }, deletedAt: null },
        select: { id: true, code: true },
      }),
      prisma.supplier.findFirst({ where: { orgId: org.id, name: CANONICAL_DEMO_SUPPLIER.name, deletedAt: null }, select: { id: true } }),
      prisma.warehouse.findFirst({ where: { orgId: org.id, code: CANONICAL_DEMO_WAREHOUSE.code, deletedAt: null }, select: { id: true } }),
    ])

    const adminRoleIds = adminUser
      ? (await prisma.userRole.findMany({
          where: { orgId: org.id, userId: adminUser.id },
          select: { roleId: true },
        })).map((role) => role.roleId)
      : []
    const warehousePermissions = warehouseRole
      ? await prisma.permission.findMany({
          where: { orgId: org.id, roleId: warehouseRole.id },
          select: { module: true, resource: true, action: true },
        })
      : []
    const adminWildcardPermissionExists = await prisma.permission.count({
      where: {
        orgId: org.id,
        roleId: { in: adminRoleIds },
        module: '*',
        resource: '*',
        action: '*',
      },
    })
    const productIds = products.map((product) => product.id)
    const today = new Date()
    const rangeStart = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() - 29,
    ))
    const rangeEnd = new Date(Date.UTC(
      today.getUTCFullYear(),
      today.getUTCMonth(),
      today.getUTCDate() + 1,
    ))
    const implementedMovementTypes = ['opening_balance', 'adjustment_in', 'adjustment_out']
    const [
      activeProductCount,
      activeWarehouseCount,
      productExtensionCount,
      stockBalanceCount,
      stockMovementCount,
      stockAdjustmentCount,
      recentInboundMovementCount,
      recentOutboundMovementCount,
      recentAdjustmentCount,
      unsupportedMovementTypeCount,
      canonicalBalances,
    ] = await Promise.all([
      prisma.product.count({ where: { orgId: org.id, isActive: true, deletedAt: null } }),
      prisma.warehouse.count({ where: { orgId: org.id, isActive: true, deletedAt: null } }),
      prisma.inventoryProductExtension.count({ where: { orgId: org.id, productId: { in: productIds }, deletedAt: null } }),
      prisma.stockBalance.count({ where: { orgId: org.id, productId: { in: productIds } } }),
      prisma.stockMovement.count({ where: { orgId: org.id } }),
      prisma.stockAdjustment.count({ where: { orgId: org.id, deletedAt: null } }),
      prisma.stockMovement.count({
        where: {
          orgId: org.id,
          type: { in: ['opening_balance', 'adjustment_in'] },
          occurredAt: { gte: rangeStart, lt: rangeEnd },
        },
      }),
      prisma.stockMovement.count({
        where: {
          orgId: org.id,
          type: 'adjustment_out',
          occurredAt: { gte: rangeStart, lt: rangeEnd },
        },
      }),
      prisma.stockAdjustment.count({
        where: {
          orgId: org.id,
          deletedAt: null,
          createdAt: { gte: rangeStart, lt: rangeEnd },
        },
      }),
      prisma.stockMovement.count({
        where: {
          orgId: org.id,
          type: { notIn: implementedMovementTypes },
        },
      }),
      prisma.stockBalance.findMany({
        where: { orgId: org.id, productId: { in: productIds } },
        select: {
          quantity: true,
          product: { select: { code: true } },
        },
      }),
    ])
    const expectedBalances = new Map<string, number>(
      CANONICAL_DEMO_PRODUCTS.map((product) => [product.code, Number(product.quantity)]),
    )
    const canonicalBalancesExact =
      canonicalBalances.length === CANONICAL_DEMO_PRODUCTS.length &&
      canonicalBalances.every((balance) => (
        Number(balance.quantity) === expectedBalances.get(balance.product.code)
      ))
    const coffeeProduct = products.find((product) => product.code === 'COF-1KG')
    const [coffeeExtension, coffeeBalance] = coffeeProduct
      ? await Promise.all([
          prisma.inventoryProductExtension.findFirst({
            where: { orgId: org.id, productId: coffeeProduct.id, deletedAt: null },
            select: { reorderPoint: true },
          }),
          prisma.stockBalance.findFirst({
            where: { orgId: org.id, productId: coffeeProduct.id },
            select: { quantity: true },
          }),
        ])
      : [null, null]
    const coffeeQuantity = coffeeBalance?.quantity
    const coffeeBeansLowStock =
      coffeeQuantity !== undefined &&
      Number(coffeeQuantity) <= Number(coffeeExtension?.reorderPoint ?? 0) &&
      Number(coffeeExtension?.reorderPoint ?? 0) > 0

    return {
      orgExists: true,
      subscriptionExists: Boolean(subscription),
      inventoryEnabled: inventoryModule?.isEnabled === true,
      adminAuthUserExists: Boolean(adminAuthUser),
      adminPrismaUserMapped: Boolean(adminUser && adminUser.orgId === org.id),
      adminWildcardPermissionExists: adminWildcardPermissionExists > 0,
      warehouseAuthUserExists: Boolean(warehouseAuthUser),
      warehousePrismaUserMapped: Boolean(warehouseUser && warehouseUser.orgId === org.id),
      warehouseRoleExists: Boolean(warehouseRole),
      warehousePermissionProfile: warehousePermissions.map(permissionKey).sort(),
      warehouseWildcardPermissionCount: warehousePermissions.filter((permission) => permissionKey(permission) === '*.*.*').length,
      warehouseOrgAdminPermissionCount: warehousePermissions.filter((permission) => permissionKey(permission) === 'kernel.organization.manage').length,
      productCategoryExists: Boolean(category),
      canonicalProductCount: products.length,
      activeProductCount,
      supplierExists: Boolean(supplier),
      warehouseExists: Boolean(warehouse),
      activeWarehouseCount,
      productExtensionCount,
      stockBalanceCount,
      stockMovementCount,
      stockAdjustmentCount,
      recentInboundMovementCount,
      recentOutboundMovementCount,
      recentAdjustmentCount,
      unsupportedMovementTypeCount,
      canonicalBalancesExact,
      coffeeBeansLowStock,
    }
  } finally {
    await prisma.$disconnect()
  }
}

export async function runDemoReadinessChecks(deps: DemoReadinessDeps): Promise<DemoCheck[]> {
  const envChecks = validateControlledDemoEnv(deps.env)
  const sourceChecks = checkApplicationSource(deps.root, deps.readFile)
  const checks = [...envChecks, ...sourceChecks]
  const canCheckData = envChecks.every((item) => item.ok)

  if (canCheckData && deps.getDataSnapshot) {
    checks.push(...checksFromDemoData(await deps.getDataSnapshot()))
  } else if (!canCheckData) {
    checks.push(check('Database readiness checks skipped until env gate passes', false, 'Fix failed env checks, then rerun npm run demo:check.'))
  }

  if (deps.probeServer) {
    checks.push(...await deps.probeServer())
  }

  return checks
}

export function formatDemoChecks(checks: DemoCheck[]): string {
  return checks
    .map((item) => `${item.ok ? 'PASS' : 'FAIL'}  ${item.name}${item.ok || !item.nextAction ? '' : ` — ${item.nextAction}`}`)
    .join('\n')
}

async function main() {
  loadDemoEnvFiles()
  const checks = await runDemoReadinessChecks({
    env: process.env,
    root: process.cwd(),
    getDataSnapshot: () => createLiveDemoDataSnapshot(process.env),
  })

  console.log(formatDemoChecks(checks))

  if (checks.some((item) => !item.ok)) {
    console.error('Controlled demo readiness checks failed. Review failed condition names only; do not print secrets.')
    process.exitCode = 1
    return
  }

  console.log('Controlled demo readiness checks passed.')
  console.log('Public self-service demo approval is not implied.')
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error('Controlled demo readiness check failed.', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    process.exitCode = 1
  })
}
