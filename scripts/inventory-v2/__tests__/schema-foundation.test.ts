import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Inventory V2 additive Prisma schema', () => {
  const schema = readFileSync(join(process.cwd(), 'prisma/schema.prisma'), 'utf8')
  const transaction = schema.match(/model InventoryTransaction \{[\s\S]*?\n\}/)?.[0] ?? ''
  const line = schema.match(/model InventoryTransactionLine \{[\s\S]*?\n\}/)?.[0] ?? ''

  it('defines the frozen transaction enums and models', () => {
    expect(schema).toContain('enum InventoryTransactionType')
    expect(schema).toContain('RECEIPT')
    expect(schema).toContain('ISSUE')
    expect(schema).toContain('TRANSFER')
    expect(schema).toContain('ADJUSTMENT')
    expect(schema).toContain('enum InventoryTransactionStatus')
    expect(schema).toContain('POSTED')
    expect(schema).toContain('REVERSED')
    expect(schema).toContain('model InventoryTransaction {')
    expect(schema).toContain('model InventoryTransactionLine {')
  })

  it('retains legacy adjustment provenance and nullable movement links', () => {
    expect(schema).toContain('model StockAdjustment {')
    expect(schema).toContain('sourceType                 String?')
    expect(schema).toContain('sourceId                   String?')
    expect(schema).toContain('inventoryTransactionId     String?')
    expect(schema).toContain('inventoryTransactionLineId String?')
  })

  it('uses the exact posted-only transaction shape and tenant relations', () => {
    for (const field of [
      'transactionNumber',
      'referenceNumber',
      'referenceDate',
      'supplierId',
      'customerId',
      'warehouseId',
      'sourceWarehouseId',
      'destinationWarehouseId',
      'postedAt',
      'postedByUserId',
      'reversalOfTransactionId',
      'idempotencyKeyHash      String?',
      'requestHash             String?',
    ]) {
      expect(transaction).toContain(field)
    }
    expect(transaction).not.toMatch(/\b(?:draft|approval|voidedAt|voidedBy|voidReason|deletedAt)\b/i)
    expect(transaction).toContain('@@unique([orgId, transactionNumber])')
    expect(transaction).toContain('@@unique([orgId, idempotencyKeyHash])')
    expect(transaction).toContain('@@unique([reversalOfTransactionId, orgId])')
    expect(transaction).toContain('fields: [postedByUserId, orgId], references: [id, orgId]')
    expect(transaction).toContain('fields: [reversalOfTransactionId, orgId], references: [id, orgId]')
  })

  it('requires the unit snapshot and composite movement identity', () => {
    expect(line).toContain('orgId         String')
    expect(line).toContain('quantity      Decimal  @db.Decimal(18, 4)')
    expect(line).toContain('unit          String')
    expect(line).not.toContain('unit          String?')
    expect(line).toContain('@@unique([id, transactionId, orgId])')
    expect(line).toContain('@@unique([orgId, transactionId, lineNumber])')
    expect(schema).toContain(
      'fields: [inventoryTransactionLineId, inventoryTransactionId, orgId], references: [id, transactionId, orgId]',
    )
  })
})
