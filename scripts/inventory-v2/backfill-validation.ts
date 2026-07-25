import {
  legacyAdjustmentLineId,
  legacyAdjustmentTransactionNumber,
  sanitizedRef,
} from './backfill-id'
import type {
  BackfillInput,
  BackfillIssue,
  BackfillMapping,
  BackfillOrganizationSummary,
  BackfillPreflightReport,
  LegacyStockAdjustment,
} from './backfill-types'

const DECIMAL_18_4 = /^-?\d{1,14}(?:\.\d{1,4})?$/

function toScaledDecimal(value: string): bigint | null {
  if (!DECIMAL_18_4.test(value)) return null
  const negative = value.startsWith('-')
  const unsigned = negative ? value.slice(1) : value
  const [whole, fraction = ''] = unsigned.split('.')
  const scaled = BigInt(whole) * 10_000n + BigInt(fraction.padEnd(4, '0'))
  return negative ? -scaled : scaled
}

function issue(
  severity: BackfillIssue['severity'],
  code: string,
  adjustment: LegacyStockAdjustment,
  movementId?: string,
): BackfillIssue {
  return {
    severity,
    code,
    orgRef: sanitizedRef('org', adjustment.orgId),
    adjustmentRef: sanitizedRef('adjustment', adjustment.id),
    ...(movementId ? { movementRef: sanitizedRef('movement', movementId) } : {}),
  }
}

export function validateLegacyAdjustmentBackfill(input: BackfillInput): BackfillPreflightReport {
  const organizations = new Set(input.organizations.map(({ id }) => id))
  const products = new Map(input.products.map((record) => [record.id, record]))
  const warehouses = new Map(input.warehouses.map((record) => [record.id, record]))
  const users = new Map(input.users.map((record) => [record.id, record]))
  const balances = new Map(
    input.balances.map((record) => [`${record.orgId}:${record.productId}:${record.warehouseId}`, record]),
  )
  const movementsBySource = new Map<string, typeof input.movements>()

  for (const movement of input.movements) {
    if (movement.sourceType === 'stock_adjustment' && movement.sourceId) {
      const existing = movementsBySource.get(movement.sourceId) ?? []
      existing.push(movement)
      movementsBySource.set(movement.sourceId, existing)
    }
  }

  const issues: BackfillIssue[] = []
  const mappings: BackfillMapping[] = []
  const outcomeByAdjustment = new Map<string, { orgId: string; valid: boolean; warnings: number }>()
  const seenTransactionIds = new Set<string>()
  const seenLineIds = new Set<string>()
  const seenNumbers = new Set<string>()
  const adjustmentIds = new Set(input.adjustments.map(({ id }) => id))

  for (const movement of input.movements) {
    if (
      movement.sourceType === 'stock_adjustment' &&
      movement.sourceId &&
      !adjustmentIds.has(movement.sourceId)
    ) {
      issues.push({
        severity: 'invalid',
        code: 'ORPHAN_ADJUSTMENT_MOVEMENT',
        orgRef: sanitizedRef('org', movement.orgId),
        movementRef: sanitizedRef('movement', movement.id),
      })
    }
  }

  for (const adjustment of input.adjustments) {
    const before = toScaledDecimal(adjustment.quantityBefore)
    const after = toScaledDecimal(adjustment.quantityAfter)
    const delta = toScaledDecimal(adjustment.quantityDelta)
    const product = products.get(adjustment.productId)
    const warehouse = warehouses.get(adjustment.warehouseId)
    const actor = users.get(adjustment.createdBy)
    const movements = movementsBySource.get(adjustment.id) ?? []
    const localIssues: BackfillIssue[] = []

    if (!organizations.has(adjustment.orgId)) localIssues.push(issue('invalid', 'ORGANIZATION_MISSING', adjustment))
    if (!product) localIssues.push(issue('invalid', 'PRODUCT_MISSING', adjustment))
    else {
      if (product.orgId !== adjustment.orgId) localIssues.push(issue('invalid', 'PRODUCT_TENANT_MISMATCH', adjustment))
      if (!product.isActive || product.deletedAt) localIssues.push(issue('invalid', 'PRODUCT_NOT_ACTIVE', adjustment))
      if (!product.unit.trim()) localIssues.push(issue('invalid', 'PRODUCT_UNIT_EMPTY', adjustment))
    }
    if (!warehouse) localIssues.push(issue('invalid', 'WAREHOUSE_MISSING', adjustment))
    else {
      if (warehouse.orgId !== adjustment.orgId) localIssues.push(issue('invalid', 'WAREHOUSE_TENANT_MISMATCH', adjustment))
      if (!warehouse.isActive || warehouse.deletedAt) localIssues.push(issue('invalid', 'WAREHOUSE_NOT_ACTIVE', adjustment))
    }
    if (!actor) localIssues.push(issue('invalid', 'ACTOR_MISSING', adjustment))
    else {
      if (actor.orgId !== adjustment.orgId) localIssues.push(issue('invalid', 'ACTOR_TENANT_MISMATCH', adjustment))
      if (!actor.isActive || actor.deletedAt) localIssues.push(issue('invalid', 'ACTOR_NOT_ACTIVE', adjustment))
    }
    if (adjustment.status !== 'posted' || adjustment.deletedAt || adjustment.deletedBy) {
      localIssues.push(issue('invalid', 'ADJUSTMENT_NOT_POSTED', adjustment))
    }
    if (before === null || after === null || delta === null) {
      localIssues.push(issue('invalid', 'ADJUSTMENT_DECIMAL_INVALID', adjustment))
    } else {
      if (before < 0n || after < 0n) localIssues.push(issue('invalid', 'ADJUSTMENT_RESULT_NEGATIVE', adjustment))
      if (delta === 0n) localIssues.push(issue('invalid', 'ADJUSTMENT_ZERO_DELTA', adjustment))
      if (after - before !== delta) localIssues.push(issue('invalid', 'ADJUSTMENT_ARITHMETIC_MISMATCH', adjustment))
    }
    if (movements.length !== 1) {
      localIssues.push(issue('invalid', movements.length === 0 ? 'MOVEMENT_MISSING' : 'MOVEMENT_DUPLICATE', adjustment))
    }

    const movement = movements.length === 1 ? movements[0] : undefined
    if (movement) {
      const movementDelta = toScaledDecimal(movement.quantityDelta)
      const movementResult =
        movement.resultingQuantity === null ? null : toScaledDecimal(movement.resultingQuantity)
      if (movement.orgId !== adjustment.orgId) localIssues.push(issue('invalid', 'MOVEMENT_TENANT_MISMATCH', adjustment, movement.id))
      if (movement.productId !== adjustment.productId) localIssues.push(issue('invalid', 'MOVEMENT_PRODUCT_MISMATCH', adjustment, movement.id))
      if (movement.warehouseId !== adjustment.warehouseId) localIssues.push(issue('invalid', 'MOVEMENT_WAREHOUSE_MISMATCH', adjustment, movement.id))
      if (movement.createdBy !== adjustment.createdBy) localIssues.push(issue('invalid', 'MOVEMENT_ACTOR_MISMATCH', adjustment, movement.id))
      if (movement.occurredAt < adjustment.createdAt) localIssues.push(issue('invalid', 'MOVEMENT_CHRONOLOGY_MISMATCH', adjustment, movement.id))
      if (before !== null && after !== null && delta !== null) {
        const expectedType =
          before === 0n && after > 0n ? 'opening_balance' : delta > 0n ? 'adjustment_in' : 'adjustment_out'
        if (movement.type !== expectedType) localIssues.push(issue('invalid', 'MOVEMENT_TYPE_MISMATCH', adjustment, movement.id))
      }
      if (movementDelta === null || delta === null || movementDelta !== delta) {
        localIssues.push(issue('invalid', 'MOVEMENT_DELTA_MISMATCH', adjustment, movement.id))
      }
      if (movement.resultingQuantity === null) {
        localIssues.push(issue('warning', 'MOVEMENT_RESULT_UNRECORDED', adjustment, movement.id))
      } else if (movementResult === null || after === null || movementResult !== after) {
        localIssues.push(issue('invalid', 'MOVEMENT_RESULT_MISMATCH', adjustment, movement.id))
      }
    }

    const transactionId = adjustment.id
    const lineId = legacyAdjustmentLineId(adjustment.id)
    const transactionNumber = legacyAdjustmentTransactionNumber(adjustment.orgId, adjustment.id, adjustment.createdAt)
    if (
      seenTransactionIds.has(transactionId) ||
      seenLineIds.has(lineId) ||
      seenNumbers.has(`${adjustment.orgId}:${transactionNumber}`)
    ) {
      localIssues.push(issue('invalid', 'DETERMINISTIC_MAPPING_COLLISION', adjustment))
    }
    seenTransactionIds.add(transactionId)
    seenLineIds.add(lineId)
    seenNumbers.add(`${adjustment.orgId}:${transactionNumber}`)

    issues.push(...localIssues)
    const valid = !localIssues.some(({ severity }) => severity === 'invalid')
    outcomeByAdjustment.set(adjustment.id, {
      orgId: adjustment.orgId,
      valid,
      warnings: localIssues.filter(({ severity }) => severity === 'warning').length,
    })
    if (valid && product && movement && after !== null) {
      mappings.push({
        orgRef: sanitizedRef('org', adjustment.orgId),
        adjustmentRef: sanitizedRef('adjustment', adjustment.id),
        transactionId,
        transactionNumber,
        lineId,
        movementId: movement.id,
        lineQuantity: adjustment.quantityAfter,
        unit: product.unit,
        postedAt: adjustment.createdAt.toISOString(),
        referenceDate: null,
      })
    }
  }

  const affectedKeys = new Set(
    input.adjustments.map(({ orgId, productId, warehouseId }) => `${orgId}:${productId}:${warehouseId}`),
  )
  for (const key of affectedKeys) {
    const chain = input.movements
      .filter((movement) => `${movement.orgId}:${movement.productId}:${movement.warehouseId}` === key)
      .sort((a, b) => a.occurredAt.getTime() - b.occurredAt.getTime() || a.id.localeCompare(b.id))
    let previousResult: bigint | null = null
    let chainInvalid = false
    for (const movement of chain) {
      const delta = toScaledDecimal(movement.quantityDelta)
      const result = movement.resultingQuantity === null ? null : toScaledDecimal(movement.resultingQuantity)
      const linkedAdjustment = movement.sourceId
        ? input.adjustments.find(({ id }) => id === movement.sourceId)
        : undefined
      const linkedBefore = linkedAdjustment ? toScaledDecimal(linkedAdjustment.quantityBefore) : null
      if (delta === null || (movement.resultingQuantity !== null && result === null)) {
        chainInvalid = true
        break
      }
      if (previousResult !== null && linkedBefore !== null && previousResult !== linkedBefore) {
        chainInvalid = true
        break
      }
      if (previousResult === null && movement.type === 'opening_balance' && result !== null && result !== delta) {
        chainInvalid = true
        break
      }
      if (result === null) {
        previousResult = linkedAdjustment ? toScaledDecimal(linkedAdjustment.quantityAfter) : null
        continue
      }
      if (previousResult !== null && previousResult + delta !== result) {
        chainInvalid = true
        break
      }
      previousResult = result
    }
    const keyAdjustments = input.adjustments.filter(
      ({ orgId, productId, warehouseId }) => `${orgId}:${productId}:${warehouseId}` === key,
    )
    if (keyAdjustments.length === 0) continue
    if (chainInvalid) {
      for (const adjustment of keyAdjustments) issues.push(issue('invalid', 'MOVEMENT_CHAIN_MISMATCH', adjustment))
    }
    const balance = balances.get(key)
    const balanceQuantity = balance ? toScaledDecimal(balance.quantity) : null
    if (!balance) {
      for (const adjustment of keyAdjustments) issues.push(issue('invalid', 'STOCK_BALANCE_MISSING', adjustment))
    }
    else if (balanceQuantity === null || previousResult === null || balanceQuantity !== previousResult) {
      for (const adjustment of keyAdjustments) issues.push(issue('invalid', 'STOCK_BALANCE_MISMATCH', adjustment))
    }
  }

  const globalInvalidAdjustmentIds = new Set(
    issues
      .filter(({ severity, adjustmentRef }) => severity === 'invalid' && adjustmentRef)
      .map(({ adjustmentRef }) => adjustmentRef),
  )
  for (const mapping of [...mappings]) {
    if (globalInvalidAdjustmentIds.has(mapping.adjustmentRef)) {
      mappings.splice(mappings.indexOf(mapping), 1)
      const outcome = outcomeByAdjustment.get(mapping.transactionId)
      if (outcome) outcome.valid = false
    }
  }

  const summary = new Map<string, BackfillOrganizationSummary>()
  for (const { orgId, valid, warnings } of outcomeByAdjustment.values()) {
    const orgRef = sanitizedRef('org', orgId)
    const current = summary.get(orgRef) ?? { orgRef, validCount: 0, invalidCount: 0, warningCount: 0 }
    if (valid) current.validCount += 1
    else current.invalidCount += 1
    current.warningCount += warnings
    summary.set(orgRef, current)
  }

  return {
    mode: 'read-only-preflight',
    validCount: [...outcomeByAdjustment.values()].filter(({ valid }) => valid).length,
    invalidCount:
      [...outcomeByAdjustment.values()].filter(({ valid }) => !valid).length +
      issues.filter(({ code, adjustmentRef }) => code === 'ORPHAN_ADJUSTMENT_MOVEMENT' && !adjustmentRef).length,
    warningCount: issues.filter(({ severity }) => severity === 'warning').length,
    organizations: [...summary.values()].sort((a, b) => a.orgRef.localeCompare(b.orgRef)),
    issues: issues.sort((a, b) =>
      `${a.orgRef}:${a.adjustmentRef ?? ''}:${a.movementRef ?? ''}:${a.code}`.localeCompare(
        `${b.orgRef}:${b.adjustmentRef ?? ''}:${b.movementRef ?? ''}:${b.code}`,
      ),
    ),
    mappings: mappings.sort((a, b) => a.transactionNumber.localeCompare(b.transactionNumber)),
  }
}
