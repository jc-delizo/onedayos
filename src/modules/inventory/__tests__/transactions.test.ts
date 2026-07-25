import { describe, expect, it } from 'vitest'
import {
  adjustmentCreateSchema,
  issueCreateSchema,
  receiptCreateSchema,
  reversalCreateSchema,
  transferCreateSchema,
} from '../transactions/schemas'
import { requestHash, requireIdempotencyKey, reversalTransactionNumber, sha256, transactionNumber, utcDate } from '../transactions/security'
import { decimal, scaled } from '../transactions/decimal'

const line = { productId: 'product-1', quantity: '1.2500', unit: 'pcs' }

describe('inventory V2 transaction schemas', () => {
  it('accepts each strict type-specific shape', () => {
    expect(receiptCreateSchema.parse({ warehouseId: 'warehouse-1', supplierId: 'supplier-1', lines: [line] }).lines).toHaveLength(1)
    expect(issueCreateSchema.parse({ warehouseId: 'warehouse-1', customerId: 'customer-1', lines: [line] }).lines).toHaveLength(1)
    expect(transferCreateSchema.parse({ sourceWarehouseId: 'warehouse-1', destinationWarehouseId: 'warehouse-2', lines: [line] }).lines).toHaveLength(1)
    expect(adjustmentCreateSchema.parse({ warehouseId: 'warehouse-1', reason: 'Count', lines: [{ productId: line.productId, countedQuantity: '0', unit: line.unit }] }).lines).toHaveLength(1)
    expect(reversalCreateSchema.parse({ reason: 'Posting correction' })).toEqual({ reason: 'Posting correction' })
  })

  it('rejects tenant identity, unknown keys, duplicates, bad precision, and invalid transfer shape', () => {
    expect(receiptCreateSchema.safeParse({ orgId: 'org-a', warehouseId: 'warehouse-1', lines: [line] }).success).toBe(false)
    expect(receiptCreateSchema.safeParse({ warehouseId: 'warehouse-1', lines: [line, line] }).success).toBe(false)
    expect(receiptCreateSchema.safeParse({ warehouseId: 'warehouse-1', lines: [{ ...line, quantity: '1.00001' }] }).success).toBe(false)
    expect(transferCreateSchema.safeParse({ sourceWarehouseId: 'warehouse-1', destinationWarehouseId: 'warehouse-1', lines: [line] }).success).toBe(false)
  })

  it('enforces the clarified one-to-one-hundred line boundary before database work', () => {
    expect(receiptCreateSchema.safeParse({ warehouseId: 'warehouse-1', lines: [] }).success).toBe(false)
    const hundred = Array.from({ length: 100 }, (_, index) => ({ ...line, productId: `product-${index}` }))
    expect(receiptCreateSchema.safeParse({ warehouseId: 'warehouse-1', lines: hundred }).success).toBe(true)
    expect(receiptCreateSchema.safeParse({ warehouseId: 'warehouse-1', lines: [...hundred, { ...line, productId: 'overflow' }] }).success).toBe(false)
  })
})

describe('inventory V2 deterministic utilities', () => {
  it('hashes normalized objects stably without retaining the raw idempotency key', () => {
    expect(requestHash('receipt', { b: 2, a: { d: 4, c: 3 } }))
      .toBe(requestHash('receipt', { a: { c: 3, d: 4 }, b: 2 }))
    expect(sha256('secret-key')).toMatch(/^[0-9a-f]{64}$/)
    expect(requireIdempotencyKey('key-1')).toBe('key-1')
    expect(() => requireIdempotencyKey(null)).toThrow(/Idempotency-Key/)
  })

  it('uses accepted numbers, UTC dates, and exact four-place decimal arithmetic', () => {
    const fixedEntropy = () => Buffer.from('0123456789abcdef', 'hex')
    expect(transactionNumber('RECEIPT', new Date('2026-12-31T23:59:59Z'), fixedEntropy)).toBe('REC-2026-0123456789ABCDEF')
    expect(reversalTransactionNumber(new Date('2026-01-01T00:00:00Z'), fixedEntropy)).toBe('REV-2026-0123456789ABCDEF')
    expect(utcDate('2026-07-25')?.toISOString()).toBe('2026-07-25T00:00:00.000Z')
    expect(decimal(scaled('10.1250') - scaled('0.125'))).toBe('10')
  })
})
