import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import {
  buildCanonicalDemoActivity,
  CANONICAL_DEMO_PRODUCTS,
  stockMovementType,
} from './demo-ops'
import { validateDemoResetEnv } from './reset-sandbox-demo'

const resetEnv = {
  ONEDAYOS_DEMO_MODE: 'true',
  ONEDAYOS_PUBLIC_REGISTRATION_ENABLED: 'false',
  ONEDAYOS_SANDBOX_DB_APPROVED: 'true',
  ONEDAYOS_DEMO_RESET_APPROVED: 'true',
  ONEDAYOS_DEMO_ORG_SLUG: 'onedayosdemo',
  DATABASE_URL: 'postgresql://sandbox.example/onedayos',
  DIRECT_URL: 'postgresql://sandbox-direct.example/onedayos',
  NEXT_PUBLIC_SUPABASE_URL: 'https://sandbox.supabase.co',
  NEXT_PUBLIC_SUPABASE_ANON_KEY: 'anon-key',
  SUPABASE_SECRET_KEY: 'sb_secret_sandbox-test-key',
  NEXT_PUBLIC_APP_URL: 'http://localhost:1320',
  ONEDAYOS_DEMO_ADMIN_EMAIL: 'demo@example.test',
  ONEDAYOS_DEMO_ADMIN_PASSWORD: 'secure-demo-secret',
  ONEDAYOS_DEMO_ORG_NAME: 'OneDayOS Demo Trading',
  ONEDAYOS_DEMO_WAREHOUSE_EMAIL: 'warehouse@example.test',
  ONEDAYOS_DEMO_WAREHOUSE_PASSWORD: 'warehouse-secure-demo-secret',
  ONEDAYOS_DEMO_WAREHOUSE_NAME: 'Warehouse User',
} satisfies Record<string, string>

const source = readFileSync(join(process.cwd(), 'scripts/reset-sandbox-demo.ts'), 'utf8')

describe('sandbox demo reset safety contract', () => {
  it('requires demo mode, sandbox approval, reset approval, and configured demo org slug', () => {
    expect(validateDemoResetEnv(resetEnv).every((item) => item.ok)).toBe(true)

    const checks = validateDemoResetEnv({
      ...resetEnv,
      ONEDAYOS_DEMO_MODE: 'false',
      ONEDAYOS_DEMO_RESET_APPROVED: 'false',
      ONEDAYOS_DEMO_ORG_SLUG: '',
    })

    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Demo mode enabled', ok: false })]))
    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Demo reset approval enabled', ok: false })]))
    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Env ONEDAYOS_DEMO_ORG_SLUG present', ok: false })]))
  })

  it('refuses arbitrary org slug command arguments', () => {
    expect(validateDemoResetEnv(resetEnv, ['another-org'])).toEqual(
      expect.arrayContaining([expect.objectContaining({ name: 'No arbitrary org slug argument accepted', ok: false })]),
    )
  })

  it('refuses placeholder database URLs', () => {
    const checks = validateDemoResetEnv({
      ...resetEnv,
      DATABASE_URL: 'postgresql://user:YOUR-PASSWORD@localhost:5432/db',
    })

    expect(checks).toEqual(expect.arrayContaining([expect.objectContaining({ name: 'Env DATABASE_URL is non-placeholder', ok: false })]))
  })

  it('deletes only demo org Inventory operational rows and preserves account/org foundation data', () => {
    expect(source).toContain('await tx.stockMovement.deleteMany({ where: { orgId: org.id } })')
    expect(source).toContain('await tx.stockAdjustment.deleteMany({ where: { orgId: org.id } })')
    expect(source).toContain('await tx.stockBalance.deleteMany({ where: { orgId: org.id } })')
    expect(source).toContain('await tx.inventoryProductExtension.deleteMany({ where: { orgId: org.id } })')
    expect(source).toContain('code: { notIn: CANONICAL_DEMO_PRODUCTS.map')
    expect(source).toContain('code: { not: CANONICAL_DEMO_WAREHOUSE.code }')
    expect(source).not.toContain('tx.organization.delete')
    expect(source).not.toContain('tx.user.delete')
    expect(source).not.toContain('tx.role.delete')
    expect(source).not.toContain('tx.permission.delete')
    expect(source).not.toContain('process.argv.slice(2)[0]')
  })

  it('repairs canonical demo Business Object and Inventory data after reset', () => {
    expect(source).toContain('CANONICAL_DEMO_PRODUCTS')
    expect(source).toContain('CANONICAL_DEMO_CATEGORY')
    expect(source).toContain('CANONICAL_DEMO_WAREHOUSE')
    expect(source).toContain('CANONICAL_DEMO_SUPPLIER')
    expect(source).toContain('tx.inventoryProductExtension.create')
    expect(source).toContain('tx.stockAdjustment.create')
    expect(source).toContain('tx.stockMovement.create')
    expect(source).toContain('tx.stockBalance.create')
    expect(source).not.toContain("spawn('npm', ['run', 'demo:provision']")
    expect(source).toContain('checksFromDemoData(await createLiveDemoDataSnapshot(env))')
  })

  it('builds deterministic recent canonical activity with exact final balances', () => {
    const now = new Date('2026-07-24T23:59:59.999Z')
    const first = buildCanonicalDemoActivity(now)
    const second = buildCanonicalDemoActivity(now)

    expect(second).toEqual(first)
    expect(Object.keys(first)).toEqual(CANONICAL_DEMO_PRODUCTS.map((product) => product.code))

    for (const product of CANONICAL_DEMO_PRODUCTS) {
      const activity = first[product.code]
      expect(activity).toHaveLength(3)
      expect(activity[0].quantityBefore).toBe('0')
      expect(activity.at(-1)?.quantityAfter).toBe(product.quantity)
      expect(activity.every((step) => step.occurredAt <= now)).toBe(true)
      expect(activity.every((step) => step.occurredAt >= new Date('2026-06-25T00:00:00.000Z'))).toBe(true)
      expect(activity.map((step) => stockMovementType(step.quantityBefore, step.quantityAfter))).toEqual([
        'opening_balance',
        'adjustment_in',
        'adjustment_out',
      ])
      expect(activity.every((step) => Number(step.quantityBefore) >= 0 && Number(step.quantityAfter) >= 0)).toBe(true)
    }
  })

  it('uses the injected reset clock and persists matching Adjustment and Movement dates', () => {
    expect(source).toContain('options: { now?: Date } = {}')
    expect(source).toContain('buildCanonicalDemoActivity(options.now ?? new Date())')
    expect(source).toContain('{ timeout: 20_000 }')
    expect(source).toContain('createdAt: activity.occurredAt')
    expect(source).toContain('occurredAt: activity.occurredAt')
    expect(source).toContain("notes: 'sandbox-demo-canonical-activity'")
  })
})
