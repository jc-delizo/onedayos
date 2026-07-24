import { describe, expect, it, vi } from 'vitest'
import {
  checkApplicationSource,
  checksFromDemoData,
  runDemoReadinessChecks,
  validateControlledDemoEnv,
  type DemoDataSnapshot,
} from './check-demo-readiness'

const controlledDemoEnv = {
  DATABASE_URL: 'postgresql://sandbox.example/onedayos',
  DIRECT_URL: 'postgresql://sandbox-direct.example/onedayos',
  NEXT_PUBLIC_SUPABASE_URL: 'https://sandbox.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SECRET_KEY: 'sb_secret_sandbox-test-key',
  NEXT_PUBLIC_APP_URL: 'http://localhost:1320',
  ONEDAYOS_DEMO_MODE: 'true',
  ONEDAYOS_PUBLIC_REGISTRATION_ENABLED: 'false',
  ONEDAYOS_SANDBOX_DB_APPROVED: 'true',
  ONEDAYOS_DEMO_RESET_APPROVED: 'true',
  ONEDAYOS_DEMO_ADMIN_EMAIL: 'demo@example.test',
  ONEDAYOS_DEMO_ADMIN_PASSWORD: 'secure-demo-secret',
  ONEDAYOS_DEMO_ORG_NAME: 'OneDayOS Demo Trading',
  ONEDAYOS_DEMO_ORG_SLUG: 'onedayosdemo',
  ONEDAYOS_DEMO_WAREHOUSE_EMAIL: 'warehouse@example.test',
  ONEDAYOS_DEMO_WAREHOUSE_PASSWORD: 'warehouse-secure-demo-secret',
  ONEDAYOS_DEMO_WAREHOUSE_NAME: 'Warehouse User',
} satisfies Record<string, string>

const readySnapshot: DemoDataSnapshot = {
  orgExists: true,
  subscriptionExists: true,
  inventoryEnabled: true,
  adminAuthUserExists: true,
  adminPrismaUserMapped: true,
  adminWildcardPermissionExists: true,
  warehouseAuthUserExists: true,
  warehousePrismaUserMapped: true,
  warehouseRoleExists: true,
  warehousePermissionProfile: [
    'inventory.dashboard.read',
    'inventory.product_setting.read',
    'inventory.stock_level.read',
    'inventory.stock_movement.read',
    'inventory.stock_adjustment.read',
    'inventory.stock_adjustment.create',
    'objects.product.read',
    'objects.product_category.read',
    'objects.supplier.read',
    'objects.warehouse.read',
  ],
  warehouseWildcardPermissionCount: 0,
  warehouseOrgAdminPermissionCount: 0,
  productCategoryExists: true,
  canonicalProductCount: 3,
  activeProductCount: 3,
  supplierExists: true,
  warehouseExists: true,
  activeWarehouseCount: 1,
  productExtensionCount: 3,
  stockBalanceCount: 3,
  stockMovementCount: 9,
  stockAdjustmentCount: 9,
  recentInboundMovementCount: 6,
  recentOutboundMovementCount: 3,
  recentAdjustmentCount: 9,
  unsupportedMovementTypeCount: 0,
  canonicalBalancesExact: true,
  coffeeBeansLowStock: true,
}

function sourceMap(overrides: Record<string, string> = {}) {
  const defaults: Record<string, string> = {
    'package.json': `{
  "scripts": {
    "start": "next start -p 1320",
    "check:all": "npm run check:env",
    "demo:check": "tsx scripts/check-demo-readiness.ts",
    "demo:reset": "tsx scripts/reset-sandbox-demo.ts"
  }
}`,
    'src/app/api/kernel/auth/register/route.ts': 'throw apiErrors.registrationDisabled()',
    'src/app/register/page.tsx': 'Registration is currently invite-only.',
    'src/app/login/page.tsx': 'publicRegistrationEnabled ? <Link /> : undefined',
    'src/app/layout.tsx': 'robots: { index: false, follow: false }',
    'src/app/robots.ts': "disallow: '/'",
    '.env.example': 'ONEDAYOS_DEMO_MODE=false\nONEDAYOS_PUBLIC_REGISTRATION_ENABLED=true',
  }

  return (path: string) => overrides[path] ?? defaults[path] ?? null
}

describe('controlled demo readiness checks', () => {
  it('passes the strict env gate only when demo mode disables public registration on port 1320', () => {
    expect(validateControlledDemoEnv(controlledDemoEnv).every((item) => item.ok)).toBe(true)
  })

  it('fails placeholder passwords and public registration for controlled demo mode', () => {
    const checks = validateControlledDemoEnv({
      ...controlledDemoEnv,
      ONEDAYOS_PUBLIC_REGISTRATION_ENABLED: 'true',
      ONEDAYOS_DEMO_ADMIN_PASSWORD: 'password123',
    })

    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Public registration disabled', ok: false })]))
    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Env ONEDAYOS_DEMO_ADMIN_PASSWORD is non-placeholder', ok: false })]))
  })

  it('accepts the legacy service-role fallback when the canonical key is absent', () => {
    const header = Buffer.from(JSON.stringify({ alg: 'HS256' })).toString('base64url')
    const payload = Buffer.from(JSON.stringify({ role: 'service_role' })).toString('base64url')
    const { SUPABASE_SECRET_KEY: _secret, ...legacyEnv } = controlledDemoEnv

    expect(validateControlledDemoEnv({
      ...legacyEnv,
      SUPABASE_SERVICE_ROLE_KEY: `${header}.${payload}.test-signature`,
    }).every((item) => item.ok)).toBe(true)
  })

  it('rejects a publishable key for admin operations', () => {
    const checks = validateControlledDemoEnv({
      ...controlledDemoEnv,
      SUPABASE_SECRET_KEY: 'sb_publishable_not-an-admin-key',
    })

    expect(checks).toContainEqual(expect.objectContaining({ name: 'Supabase admin API key is valid', ok: false }))
  })

  it('verifies source controls for registration, noindex, scripts, and port 1320', () => {
    expect(checkApplicationSource('/repo', sourceMap()).every((item) => item.ok)).toBe(true)
  })

  it('fails source controls when demo reset and disabled registration wiring are missing', () => {
    const checks = checkApplicationSource(
      '/repo',
      sourceMap({
        'package.json': JSON.stringify({ scripts: { start: 'next start -p 3000' } }),
        'src/app/api/kernel/auth/register/route.ts': 'registerOrganization(input)',
      }),
    )

    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Server start uses port 1320', ok: false })]))
    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'demo:reset script is available', ok: false })]))
    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Registration disabled API behavior exists', ok: false })]))
  })

  it('requires the exact least-privilege warehouse permission profile', () => {
    const checks = checksFromDemoData({
      ...readySnapshot,
      warehousePermissionProfile: [...readySnapshot.warehousePermissionProfile, 'objects.employee.read'],
    })

    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Warehouse Operator exact permission profile', ok: false })]))
  })

  it('skips live data checks when the env gate fails', async () => {
    const getDataSnapshot = vi.fn()
    const checks = await runDemoReadinessChecks({
      env: { ...controlledDemoEnv, ONEDAYOS_SANDBOX_DB_APPROVED: 'false' },
      root: '/repo',
      readFile: sourceMap(),
      getDataSnapshot,
    })

    expect(getDataSnapshot).not.toHaveBeenCalled()
    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Database readiness checks skipped until env gate passes', ok: false })]))
  })

  it('passes when env, source, and read-only data checks pass', async () => {
    const checks = await runDemoReadinessChecks({
      env: controlledDemoEnv,
      root: '/repo',
      readFile: sourceMap(),
      getDataSnapshot: async () => readySnapshot,
    })

    expect(checks.every((item) => item.ok)).toBe(true)
  })
})
