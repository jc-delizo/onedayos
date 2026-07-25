import { existsSync } from 'node:fs'
import { config as loadDotenv } from 'dotenv'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { validateLegacyAdjustmentBackfill } from './backfill-validation'
import type { BackfillInput } from './backfill-types'

if (existsSync('.env.local')) loadDotenv({ path: '.env.local', override: false, quiet: true })
loadDotenv({ override: false, quiet: true })

const PAGE_SIZE = 250

function requiredDatabaseUrl(): string {
  const value = process.env.DATABASE_URL
  if (!value) throw new Error('DATABASE_URL is required for the read-only inventory V2 backfill preflight.')
  return value
}

async function collectPages<T>(read: (skip: number, take: number) => Promise<T[]>): Promise<T[]> {
  const records: T[] = []
  for (let skip = 0; ; skip += PAGE_SIZE) {
    const page = await read(skip, PAGE_SIZE)
    records.push(...page)
    if (page.length < PAGE_SIZE) return records
  }
}

export async function readLegacyBackfillInput(prisma: PrismaClient): Promise<BackfillInput> {
  const adjustments = await collectPages((skip, take) =>
    prisma.stockAdjustment.findMany({
      orderBy: [{ orgId: 'asc' }, { createdAt: 'asc' }, { id: 'asc' }],
      skip,
      take,
      select: {
        id: true,
        orgId: true,
        productId: true,
        warehouseId: true,
        quantityBefore: true,
        quantityAfter: true,
        quantityDelta: true,
        reason: true,
        notes: true,
        status: true,
        createdBy: true,
        createdAt: true,
        deletedAt: true,
        deletedBy: true,
      },
    }),
  )
  const movements = await collectPages((skip, take) =>
    prisma.stockMovement.findMany({
      where: {},
      orderBy: { id: 'asc' },
      skip,
      take,
      select: {
        id: true,
        orgId: true,
        productId: true,
        warehouseId: true,
        type: true,
        quantityDelta: true,
        resultingQuantity: true,
        sourceType: true,
        sourceId: true,
        createdBy: true,
        occurredAt: true,
      },
    }),
  )
  const organizationIds = [...new Set(adjustments.map(({ orgId }) => orgId))]
  const productIds = [...new Set(adjustments.map(({ productId }) => productId))]
  const warehouseIds = [...new Set(adjustments.map(({ warehouseId }) => warehouseId))]
  const userIds = [...new Set(adjustments.map(({ createdBy }) => createdBy))]

  const [organizations, products, warehouses, users, balances] = await Promise.all([
    prisma.organization.findMany({ where: { id: { in: organizationIds } }, select: { id: true } }),
    prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, orgId: true, unit: true, isActive: true, deletedAt: true },
    }),
    prisma.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true, orgId: true, isActive: true, deletedAt: true },
    }),
    prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, orgId: true, isActive: true, deletedAt: true },
    }),
    prisma.stockBalance.findMany({
      where: { orgId: { in: organizationIds } },
      select: { orgId: true, productId: true, warehouseId: true, quantity: true },
    }),
  ])

  return {
    organizations,
    products,
    warehouses,
    users,
    adjustments: adjustments.map((record) => ({
      ...record,
      quantityBefore: record.quantityBefore.toFixed(),
      quantityAfter: record.quantityAfter.toFixed(),
      quantityDelta: record.quantityDelta.toFixed(),
    })),
    movements: movements.map((record) => ({
      ...record,
      quantityDelta: record.quantityDelta.toFixed(),
      resultingQuantity: record.resultingQuantity?.toFixed() ?? null,
    })),
    balances: balances.map((record) => ({ ...record, quantity: record.quantity.toFixed() })),
  }
}

async function main(): Promise<void> {
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: requiredDatabaseUrl() }) })
  try {
    const report = validateLegacyAdjustmentBackfill(await readLegacyBackfillInput(prisma))
    process.stdout.write(`${JSON.stringify(report, null, 2)}\n`)
    if (report.invalidCount > 0) process.exitCode = 1
  } finally {
    await prisma.$disconnect()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error: unknown) => {
    const message = error instanceof Error ? error.message : 'Unknown preflight failure'
    process.stderr.write(`Inventory V2 read-only preflight failed: ${message}\n`)
    process.exitCode = 1
  })
}
