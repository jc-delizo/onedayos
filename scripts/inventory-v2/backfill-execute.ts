import { existsSync } from 'node:fs'
import { config as loadDotenv } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { readLegacyBackfillInput } from './backfill-preflight'
import { validateLegacyAdjustmentBackfill } from './backfill-validation'

if (existsSync('.env.local')) loadDotenv({ path: '.env.local', override: false, quiet: true })
loadDotenv({ override: false, quiet: true })

function requireGuard(name: string): void {
  if (process.env[name] !== 'true') throw new Error(`${name} must be true.`)
}

function databaseUrl(): string {
  const value = process.env.DIRECT_URL ?? process.env.DATABASE_URL
  if (!value) throw new Error('DIRECT_URL or DATABASE_URL is required.')
  return value
}

export async function executeLegacyAdjustmentBackfill(prisma: PrismaClient) {
  const input = await readLegacyBackfillInput(prisma)
  const report = validateLegacyAdjustmentBackfill(input)
  if (report.invalidCount || report.warningCount) {
    throw new Error('Backfill preflight contains invalid rows or warnings.')
  }
  const adjustmentById = new Map(input.adjustments.map((row) => [row.id, row]))
  let inserted = 0
  let alreadyMatching = 0

  for (const mapping of report.mappings) {
    const adjustment = adjustmentById.get(mapping.transactionId)
    if (!adjustment) throw new Error('Validated backfill mapping lost its source adjustment.')
    await prisma.$transaction(async (tx) => {
      const existing = await tx.inventoryTransaction.findUnique({
        where: { id_orgId: { id: mapping.transactionId, orgId: adjustment.orgId } },
        include: { lines: true },
      })
      if (existing) {
        const line = existing.lines[0]
        const matches =
          existing.type === 'ADJUSTMENT'
          && existing.status === 'POSTED'
          && existing.transactionNumber === mapping.transactionNumber
          && existing.warehouseId === adjustment.warehouseId
          && existing.postedByUserId === adjustment.createdBy
          && existing.postedAt.getTime() === adjustment.createdAt.getTime()
          && existing.reason === adjustment.reason
          && existing.notes === adjustment.notes
          && existing.lines.length === 1
          && line?.id === mapping.lineId
          && line.productId === adjustment.productId
          && line.quantity.toFixed() === mapping.lineQuantity
          && line.unit === mapping.unit
        if (!matches) throw new Error('Existing canonical backfill row diverges from the deterministic mapping.')
        alreadyMatching += 1
      } else {
        await tx.inventoryTransaction.create({
          data: {
            id: mapping.transactionId,
            orgId: adjustment.orgId,
            type: 'ADJUSTMENT',
            status: 'POSTED',
            transactionNumber: mapping.transactionNumber,
            warehouseId: adjustment.warehouseId,
            reason: adjustment.reason,
            notes: adjustment.notes,
            postedAt: adjustment.createdAt,
            postedByUserId: adjustment.createdBy,
            createdAt: adjustment.createdAt,
            lines: {
              create: {
                id: mapping.lineId,
                productId: adjustment.productId,
                quantity: mapping.lineQuantity,
                unit: mapping.unit,
                lineNumber: 1,
                notes: adjustment.notes,
                createdAt: adjustment.createdAt,
              },
            },
          },
        })
        inserted += 1
      }
      const movement = await tx.stockMovement.findUnique({ where: { id: mapping.movementId } })
      if (!movement || movement.orgId !== adjustment.orgId) {
        throw new Error('Backfill movement is no longer available in the validated organization.')
      }
      const compatible =
        (!movement.inventoryTransactionId && !movement.inventoryTransactionLineId)
        || (movement.inventoryTransactionId === mapping.transactionId
          && movement.inventoryTransactionLineId === mapping.lineId)
      if (!compatible) throw new Error('Backfill movement already has divergent canonical linkage.')
      if (!movement.inventoryTransactionId) {
        await tx.stockMovement.update({
          where: { id: mapping.movementId },
          data: {
            inventoryTransactionId: mapping.transactionId,
            inventoryTransactionLineId: mapping.lineId,
          },
        })
      }
    })
  }

  const linked = await prisma.stockMovement.count({
    where: {
      inventoryTransactionId: { in: report.mappings.map((mapping) => mapping.transactionId) },
      inventoryTransactionLineId: { not: null },
    },
  })
  if (linked !== report.mappings.length) throw new Error('Backfill linkage verification count mismatch.')
  return {
    mode: 'guarded-execute',
    validCount: report.validCount,
    invalidCount: report.invalidCount,
    warningCount: report.warningCount,
    inserted,
    alreadyMatching,
    linked,
  }
}

async function main() {
  requireGuard('ONEDAYOS_SANDBOX_DB_APPROVED')
  requireGuard('ONEDAYOS_INVENTORY_V2_MIGRATION_APPROVED')
  requireGuard('ONEDAYOS_INVENTORY_V2_BACKFILL_APPROVED')
  if (process.env.ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED !== 'false') {
    throw new Error('ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED must remain false during backfill.')
  }
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl() }) })
  try {
    process.stdout.write(`${JSON.stringify(await executeLegacyAdjustmentBackfill(prisma), null, 2)}\n`)
  } finally {
    await prisma.$disconnect()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error: unknown) => {
    process.stderr.write(`Inventory V2 guarded backfill refused or failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    process.exitCode = 1
  })
}
