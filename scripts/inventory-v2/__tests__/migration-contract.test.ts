import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'

describe('Inventory V2 foundation migration', () => {
  const migrationRoot = join(process.cwd(), 'prisma/migrations')
  const directories = readdirSync(migrationRoot).filter((name) =>
    name.endsWith('_inventory_v2_transaction_foundation'),
  )

  it('has exactly one additive migration package', () => {
    expect(directories).toHaveLength(1)
  })

  const sql = readFileSync(join(migrationRoot, directories[0], 'migration.sql'), 'utf8')

  it('creates the frozen enums, tables, tenant-safe keys, and constraints', () => {
    for (const required of [
      `CREATE TYPE "InventoryTransactionType" AS ENUM ('RECEIPT', 'ISSUE', 'TRANSFER', 'ADJUSTMENT')`,
      `CREATE TYPE "InventoryTransactionStatus" AS ENUM ('POSTED', 'REVERSED')`,
      'CREATE TABLE "inventory_transactions"',
      'CREATE TABLE "inventory_transaction_lines"',
      '"referenceDate" DATE',
      '"quantity" DECIMAL(18,4) NOT NULL',
      'inventory_transactions_orgId_transactionNumber_key',
      'inventory_transactions_orgId_idempotencyKeyHash_key',
      'inventory_transactions_reversalOfTransactionId_orgId_key',
      'inventory_transaction_lines_orgId_transactionId_lineNumber_key',
      'stock_movements_inventoryTransactionId_orgId_fkey',
      'stock_movements_inventoryTransactionLineId_inventoryTransa_fkey',
      'inventory_transactions_postedByUserId_orgId_fkey',
      'inventory_transactions_number_format_check',
      'inventory_transactions_warehouse_party_shape_check',
      'inventory_transactions_distinct_transfer_warehouses_check',
      'inventory_transactions_not_self_reversal_check',
      'inventory_transactions_reversal_contract_check',
      'inventory_transactions_idempotency_pair_check',
      'inventory_transaction_lines_unit_nonempty_check',
      'inventory_transaction_lines_line_number_positive_check',
      'inventory_transaction_lines_quantity_nonnegative_check',
      'stock_movements_inventory_link_pair_check',
    ]) {
      expect(sql).toContain(required)
    }
  })

  it('is expand-only and contains no data mutation or demo payload', () => {
    expect(sql).not.toMatch(/\bDROP\s+(?:TABLE|COLUMN)\b/i)
    expect(sql).not.toMatch(/\b(?:DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+\S+\s+SET|TRUNCATE)\b/i)
    expect(sql).not.toMatch(/\bCREATE\s+EXTENSION\b/i)
    expect(sql).not.toMatch(/demo|seed/i)
    expect(sql).not.toMatch(/ALTER TABLE "stock_movements".*DROP/s)
  })
})
