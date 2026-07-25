import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createInventoryTransactionEngine, type InventoryV2Db } from '../../src/modules/inventory/transactions/engine'
import { InventoryTransactionError } from '../../src/modules/inventory/transactions/security'

const url = process.env.INVENTORY_V2_POSTING_TEST_DATABASE_URL
if (!url || process.env.ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED !== 'true') {
  throw new Error('The isolated posting runner requires its dedicated database URL and runtime flag.')
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })
const events: string[] = []
const engine = createInventoryTransactionEngine(prisma as unknown as InventoryV2Db, {
  emit: ({ name }) => { events.push(name) },
})
const actor = { orgId: 'org-a', userId: 'user-a', requestId: 'posting-rehearsal' }

function check(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message)
}

async function expectCode(action: () => Promise<unknown>, code: string) {
  try {
    await action()
  } catch (error) {
    if (error instanceof InventoryTransactionError && error.code === code) return
    throw error
  }
  throw new Error(`Expected ${code}.`)
}

async function balance(productId: string, warehouseId: string): Promise<string> {
  const row = await prisma.stockBalance.findUnique({
    where: { orgId_productId_warehouseId: { orgId: actor.orgId, productId, warehouseId } },
  })
  return row?.quantity.toString() ?? '0'
}

async function main() {
  await prisma.organization.createMany({ data: [
    { id: 'org-a', name: 'Posting Org A', slug: 'posting-org-a' },
    { id: 'org-b', name: 'Posting Org B', slug: 'posting-org-b' },
  ] })
  await prisma.user.createMany({ data: [
    { id: 'user-a', orgId: 'org-a', name: 'Actor A', email: 'actor-a@example.test' },
    { id: 'user-b', orgId: 'org-b', name: 'Actor B', email: 'actor-b@example.test' },
  ] })
  await prisma.product.createMany({ data: [
    { id: 'product-a', orgId: 'org-a', code: 'A', name: 'Product A', unit: 'pcs' },
    { id: 'product-b', orgId: 'org-a', code: 'B', name: 'Product B', unit: 'pcs' },
    { id: 'product-other', orgId: 'org-b', code: 'OTHER', name: 'Other Product', unit: 'pcs' },
  ] })
  await prisma.product.createMany({
    data: Array.from({ length: 100 }, (_, index) => ({
      id: `bulk-${index}`, orgId: 'org-a', code: `BULK-${index}`, name: `Bulk Product ${index}`, unit: 'pcs',
    })),
  })
  await prisma.warehouse.createMany({ data: [
    { id: 'warehouse-a', orgId: 'org-a', code: 'A', name: 'Warehouse A' },
    { id: 'warehouse-b', orgId: 'org-a', code: 'B', name: 'Warehouse B' },
    { id: 'warehouse-other', orgId: 'org-b', code: 'OTHER', name: 'Other Warehouse' },
  ] })
  await prisma.supplier.createMany({ data: [
    { id: 'supplier-a', orgId: 'org-a', name: 'Supplier A' },
    { id: 'supplier-other', orgId: 'org-b', name: 'Other Supplier' },
  ] })
  await prisma.customer.createMany({ data: [
    { id: 'customer-a', orgId: 'org-a', name: 'Customer A' },
    { id: 'customer-other', orgId: 'org-b', name: 'Other Customer' },
  ] })

  const receiptInput = {
    warehouseId: 'warehouse-a', supplierId: 'supplier-a',
    referenceNumber: 'R-1', lines: [
      { productId: 'product-a', quantity: '20', unit: 'pcs' },
      { productId: 'product-b', quantity: '10', unit: 'pcs' },
    ],
  }
  const receipt = await engine.post('RECEIPT', actor, receiptInput, 'receipt-key')
  check(await balance('product-a', 'warehouse-a') === '20', 'Receipt did not create the exact balance.')
  check(await prisma.stockMovement.count({ where: { inventoryTransactionId: String(receipt.id) } }) === 2, 'Receipt linkage is incomplete.')
  const eventCount = events.length
  const replay = await engine.post('RECEIPT', actor, receiptInput, 'receipt-key')
  check(replay.id === receipt.id && events.length === eventCount, 'Idempotent replay reposted or re-emitted.')
  await expectCode(() => engine.post('RECEIPT', actor, { ...receiptInput, referenceNumber: 'changed' }, 'receipt-key'), 'IDEMPOTENCY_KEY_REUSED')
  await expectCode(() => engine.post('RECEIPT', actor, { warehouseId: 'warehouse-other', lines: [receiptInput.lines[0]] }, 'cross-tenant'), 'INVENTORY_REFERENCE_INVALID')

  const issue = await engine.post('ISSUE', actor, {
    warehouseId: 'warehouse-a', customerId: 'customer-a',
    lines: [{ productId: 'product-a', quantity: '3', unit: 'pcs' }],
  }, 'issue-key')
  check(await balance('product-a', 'warehouse-a') === '17', 'Issue did not reduce stock exactly.')
  await expectCode(() => engine.post('ISSUE', actor, {
    warehouseId: 'warehouse-a', lines: [{ productId: 'product-a', quantity: '99', unit: 'pcs' }],
  }, 'overspend-key'), 'INSUFFICIENT_STOCK')
  const beforeRollback = await prisma.inventoryTransaction.count()
  await expectCode(() => engine.post('ISSUE', actor, {
    warehouseId: 'warehouse-a', lines: [
      { productId: 'product-a', quantity: '1', unit: 'pcs' },
      { productId: 'product-b', quantity: '99', unit: 'pcs' },
    ],
  }, 'rollback-key'), 'INSUFFICIENT_STOCK')
  check(await prisma.inventoryTransaction.count() === beforeRollback && await balance('product-a', 'warehouse-a') === '17', 'Failed multi-line issue was not atomic.')

  const transfer = await engine.post('TRANSFER', actor, {
    sourceWarehouseId: 'warehouse-a', destinationWarehouseId: 'warehouse-b',
    lines: [{ productId: 'product-a', quantity: '5', unit: 'pcs' }],
  }, 'transfer-key')
  check(await balance('product-a', 'warehouse-a') === '12' && await balance('product-a', 'warehouse-b') === '5', 'Transfer balances are incorrect.')
  check(await prisma.stockMovement.count({ where: { inventoryTransactionId: String(transfer.id) } }) === 2, 'Transfer did not create paired movements.')

  const adjustment = await engine.post('ADJUSTMENT', actor, {
    warehouseId: 'warehouse-b', reason: 'Counted',
    lines: [{ productId: 'product-a', countedQuantity: '8', unit: 'pcs' }],
  }, 'adjustment-key')
  check(await balance('product-a', 'warehouse-b') === '8', 'Adjustment did not store counted-final quantity.')
  await expectCode(() => engine.post('ADJUSTMENT', actor, {
    warehouseId: 'warehouse-b', reason: 'No change',
    lines: [{ productId: 'product-a', countedQuantity: '8', unit: 'pcs' }],
  }, 'adjustment-noop'), 'CONFLICT')

  const reversed = await engine.reverse(actor, String(adjustment.id), { reason: 'Incorrect count' }, 'reverse-adjustment')
  check(String(reversed.transactionNumber).startsWith('REV-'), 'Reversal number is invalid.')
  check(await balance('product-a', 'warehouse-b') === '5', 'Adjustment reversal did not derive the inverse movement.')
  const original = await prisma.inventoryTransaction.findUnique({ where: { id: String(adjustment.id) } })
  check(original?.status === 'REVERSED', 'Original was not marked REVERSED atomically.')
  await expectCode(() => engine.reverse(actor, String(adjustment.id), { reason: 'Again' }, 'double-reversal'), 'TRANSACTION_ALREADY_REVERSED')
  await expectCode(() => engine.reverse(actor, String(reversed.id), { reason: 'Reverse reversal' }, 'reverse-reversal'), 'TRANSACTION_ALREADY_REVERSED')

  const concurrencySeed = await engine.post('RECEIPT', actor, {
    warehouseId: 'warehouse-a', lines: [{ productId: 'product-a', quantity: '10', unit: 'pcs' }],
  }, 'concurrency-seed')
  check(concurrencySeed.id, 'Concurrency seed failed.')
  const attempts = await Promise.allSettled([
    engine.post('ISSUE', actor, { warehouseId: 'warehouse-a', lines: [{ productId: 'product-a', quantity: '15', unit: 'pcs' }] }, 'concurrent-a'),
    engine.post('ISSUE', actor, { warehouseId: 'warehouse-a', lines: [{ productId: 'product-a', quantity: '15', unit: 'pcs' }] }, 'concurrent-b'),
  ])
  check(attempts.filter((item) => item.status === 'fulfilled').length === 1, 'Concurrent issues did not serialize to one success.')
  check(Number(await balance('product-a', 'warehouse-a')) >= 0, 'Concurrent posting overspent stock.')

  await engine.reverse(actor, String(issue.id), { reason: 'Issue correction' }, 'reverse-issue')
  check(await balance('product-a', 'warehouse-a') === '10', 'Issue reversal did not restore stock.')
  await engine.reverse(actor, String(transfer.id), { reason: 'Transfer correction' }, 'reverse-transfer')
  check(await balance('product-a', 'warehouse-a') === '15' && await balance('product-a', 'warehouse-b') === '0', 'Transfer reversal did not swap the exact warehouse effects.')
  const receiptForReversal = await engine.post('RECEIPT', actor, {
    warehouseId: 'warehouse-a', lines: [{ productId: 'product-b', quantity: '2', unit: 'pcs' }],
  }, 'receipt-for-reversal')
  await engine.reverse(actor, String(receiptForReversal.id), { reason: 'Receipt correction' }, 'reverse-receipt')
  check(await balance('product-b', 'warehouse-a') === '10', 'Receipt reversal did not restore stock.')
  await expectCode(() => engine.reverse(actor, String(receipt.id), { reason: 'Would overspend' }, 'reverse-insufficient'), 'INSUFFICIENT_STOCK')

  const bulkLines = Array.from({ length: 100 }, (_, index) => ({ productId: `bulk-${index}`, quantity: '2', unit: 'pcs' }))
  await engine.post('RECEIPT', actor, { warehouseId: 'warehouse-a', lines: bulkLines }, 'bulk-receipt')
  const bulkTransfer = await engine.post('TRANSFER', actor, {
    sourceWarehouseId: 'warehouse-a', destinationWarehouseId: 'warehouse-b',
    lines: bulkLines.map((line) => ({ ...line, quantity: '1' })),
  }, 'bulk-transfer')
  check(await prisma.stockMovement.count({ where: { inventoryTransactionId: String(bulkTransfer.id) } }) === 200, 'A 100-line Transfer must create exactly 200 movements.')
  const bulkMovementCount = await prisma.stockMovement.count()
  const bulkReplay = await engine.post('TRANSFER', actor, {
    sourceWarehouseId: 'warehouse-a', destinationWarehouseId: 'warehouse-b',
    lines: bulkLines.map((line) => ({ ...line, quantity: '1' })),
  }, 'bulk-transfer')
  check(bulkReplay.id === bulkTransfer.id && await prisma.stockMovement.count() === bulkMovementCount, 'Maximum-size replay reposted movements.')
  const beforeFinalLineFailure = await prisma.inventoryTransaction.count()
  await expectCode(() => engine.post('ISSUE', actor, {
    warehouseId: 'warehouse-a',
    lines: bulkLines.map((line, index) => ({ ...line, quantity: index === 99 ? '99' : '1' })),
  }, 'bulk-final-line-failure'), 'INSUFFICIENT_STOCK')
  check(await prisma.inventoryTransaction.count() === beforeFinalLineFailure && await balance('bulk-0', 'warehouse-a') === '1', 'Final-line failure did not roll back the 100-line post.')

  const orgBEngine = createInventoryTransactionEngine(prisma as unknown as InventoryV2Db)
  await orgBEngine.post('RECEIPT', { orgId: 'org-b', userId: 'user-b', requestId: 'org-b' }, {
    warehouseId: 'warehouse-other', lines: [{ productId: 'product-other', quantity: '2', unit: 'pcs' }],
  }, 'receipt-key')
  check(await prisma.inventoryTransaction.count({ where: { idempotencyKeyHash: { not: null } } }) > 1, 'Organization-scoped idempotency was not accepted.')

  process.stdout.write('[posting-rehearsal] PASS: all four posting/reversal types, 1/100-line bounds, 200-movement Transfer, final-line rollback, linkage, replay/conflict, tenant isolation, and real PostgreSQL concurrency.\n')
}

main()
  .finally(() => prisma.$disconnect())
  .catch((error: unknown) => {
    process.stderr.write(`${error instanceof Error ? error.stack ?? error.message : 'Unknown posting rehearsal failure'}\n`)
    process.exitCode = 1
  })
