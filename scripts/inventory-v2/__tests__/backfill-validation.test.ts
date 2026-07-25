import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { legacyAdjustmentTransactionNumber } from '../backfill-id'
import { validateLegacyAdjustmentBackfill } from '../backfill-validation'
import type { BackfillInput } from '../backfill-types'

function fixture(): BackfillInput {
  return {
    organizations: [{ id: 'org-a' }],
    products: [{ id: 'product-a', orgId: 'org-a', unit: 'pcs', isActive: true, deletedAt: null }],
    warehouses: [{ id: 'warehouse-a', orgId: 'org-a', isActive: true, deletedAt: null }],
    users: [{ id: 'user-a', orgId: 'org-a', isActive: true, deletedAt: null }],
    adjustments: [{
      id: 'adjustment-a',
      orgId: 'org-a',
      productId: 'product-a',
      warehouseId: 'warehouse-a',
      quantityBefore: '5.0000',
      quantityAfter: '8.2500',
      quantityDelta: '3.2500',
      reason: 'Count correction',
      notes: null,
      status: 'posted',
      createdBy: 'user-a',
      createdAt: new Date('2026-07-24T23:30:00.000Z'),
      deletedAt: null,
      deletedBy: null,
    }],
    movements: [{
      id: 'movement-a',
      orgId: 'org-a',
      productId: 'product-a',
      warehouseId: 'warehouse-a',
      type: 'adjustment_in',
      quantityDelta: '3.2500',
      resultingQuantity: '8.2500',
      sourceType: 'stock_adjustment',
      sourceId: 'adjustment-a',
      createdBy: 'user-a',
      occurredAt: new Date('2026-07-24T23:30:01.000Z'),
    }],
    balances: [{ orgId: 'org-a', productId: 'product-a', warehouseId: 'warehouse-a', quantity: '8.2500' }],
  }
}

describe('legacy adjustment backfill preflight', () => {
  it('produces the frozen deterministic mapping without raw org/adjustment references', () => {
    const input = fixture()
    const report = validateLegacyAdjustmentBackfill(input)

    expect(report).toMatchObject({ mode: 'read-only-preflight', validCount: 1, invalidCount: 0, warningCount: 0 })
    expect(report.mappings[0]).toMatchObject({
      transactionId: 'adjustment-a',
      lineId: 'legacy-adjustment-line:adjustment-a',
      transactionNumber: legacyAdjustmentTransactionNumber('org-a', 'adjustment-a', input.adjustments[0].createdAt),
      movementId: 'movement-a',
      lineQuantity: '8.2500',
      unit: 'pcs',
      postedAt: '2026-07-24T23:30:00.000Z',
      referenceDate: null,
    })
    expect(JSON.stringify(report.issues)).not.toContain('org-a')
  })

  const invalidCases: Array<[string, (input: BackfillInput) => void, string]> = [
    ['missing organization', (input: BackfillInput) => { input.organizations = [] }, 'ORGANIZATION_MISSING'],
    ['missing product', (input: BackfillInput) => { input.products = [] }, 'PRODUCT_MISSING'],
    ['cross-tenant product', (input: BackfillInput) => { input.products[0].orgId = 'org-b' }, 'PRODUCT_TENANT_MISMATCH'],
    ['inactive product', (input: BackfillInput) => { input.products[0].isActive = false }, 'PRODUCT_NOT_ACTIVE'],
    ['empty unit', (input: BackfillInput) => { input.products[0].unit = ' ' }, 'PRODUCT_UNIT_EMPTY'],
    ['missing warehouse', (input: BackfillInput) => { input.warehouses = [] }, 'WAREHOUSE_MISSING'],
    ['cross-tenant warehouse', (input: BackfillInput) => { input.warehouses[0].orgId = 'org-b' }, 'WAREHOUSE_TENANT_MISMATCH'],
    ['deleted warehouse', (input: BackfillInput) => { input.warehouses[0].deletedAt = new Date() }, 'WAREHOUSE_NOT_ACTIVE'],
    ['missing actor', (input: BackfillInput) => { input.users = [] }, 'ACTOR_MISSING'],
    ['cross-tenant actor', (input: BackfillInput) => { input.users[0].orgId = 'org-b' }, 'ACTOR_TENANT_MISMATCH'],
    ['inactive actor', (input: BackfillInput) => { input.users[0].isActive = false }, 'ACTOR_NOT_ACTIVE'],
    ['unposted adjustment', (input: BackfillInput) => { input.adjustments[0].status = 'draft' }, 'ADJUSTMENT_NOT_POSTED'],
    ['invalid precision', (input: BackfillInput) => { input.adjustments[0].quantityAfter = '8.25001' }, 'ADJUSTMENT_DECIMAL_INVALID'],
    ['negative before', (input: BackfillInput) => { input.adjustments[0].quantityBefore = '-1.0000'; input.adjustments[0].quantityDelta = '9.2500'; input.movements[0].quantityDelta = '9.2500' }, 'ADJUSTMENT_RESULT_NEGATIVE'],
    ['zero delta', (input: BackfillInput) => { input.adjustments[0].quantityBefore = '8.2500'; input.adjustments[0].quantityDelta = '0.0000'; input.movements[0].quantityDelta = '0.0000' }, 'ADJUSTMENT_ZERO_DELTA'],
    ['negative result', (input: BackfillInput) => { input.adjustments[0].quantityAfter = '-1.0000'; input.adjustments[0].quantityDelta = '-6.0000'; input.movements[0].quantityDelta = '-6.0000'; input.movements[0].resultingQuantity = '-1.0000' }, 'ADJUSTMENT_RESULT_NEGATIVE'],
    ['arithmetic mismatch', (input: BackfillInput) => { input.adjustments[0].quantityDelta = '2.0000' }, 'ADJUSTMENT_ARITHMETIC_MISMATCH'],
    ['missing movement', (input: BackfillInput) => { input.movements = [] }, 'MOVEMENT_MISSING'],
    ['duplicate movement', (input: BackfillInput) => { input.movements.push({ ...input.movements[0], id: 'movement-b' }) }, 'MOVEMENT_DUPLICATE'],
    ['movement tenant mismatch', (input: BackfillInput) => { input.movements[0].orgId = 'org-b' }, 'MOVEMENT_TENANT_MISMATCH'],
    ['movement product mismatch', (input: BackfillInput) => { input.movements[0].productId = 'product-b' }, 'MOVEMENT_PRODUCT_MISMATCH'],
    ['movement warehouse mismatch', (input: BackfillInput) => { input.movements[0].warehouseId = 'warehouse-b' }, 'MOVEMENT_WAREHOUSE_MISMATCH'],
    ['movement actor mismatch', (input: BackfillInput) => { input.movements[0].createdBy = 'user-b' }, 'MOVEMENT_ACTOR_MISMATCH'],
    ['movement type mismatch', (input: BackfillInput) => { input.movements[0].type = 'adjustment_out' }, 'MOVEMENT_TYPE_MISMATCH'],
    ['movement chronology mismatch', (input: BackfillInput) => { input.movements[0].occurredAt = new Date('2026-07-24T23:29:59.000Z') }, 'MOVEMENT_CHRONOLOGY_MISMATCH'],
    ['movement delta mismatch', (input: BackfillInput) => { input.movements[0].quantityDelta = '2.0000' }, 'MOVEMENT_DELTA_MISMATCH'],
    ['movement result mismatch', (input: BackfillInput) => { input.movements[0].resultingQuantity = '7.0000' }, 'MOVEMENT_RESULT_MISMATCH'],
    ['missing balance', (input: BackfillInput) => { input.balances = [] }, 'STOCK_BALANCE_MISSING'],
    ['final balance mismatch', (input: BackfillInput) => { input.balances[0].quantity = '7.0000' }, 'STOCK_BALANCE_MISMATCH'],
  ]

  it.each(invalidCases)('rejects %s', (_label, mutate, code) => {
    const input = fixture()
    mutate(input)
    const report = validateLegacyAdjustmentBackfill(input)
    expect(report.invalidCount).toBeGreaterThan(0)
    expect(report.issues.map((entry) => entry.code)).toContain(code)
    expect(report.mappings).toHaveLength(0)
  })

  it('allows a missing legacy resulting quantity with a warning', () => {
    const input = fixture()
    input.movements[0].resultingQuantity = null
    const report = validateLegacyAdjustmentBackfill(input)
    expect(report).toMatchObject({ validCount: 1, invalidCount: 0, warningCount: 1 })
    expect(report.issues[0].code).toBe('MOVEMENT_RESULT_UNRECORDED')
  })

  it('stops on orphan movement provenance and deterministic collisions', () => {
    const orphanInput = fixture()
    orphanInput.movements[0].sourceId = 'missing-adjustment'
    expect(validateLegacyAdjustmentBackfill(orphanInput).issues.map(({ code }) => code)).toEqual(
      expect.arrayContaining(['ORPHAN_ADJUSTMENT_MOVEMENT', 'MOVEMENT_MISSING']),
    )

    const collisionInput = fixture()
    collisionInput.adjustments.push({ ...collisionInput.adjustments[0] })
    const collisionReport = validateLegacyAdjustmentBackfill(collisionInput)
    expect(collisionReport.issues.map(({ code }) => code)).toContain('DETERMINISTIC_MAPPING_COLLISION')
  })

  it('is repeatable and separates organization summaries', () => {
    const input = fixture()
    input.organizations.push({ id: 'org-b' })
    input.products.push({ ...input.products[0], id: 'product-b', orgId: 'org-b' })
    input.warehouses.push({ ...input.warehouses[0], id: 'warehouse-b', orgId: 'org-b' })
    input.users.push({ ...input.users[0], id: 'user-b', orgId: 'org-b' })
    input.adjustments.push({
      ...input.adjustments[0],
      id: 'adjustment-b',
      orgId: 'org-b',
      productId: 'product-b',
      warehouseId: 'warehouse-b',
      createdBy: 'user-b',
    })
    input.movements.push({
      ...input.movements[0],
      id: 'movement-b',
      orgId: 'org-b',
      productId: 'product-b',
      warehouseId: 'warehouse-b',
      sourceId: 'adjustment-b',
      createdBy: 'user-b',
    })
    input.balances.push({ orgId: 'org-b', productId: 'product-b', warehouseId: 'warehouse-b', quantity: '8.2500' })

    const first = validateLegacyAdjustmentBackfill(input)
    const second = validateLegacyAdjustmentBackfill(input)
    expect(second).toEqual(first)
    expect(first).toMatchObject({ validCount: 2, invalidCount: 0 })
    expect(first.organizations).toHaveLength(2)
  })

  it('rejects a broken movement chain', () => {
    const input = fixture()
    input.movements.unshift({
      ...input.movements[0],
      id: 'opening',
      quantityDelta: '4.0000',
      resultingQuantity: '4.0000',
      sourceType: 'opening_balance',
      sourceId: null,
      occurredAt: new Date('2026-07-20T00:00:00.000Z'),
    })
    const report = validateLegacyAdjustmentBackfill(input)
    expect(report.issues.map(({ code }) => code)).toContain('MOVEMENT_CHAIN_MISMATCH')
    expect(report.invalidCount).toBe(1)
  })

  it('contains no database mutation call in the executable preflight', () => {
    const source = readFileSync(join(process.cwd(), 'scripts/inventory-v2/backfill-preflight.ts'), 'utf8')
    expect(source).toContain('findMany')
    expect(source).not.toMatch(/\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/)
  })
})
