import { randomUUID } from 'node:crypto'
import { decimal, scaled } from './decimal'
import {
  InventoryTransactionError,
  requestHash,
  reversalTransactionNumber,
  sha256,
  transactionNumber,
  utcDate,
} from './security'
import type {
  InventoryTransactionType,
  PostInput,
  ReversalCreateInput,
  TransactionQuery,
} from './schemas'

type Row = Record<string, unknown>
type Delegate = {
  findFirst(args: unknown): Promise<Row | null>
  findMany(args: unknown): Promise<Row[]>
  findUnique(args: unknown): Promise<Row | null>
  count(args: unknown): Promise<number>
  create(args: unknown): Promise<Row>
  update(args: unknown): Promise<Row>
}
export type InventoryV2Db = {
  inventoryTransaction: Delegate
  inventoryTransactionLine: Delegate
  stockBalance: Delegate
  stockMovement: Delegate
  product: Delegate
  warehouse: Delegate
  supplier: Delegate
  customer: Delegate
  $transaction<T>(fn: (tx: InventoryV2Db) => Promise<T>, options?: { isolationLevel: 'Serializable'; maxWait: number; timeout: number }): Promise<T>
}

export type PostingActor = { orgId: string; userId: string; requestId: string }
type EventFact = { name: string; payload: Record<string, unknown> }
type EngineOptions = {
  emit?: (fact: EventFact) => Promise<void> | void
  now?: () => Date
  id?: () => string
}

const includeTransaction = {
  lines: {
    orderBy: { lineNumber: 'asc' },
    include: { product: { select: { id: true, code: true, name: true, unit: true } } },
  },
  warehouse: { select: { id: true, code: true, name: true } },
  sourceWarehouse: { select: { id: true, code: true, name: true } },
  destinationWarehouse: { select: { id: true, code: true, name: true } },
  supplier: { select: { id: true, name: true } },
  customer: { select: { id: true, name: true } },
  postedBy: { select: { id: true, name: true } },
  reversal: { select: { id: true, transactionNumber: true } },
  reversalOf: { select: { id: true, transactionNumber: true } },
} as const

function code(error: unknown): string | undefined {
  return error && typeof error === 'object' && 'code' in error ? String(error.code) : undefined
}

async function serializable<T>(db: InventoryV2Db, action: (tx: InventoryV2Db) => Promise<T>): Promise<T> {
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      return await db.$transaction(action, { isolationLevel: 'Serializable', maxWait: 5_000, timeout: 30_000 })
    } catch (error) {
      if (!['P2034', '40001', '40P01'].includes(code(error) ?? '') || attempt === 3) throw error
    }
  }
  throw new InventoryTransactionError('INTERNAL_ERROR', 500, 'Serializable transaction retry exhausted.')
}

function text(value: unknown): string {
  return String(value)
}

function dto(row: Row, labels = true): Row {
  const hidden = new Set(['orgId', 'idempotencyKeyHash', 'requestHash'])
  return Object.fromEntries(Object.entries(row).filter(([key]) => !hidden.has(key)).map(([key, value]) => {
    if (!labels && ['product', 'supplier', 'customer', 'warehouse', 'sourceWarehouse', 'destinationWarehouse'].includes(key)) {
      return [key, undefined]
    }
    if (value instanceof Date) return [key, value.toISOString()]
    if (Array.isArray(value)) return [key, value.map((item) => item && typeof item === 'object' ? dto(item as Row, labels) : item)]
    if (value && typeof value === 'object' && 'toString' in value && value.constructor?.name === 'Decimal') {
      return [key, value.toString()]
    }
    return [key, value]
  }))
}

async function requireReference(delegate: Delegate, orgId: string, id: string, label: string): Promise<void> {
  const found = await delegate.findFirst({ where: { id, orgId, deletedAt: null } })
  if (!found) throw new InventoryTransactionError('INVENTORY_REFERENCE_INVALID', 422, `${label} is unavailable in this organization.`)
}

function inputQuantity(line: { quantity?: string; countedQuantity?: string }): string {
  return line.countedQuantity ?? line.quantity ?? '0'
}

async function applyMovement(
  tx: InventoryV2Db,
  actor: PostingActor,
  transactionId: string,
  lineId: string,
  productId: string,
  warehouseId: string,
  delta: bigint,
  movementType: string,
  reason: string | null,
  occurredAt: Date,
): Promise<EventFact[]> {
  const key = { orgId_productId_warehouseId: { orgId: actor.orgId, productId, warehouseId } }
  const existing = await tx.stockBalance.findUnique({ where: key })
  const before = existing ? scaled(existing.quantity) : 0n
  const after = before + delta
  if (after < 0n) {
    throw new InventoryTransactionError('INSUFFICIENT_STOCK', 409, 'Posting would create a negative stock balance.', {
      productId, warehouseId, available: decimal(before), requestedDelta: decimal(delta),
    })
  }
  const balance = existing
    ? await tx.stockBalance.update({ where: key, data: { quantity: decimal(after) } })
    : await tx.stockBalance.create({ data: { orgId: actor.orgId, productId, warehouseId, quantity: decimal(after) } })
  const movement = await tx.stockMovement.create({
    data: {
      id: randomUUID(), orgId: actor.orgId, productId, warehouseId, type: movementType,
      quantityDelta: decimal(delta), resultingQuantity: decimal(after), sourceType: 'inventory_transaction',
      sourceId: transactionId, inventoryTransactionId: transactionId,
      inventoryTransactionLineId: lineId, reason, occurredAt, createdBy: actor.userId,
    },
  })
  return [
    { name: 'inventory.stock_movement.created', payload: {
      movementId: movement.id, productId, warehouseId, quantityDelta: decimal(delta),
      resultingQuantity: decimal(after), sourceType: 'inventory_transaction', sourceId: transactionId,
    } },
    { name: 'inventory.stock_balance.updated', payload: { productId, warehouseId, quantity: decimal(after) } },
  ]
}

function lineId(options: EngineOptions): string {
  return options.id?.() ?? randomUUID()
}

async function validateReferences(tx: InventoryV2Db, actor: PostingActor, type: InventoryTransactionType, input: PostInput): Promise<void> {
  for (const line of input.lines) {
    const product = await tx.product.findFirst({
      where: { id: line.productId, orgId: actor.orgId, deletedAt: null, isActive: true },
      include: { inventoryExtension: true },
    })
    if (!product) throw new InventoryTransactionError('INVENTORY_REFERENCE_INVALID', 422, 'Product is unavailable in this organization.')
    const extension = product.inventoryExtension as Row | null | undefined
    if (extension && extension.isStockTracked === false) {
      throw new InventoryTransactionError('INVENTORY_REFERENCE_INVALID', 422, 'Product is not tracked by Inventory.')
    }
    if (!product.unit || product.unit !== line.unit) {
      throw new InventoryTransactionError('INVENTORY_REFERENCE_INVALID', 422, 'Line unit must match the Product unit snapshot.')
    }
  }
  if ('warehouseId' in input) {
    const warehouse = await tx.warehouse.findFirst({ where: { id: input.warehouseId, orgId: actor.orgId, deletedAt: null, isActive: true } })
    if (!warehouse) throw new InventoryTransactionError('INVENTORY_REFERENCE_INVALID', 422, 'Warehouse is unavailable in this organization.')
  }
  if ('sourceWarehouseId' in input) {
    const source = await tx.warehouse.findFirst({ where: { id: input.sourceWarehouseId, orgId: actor.orgId, deletedAt: null, isActive: true } })
    const destination = await tx.warehouse.findFirst({ where: { id: input.destinationWarehouseId, orgId: actor.orgId, deletedAt: null, isActive: true } })
    if (!source || !destination) throw new InventoryTransactionError('INVENTORY_REFERENCE_INVALID', 422, 'Transfer warehouse is unavailable in this organization.')
  }
  if (type === 'RECEIPT' && 'supplierId' in input && input.supplierId) {
    await requireReference(tx.supplier, actor.orgId, input.supplierId, 'Supplier')
  }
  if (type === 'ISSUE' && 'customerId' in input && input.customerId) {
    await requireReference(tx.customer, actor.orgId, input.customerId, 'Customer')
  }
}

function baseData(type: InventoryTransactionType, actor: PostingActor, input: PostInput, now: Date, keyHash: string, bodyHash: string, number: string) {
  return {
    id: randomUUID(), orgId: actor.orgId, type, status: 'POSTED', transactionNumber: number,
    referenceNumber: input.referenceNumber ?? null, referenceDate: utcDate(input.referenceDate),
    supplierId: 'supplierId' in input ? input.supplierId ?? null : null,
    customerId: 'customerId' in input ? input.customerId ?? null : null,
    warehouseId: 'warehouseId' in input ? input.warehouseId : null,
    sourceWarehouseId: 'sourceWarehouseId' in input ? input.sourceWarehouseId : null,
    destinationWarehouseId: 'destinationWarehouseId' in input ? input.destinationWarehouseId : null,
    reason: 'reason' in input ? input.reason : null, notes: input.notes ?? null,
    postedAt: now, postedByUserId: actor.userId, idempotencyKeyHash: keyHash, requestHash: bodyHash,
  }
}

export function createInventoryTransactionEngine(db: InventoryV2Db, options: EngineOptions = {}) {
  const emit = async (facts: EventFact[]) => {
    for (const fact of facts) {
      try { await options.emit?.(fact) } catch { /* Events are intentionally best effort after commit. */ }
    }
  }

  async function replay(orgId: string, keyHash: string, bodyHash: string): Promise<Row | null> {
    const existing = await db.inventoryTransaction.findFirst({
      where: { orgId, idempotencyKeyHash: keyHash }, include: includeTransaction,
    })
    if (!existing) return null
    if (existing.requestHash !== bodyHash) {
      throw new InventoryTransactionError('IDEMPOTENCY_KEY_REUSED', 409, 'This Idempotency-Key was already used for a different request.')
    }
    return dto(existing)
  }

  async function post(type: InventoryTransactionType, actor: PostingActor, input: PostInput, idempotencyKey: string): Promise<Row> {
    const keyHash = sha256(idempotencyKey)
    const bodyHash = requestHash(`post:${type}`, input)
    const existing = await replay(actor.orgId, keyHash, bodyHash)
    if (existing) return existing

    for (let numberAttempt = 1; numberAttempt <= 3; numberAttempt += 1) {
      const now = options.now?.() ?? new Date()
      const number = transactionNumber(type, now)
      try {
        const outcome = await serializable(db, async (tx) => {
          const facts: EventFact[] = []
          const inside = await tx.inventoryTransaction.findFirst({ where: { orgId: actor.orgId, idempotencyKeyHash: keyHash }, include: includeTransaction })
          if (inside) {
            if (inside.requestHash !== bodyHash) throw new InventoryTransactionError('IDEMPOTENCY_KEY_REUSED', 409, 'This Idempotency-Key was already used for a different request.')
            return { row: inside, facts, replayed: true }
          }
          await validateReferences(tx, actor, type, input)
          const data = baseData(type, actor, input, now, keyHash, bodyHash, number)
          const lines = input.lines.map((line, index) => ({ id: lineId(options), orgId: actor.orgId, productId: line.productId, quantity: inputQuantity(line), unit: line.unit, lineNumber: index + 1, notes: line.notes ?? null }))
          const created = await tx.inventoryTransaction.create({ data })
          for (const line of lines) {
            await tx.inventoryTransactionLine.create({ data: { ...line, transactionId: created.id } })
          }

          const postingOrder = input.lines.map((line, index) => ({ line, index }))
            .sort((a, b) => a.line.productId.localeCompare(b.line.productId))
          for (const { line, index } of postingOrder) {
            const id = lines[index].id
            if (type === 'RECEIPT') {
              facts.push(...await applyMovement(tx, actor, text(created.id), id, line.productId, text(data.warehouseId), scaled(inputQuantity(line)), 'receipt_in', data.reason, now))
            } else if (type === 'ISSUE') {
              facts.push(...await applyMovement(tx, actor, text(created.id), id, line.productId, text(data.warehouseId), -scaled(inputQuantity(line)), 'issue_out', data.reason, now))
            } else if (type === 'TRANSFER') {
              const effects = [
                { warehouseId: text(data.sourceWarehouseId), delta: -scaled(inputQuantity(line)), movementType: 'transfer_out' },
                { warehouseId: text(data.destinationWarehouseId), delta: scaled(inputQuantity(line)), movementType: 'transfer_in' },
              ].sort((a, b) => a.warehouseId.localeCompare(b.warehouseId))
              for (const effect of effects) {
                facts.push(...await applyMovement(tx, actor, text(created.id), id, line.productId, effect.warehouseId, effect.delta, effect.movementType, data.reason, now))
              }
            } else {
              const balance = await tx.stockBalance.findUnique({ where: { orgId_productId_warehouseId: { orgId: actor.orgId, productId: line.productId, warehouseId: text(data.warehouseId) } } })
              const delta = scaled(inputQuantity(line)) - (balance ? scaled(balance.quantity) : 0n)
              if (delta === 0n) throw new InventoryTransactionError('CONFLICT', 409, 'Adjustment quantity must change the current balance.', { productId: line.productId })
              facts.push(...await applyMovement(tx, actor, text(created.id), id, line.productId, text(data.warehouseId), delta, delta > 0n ? 'adjustment_in' : 'adjustment_out', data.reason, now))
            }
          }
          const row = await tx.inventoryTransaction.findFirst({ where: { id: created.id, orgId: actor.orgId }, include: includeTransaction }) as Row
          return { row, facts, replayed: false }
        })
        if (!outcome.replayed) {
          outcome.facts.unshift({ name: `inventory.${type.toLowerCase()}.posted`, payload: { transactionId: outcome.row.id, transactionNumber: outcome.row.transactionNumber, lineCount: input.lines.length } })
          await emit(outcome.facts)
        }
        return dto(outcome.row)
      } catch (error) {
        if (code(error) === 'P2002') {
          const raced = await replay(actor.orgId, keyHash, bodyHash)
          if (raced) return raced
          if (numberAttempt < 3) continue
          throw new InventoryTransactionError('CONFLICT', 409, 'Unable to allocate a unique transaction number.')
        }
        throw error
      }
    }
    throw new InventoryTransactionError('INTERNAL_ERROR', 500, 'Posting failed.')
  }

  async function reverse(
    actor: PostingActor,
    transactionId: string,
    input: ReversalCreateInput,
    idempotencyKey: string,
    numberAttempt = 1,
  ): Promise<Row> {
    const keyHash = sha256(idempotencyKey)
    const bodyHash = requestHash('reverse', { transactionId, reason: input.reason })
    const existing = await replay(actor.orgId, keyHash, bodyHash)
    if (existing) return existing
    const now = options.now?.() ?? new Date()
    try {
      const outcome = await serializable(db, async (tx) => {
      const facts: EventFact[] = []
      const replayed = await tx.inventoryTransaction.findFirst({ where: { orgId: actor.orgId, idempotencyKeyHash: keyHash }, include: includeTransaction })
      if (replayed) {
        if (replayed.requestHash !== bodyHash) throw new InventoryTransactionError('IDEMPOTENCY_KEY_REUSED', 409, 'This Idempotency-Key was already used for a different request.')
        return { row: replayed, facts, replayed: true }
      }
      const original = await tx.inventoryTransaction.findFirst({
        where: { id: transactionId, orgId: actor.orgId },
        include: { lines: { orderBy: { lineNumber: 'asc' }, include: { stockMovements: true } }, reversal: true },
      })
      if (!original) throw new InventoryTransactionError('NOT_FOUND', 404, 'Inventory transaction not found.')
      if (original.status !== 'POSTED' || original.reversal || original.reversalOfTransactionId) {
        throw new InventoryTransactionError('TRANSACTION_ALREADY_REVERSED', 409, 'Inventory transaction has already been reversed.')
      }
      const type = original.type as InventoryTransactionType
      const originalLines = original.lines as Row[]
      const lines = originalLines.map((line) => ({
        id: lineId(options), orgId: actor.orgId, productId: line.productId, quantity: line.quantity,
        unit: line.unit, lineNumber: line.lineNumber, notes: line.notes ?? null,
      }))
      const created = await tx.inventoryTransaction.create({
        data: {
          id: randomUUID(), orgId: actor.orgId, type, status: 'POSTED',
          transactionNumber: reversalTransactionNumber(now),
          referenceNumber: original.referenceNumber ?? null, referenceDate: original.referenceDate ?? null,
          supplierId: original.supplierId ?? null, customerId: original.customerId ?? null,
          warehouseId: original.warehouseId ?? null,
          sourceWarehouseId: type === 'TRANSFER' ? original.destinationWarehouseId : original.sourceWarehouseId ?? null,
          destinationWarehouseId: type === 'TRANSFER' ? original.sourceWarehouseId : original.destinationWarehouseId ?? null,
          reason: input.reason, notes: null, postedAt: now, postedByUserId: actor.userId,
          reversalOfTransactionId: original.id, idempotencyKeyHash: keyHash, requestHash: bodyHash,
        },
      })
      for (const line of lines) {
        await tx.inventoryTransactionLine.create({ data: { ...line, transactionId: created.id } })
      }
      for (const [index, line] of originalLines.entries()) {
        const movements = line.stockMovements as Row[]
        const expectedWarehouses = type === 'TRANSFER'
          ? [text(original.sourceWarehouseId), text(original.destinationWarehouseId)].sort()
          : [text(original.warehouseId)]
        const actualWarehouses = movements.map((movement) => text(movement.warehouseId)).sort()
        const linksAreExact = movements.length === expectedWarehouses.length
          && actualWarehouses.every((warehouseId, movementIndex) => warehouseId === expectedWarehouses[movementIndex])
          && movements.every((movement) =>
            movement.orgId === actor.orgId
            && movement.inventoryTransactionId === original.id
            && movement.inventoryTransactionLineId === line.id)
        const typesAreExact = type === 'RECEIPT'
          ? movements[0]?.type === 'receipt_in'
          : type === 'ISSUE'
            ? movements[0]?.type === 'issue_out'
            : type === 'ADJUSTMENT'
              ? ['adjustment_in', 'adjustment_out'].includes(text(movements[0]?.type))
              : movements.some((movement) => movement.type === 'transfer_out' && movement.warehouseId === original.sourceWarehouseId)
                && movements.some((movement) => movement.type === 'transfer_in' && movement.warehouseId === original.destinationWarehouseId)
        if (!linksAreExact || !typesAreExact) {
          throw new InventoryTransactionError('CONFLICT', 409, 'Canonical movement linkage is incomplete or inconsistent; reversal was rejected.')
        }
        for (const movement of movements) {
          const delta = -scaled(movement.quantityDelta)
          facts.push(...await applyMovement(
            tx, actor, text(created.id), lines[index].id, text(line.productId), text(movement.warehouseId),
            delta, delta > 0n ? 'reversal_in' : 'reversal_out', input.reason, now,
          ))
        }
        if (type === 'ADJUSTMENT') {
          const movement = movements[0]
          const balance = await tx.stockBalance.findUnique({ where: { orgId_productId_warehouseId: { orgId: actor.orgId, productId: text(line.productId), warehouseId: text(movement.warehouseId) } } })
          lines[index].quantity = decimal(balance ? scaled(balance.quantity) : 0n)
          await tx.inventoryTransactionLine.update({ where: { id_orgId: { id: lines[index].id, orgId: actor.orgId } }, data: { quantity: lines[index].quantity } })
        }
      }
      await tx.inventoryTransaction.update({ where: { id_orgId: { id: original.id, orgId: actor.orgId } }, data: { status: 'REVERSED' } })
      const row = await tx.inventoryTransaction.findFirst({ where: { id: created.id, orgId: actor.orgId }, include: includeTransaction }) as Row
      return { row, facts, replayed: false }
      })
      if (!outcome.replayed) {
        outcome.facts.unshift({ name: 'inventory.transaction.reversed', payload: { transactionId: outcome.row.id, reversalOfTransactionId: transactionId, transactionNumber: outcome.row.transactionNumber } })
        await emit(outcome.facts)
      }
      return dto(outcome.row)
    } catch (error) {
      if (code(error) !== 'P2002') throw error
      const raced = await replay(actor.orgId, keyHash, bodyHash)
      if (raced) return raced
      if (numberAttempt < 3) return reverse(actor, transactionId, input, idempotencyKey, numberAttempt + 1)
      throw new InventoryTransactionError('CONFLICT', 409, 'Unable to allocate a unique reversal transaction number.')
    }
  }

  async function detail(orgId: string, id: string, labels = true): Promise<Row> {
    const row = await db.inventoryTransaction.findFirst({ where: { id, orgId }, include: includeTransaction })
    if (!row) throw new InventoryTransactionError('NOT_FOUND', 404, 'Inventory transaction not found.')
    return dto(row, labels)
  }

  async function list(orgId: string, query: TransactionQuery, labels = true) {
    const where: Row = { orgId }
    if (query.type) where.type = query.type
    if (query.status) where.status = query.status
    if (query.supplierId) where.supplierId = query.supplierId
    if (query.customerId) where.customerId = query.customerId
    if (query.warehouseId) where.OR = [{ warehouseId: query.warehouseId }, { sourceWarehouseId: query.warehouseId }, { destinationWarehouseId: query.warehouseId }]
    if (query.from || query.to) where.referenceDate = { ...(query.from ? { gte: utcDate(query.from) } : {}), ...(query.to ? { lte: utcDate(query.to) } : {}) }
    if (query.q) where.AND = [{ OR: [{ transactionNumber: { contains: query.q, mode: 'insensitive' } }, { referenceNumber: { contains: query.q, mode: 'insensitive' } }] }]
    const [rows, total] = await Promise.all([
      db.inventoryTransaction.findMany({ where, include: includeTransaction, orderBy: { [query.sort]: query.direction }, skip: (query.page - 1) * query.pageSize, take: query.pageSize }),
      db.inventoryTransaction.count({ where }),
    ])
    return { rows: rows.map((row) => dto(row, labels)), meta: { page: query.page, pageSize: query.pageSize, total, totalPages: Math.ceil(total / query.pageSize) } }
  }

  return { post, reverse, detail, list }
}
