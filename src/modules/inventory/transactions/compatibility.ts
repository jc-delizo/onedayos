type CanonicalTransaction = Record<string, unknown>

export function projectCanonicalAdjustmentToLegacy(transaction: CanonicalTransaction) {
  const lines = Array.isArray(transaction.lines) ? transaction.lines : []
  return lines.map((line) => ({
    id: line && typeof line === 'object' ? (line as CanonicalTransaction).id : undefined,
    productId: line && typeof line === 'object' ? (line as CanonicalTransaction).productId : undefined,
    warehouseId: transaction.warehouseId,
    quantityAfter: line && typeof line === 'object' ? (line as CanonicalTransaction).quantity : undefined,
    reason: transaction.reason,
    notes: line && typeof line === 'object' ? (line as CanonicalTransaction).notes : undefined,
    status: String(transaction.status ?? '').toLowerCase(),
    createdAt: transaction.postedAt,
    createdBy: transaction.postedByUserId,
  }))
}

export function projectCanonicalMovementToLegacy(movement: CanonicalTransaction) {
  return {
    ...movement,
    sourceType: 'inventory_transaction',
    sourceId: movement.inventoryTransactionId,
  }
}

export function projectLegacyAdjustmentToCanonicalSummary(adjustment: CanonicalTransaction) {
  return {
    id: `legacy:${String(adjustment.id)}`,
    canonicalSource: 'legacy_stock_adjustment',
    legacyId: adjustment.id,
    type: 'ADJUSTMENT',
    status: String(adjustment.status ?? 'posted').toUpperCase(),
    transactionNumber: null,
    warehouseId: adjustment.warehouseId,
    reason: adjustment.reason,
    notes: adjustment.notes,
    postedAt: adjustment.createdAt,
    postedByUserId: adjustment.createdBy,
    lines: [{
      id: `legacy:${String(adjustment.id)}:1`,
      productId: adjustment.productId,
      quantity: adjustment.quantityAfter,
      lineNumber: 1,
    }],
  }
}
