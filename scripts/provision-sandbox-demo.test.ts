import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

const source = readFileSync(join(process.cwd(), 'scripts/provision-sandbox-demo.ts'), 'utf8')
const demoOpsSource = readFileSync(join(process.cwd(), 'scripts/demo-ops.ts'), 'utf8')

function warehouseProfileSource() {
  const match = demoOpsSource.match(/const WAREHOUSE_OPERATOR_PERMISSION_PROFILE = \[([\s\S]*?)\] as const/)
  return match?.[1] ?? ''
}

describe('sandbox demo provisioning source contract', () => {
  it('requires the Warehouse Operator sandbox env vars without printing secret values', () => {
    expect(source).toContain('ONEDAYOS_DEMO_WAREHOUSE_EMAIL')
    expect(source).toContain('ONEDAYOS_DEMO_WAREHOUSE_PASSWORD')
    expect(source).toContain('ONEDAYOS_DEMO_WAREHOUSE_NAME')
    expect(demoOpsSource).toContain('WAREHOUSE_OPERATOR_ROLE_NAME')
    expect(source).not.toContain('console.log(env.ONEDAYOS_DEMO_WAREHOUSE_PASSWORD)')
  })

  it('keeps the Warehouse Operator role least-privilege', () => {
    const profile = warehouseProfileSource()

    expect(profile).toContain('INVENTORY_PERMISSIONS.DASHBOARD_READ')
    expect(profile).toContain('INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ')
    expect(profile).toContain('INVENTORY_PERMISSIONS.STOCK_LEVEL_READ')
    expect(profile).toContain('INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ')
    expect(profile).toContain('INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ')
    expect(profile).toContain('INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE')
    expect(profile).toContain('PRODUCT_PERMISSIONS.READ')
    expect(profile).toContain('PRODUCT_CATEGORY_PERMISSIONS.READ')
    expect(profile).toContain('SUPPLIER_PERMISSIONS.READ')
    expect(profile).toContain('WAREHOUSE_PERMISSIONS.READ')
    expect(profile).not.toContain('PRODUCT_SETTING_UPDATE')
    expect(profile).not.toContain('EMPLOYEE_PERMISSIONS')
    expect(profile).not.toContain('CUSTOMER_PERMISSIONS')
    expect(profile).not.toContain("module: '*'")
    expect(profile).not.toContain("resource: '*'")
    expect(profile).not.toContain("action: '*'")
    expect(profile).not.toContain("resource: 'organization'")
  })

  it('repairs stale Warehouse Operator permissions back to the approved profile', () => {
    expect(source).toContain('staleWarehousePermissionIds')
    expect(source).toContain('approvedWarehousePermissionKeys')
    expect(source).toContain('tx.permission.deleteMany')
    expect(source).toContain('warehouseOrgAdminPermissionCount')
    expect(source).toContain('warehouseWildcardPermissionCount')
  })

  it('provisions idempotent persisted canonical activity rather than chart-only data', () => {
    expect(source).toContain('buildCanonicalDemoActivity(new Date())')
    expect(source).toContain('for (const productInput of CANONICAL_DEMO_PRODUCTS)')
    expect(source).toContain('for (const activity of canonicalActivity[productInput.code])')
    expect(source).toContain('tx.stockAdjustment.create')
    expect(source).toContain('tx.stockMovement.create')
    expect(source).toContain('occurredAt: activity.occurredAt')
    expect(source).toContain('if (!existingBalance)')
    expect(source).not.toContain('const demoProducts = [')
  })
})
