import { existsSync } from 'node:fs'
import { config as loadDotenv } from 'dotenv'
import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createInventoryTransactionEngine, type InventoryV2Db } from '../../src/modules/inventory/transactions/engine'
import {
  CANONICAL_DEMO_CUSTOMER,
  CANONICAL_DEMO_PRODUCTS,
  CANONICAL_DEMO_SECONDARY_WAREHOUSE,
  CANONICAL_DEMO_SUPPLIER,
  CANONICAL_DEMO_WAREHOUSE,
  CANONICAL_V2_REFERENCE_NUMBERS,
  loadDemoEnvFiles,
  permissionKey,
  WAREHOUSE_OPERATOR_ROLE_NAME,
  WAREHOUSE_OPERATOR_V2_PERMISSION_PROFILE,
} from '../demo-ops'

type CutoverEnv = NodeJS.ProcessEnv

function atUtcDaysAgo(days: number): Date {
  const now = new Date()
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - days, 10, 0, 0))
}

function requireValue(env: CutoverEnv, name: string): string {
  const value = env[name]
  if (!value) throw new Error(`${name} is required.`)
  return value
}

export function validateCutoverEnv(env: CutoverEnv, runtime: 'false' | 'true-or-false' = 'false'): void {
  for (const name of [
    'ONEDAYOS_SANDBOX_DB_APPROVED',
    'ONEDAYOS_INVENTORY_V2_MIGRATION_APPROVED',
    'ONEDAYOS_INVENTORY_V2_BACKFILL_APPROVED',
    'ONEDAYOS_INVENTORY_V2_CUTOVER_APPROVED',
  ]) {
    if (env[name] !== 'true') throw new Error(`${name} must be true.`)
  }
  if (runtime === 'false' && env.ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED !== 'false') {
    throw new Error('ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED must remain false until cutover verification passes.')
  }
  requireValue(env, 'ONEDAYOS_DEMO_ORG_SLUG')
  requireValue(env, 'ONEDAYOS_DEMO_ADMIN_EMAIL')
}

function databaseUrl(env: CutoverEnv): string {
  const value = env.DIRECT_URL || requireValue(env, 'DATABASE_URL')
  return value.replace(/^postgresql:\/\//, 'postgres://')
}

function idempotency(orgId: string, reference: string): string {
  return `onedayos-v2-6d:${orgId}:${reference}`
}

export async function resetCanonicalV2Demo(prisma: PrismaClient, orgId: string): Promise<void> {
  const main = await prisma.warehouse.findUnique({ where: { orgId_code: { orgId, code: CANONICAL_DEMO_WAREHOUSE.code } } })
  const secondary = await prisma.warehouse.findUnique({ where: { orgId_code: { orgId, code: CANONICAL_DEMO_SECONDARY_WAREHOUSE.code } } })
  const products = await prisma.product.findMany({ where: { orgId, code: { in: CANONICAL_DEMO_PRODUCTS.map((row) => row.code) } } })
  if (!main || !secondary || products.length !== CANONICAL_DEMO_PRODUCTS.length) {
    throw new Error('Canonical V2 demo reset requires both Warehouses and all canonical Products.')
  }
  await prisma.$transaction(async (tx) => {
    const removable = await tx.inventoryTransaction.findMany({
      where: { orgId, idempotencyKeyHash: { not: null } },
      select: { id: true },
    })
    const ids = removable.map(({ id }) => id)
    if (ids.length) {
      await tx.stockMovement.deleteMany({ where: { orgId, inventoryTransactionId: { in: ids } } })
      await tx.inventoryTransactionLine.deleteMany({ where: { orgId, transactionId: { in: ids } } })
      await tx.inventoryTransaction.deleteMany({ where: { orgId, id: { in: ids } } })
    }
    await tx.stockBalance.deleteMany({ where: { orgId, warehouseId: secondary.id } })
    for (const product of products) {
      const canonical = CANONICAL_DEMO_PRODUCTS.find((row) => row.code === product.code)
      if (!canonical) continue
      await tx.stockBalance.upsert({
        where: { orgId_productId_warehouseId: { orgId, productId: product.id, warehouseId: main.id } },
        update: { quantity: canonical.quantity },
        create: { orgId, productId: product.id, warehouseId: main.id, quantity: canonical.quantity },
      })
    }
  }, { timeout: 30_000 })
}

export async function provisionCanonicalV2Demo(
  prisma: PrismaClient,
  env: CutoverEnv,
  options: { reset?: boolean } = {},
) {
  const org = await prisma.organization.findUnique({ where: { slug: requireValue(env, 'ONEDAYOS_DEMO_ORG_SLUG') } })
  if (!org) throw new Error('Configured demo organization was not found.')
  const actor = await prisma.user.findFirst({
    where: { orgId: org.id, email: requireValue(env, 'ONEDAYOS_DEMO_ADMIN_EMAIL').toLowerCase(), deletedAt: null },
  })
  if (!actor) throw new Error('Configured demo administrator was not found.')
  const main = await prisma.warehouse.findUnique({ where: { orgId_code: { orgId: org.id, code: CANONICAL_DEMO_WAREHOUSE.code } } })
  if (!main) throw new Error('Main Warehouse was not found.')
  const secondary = await prisma.warehouse.upsert({
    where: { orgId_code: { orgId: org.id, code: CANONICAL_DEMO_SECONDARY_WAREHOUSE.code } },
    update: { branchId: main.branchId, name: CANONICAL_DEMO_SECONDARY_WAREHOUSE.name, address: CANONICAL_DEMO_SECONDARY_WAREHOUSE.address, isActive: true, deletedAt: null, deletedBy: null },
    create: { orgId: org.id, branchId: main.branchId, ...CANONICAL_DEMO_SECONDARY_WAREHOUSE, isActive: true },
  })
  const supplier = await prisma.supplier.findFirst({ where: { orgId: org.id, name: CANONICAL_DEMO_SUPPLIER.name, deletedAt: null } })
  if (!supplier) throw new Error('Canonical Demo Supplier was not found.')
  const existingCustomer = await prisma.customer.findFirst({ where: { orgId: org.id, name: CANONICAL_DEMO_CUSTOMER.name } })
  const customer = existingCustomer
    ? await prisma.customer.update({ where: { id: existingCustomer.id }, data: { ...CANONICAL_DEMO_CUSTOMER, deletedAt: null, deletedBy: null } })
    : await prisma.customer.create({ data: { orgId: org.id, ...CANONICAL_DEMO_CUSTOMER } })
  const role = await prisma.role.findUnique({ where: { orgId_name: { orgId: org.id, name: WAREHOUSE_OPERATOR_ROLE_NAME } } })
  if (!role) throw new Error('Warehouse Operator role was not found.')
  await prisma.$transaction(async (tx) => {
    await tx.permission.deleteMany({ where: { orgId: org.id, roleId: role.id } })
    await tx.permission.createMany({
      data: WAREHOUSE_OPERATOR_V2_PERMISSION_PROFILE.map((permission) => ({
        orgId: org.id,
        roleId: role.id,
        module: permission.module,
        resource: permission.resource,
        action: permission.action,
        conditions: Prisma.DbNull,
      })),
    })
  })
  if (options.reset) await resetCanonicalV2Demo(prisma, org.id)
  const products = await prisma.product.findMany({
    where: { orgId: org.id, code: { in: CANONICAL_DEMO_PRODUCTS.map((row) => row.code) }, deletedAt: null, isActive: true },
    orderBy: { code: 'asc' },
  })
  if (products.length !== 3) throw new Error('Exactly three canonical active Products are required.')
  const byCode = new Map(products.map((product) => [product.code, product]))
  const lines = (quantities: Record<string, string>) => Object.entries(quantities).map(([code, quantity]) => {
    const product = byCode.get(code)
    if (!product) throw new Error('Canonical Product lookup failed.')
    return { productId: product.id, unit: product.unit ?? 'pcs', quantity }
  })
  const adjustmentLines = (quantities: Record<string, string>) => lines(quantities).map(({ quantity, ...line }) => ({ ...line, countedQuantity: quantity }))
  const actorContext = { orgId: org.id, userId: actor.id, requestId: 'v2-6d-controlled-cutover' }
  const post = async (now: Date, type: 'RECEIPT' | 'ISSUE' | 'TRANSFER' | 'ADJUSTMENT', input: Parameters<ReturnType<typeof createInventoryTransactionEngine>['post']>[2], reference: string) => {
    const engine = createInventoryTransactionEngine(prisma as unknown as InventoryV2Db, { now: () => now })
    return engine.post(type, actorContext, input, idempotency(org.id, reference))
  }
  await post(atUtcDaysAgo(8), 'RECEIPT', {
    warehouseId: main.id,
    supplierId: supplier.id,
    referenceNumber: CANONICAL_V2_REFERENCE_NUMBERS.receipt,
    lines: lines({ 'WAT-500': '20', 'TEA-1L': '10', 'COF-1KG': '5' }),
  }, CANONICAL_V2_REFERENCE_NUMBERS.receipt)
  await post(atUtcDaysAgo(6), 'TRANSFER', {
    sourceWarehouseId: main.id,
    destinationWarehouseId: secondary.id,
    referenceNumber: CANONICAL_V2_REFERENCE_NUMBERS.transfer,
    lines: lines({ 'WAT-500': '10', 'TEA-1L': '5', 'COF-1KG': '3' }),
  }, CANONICAL_V2_REFERENCE_NUMBERS.transfer)
  await post(atUtcDaysAgo(4), 'ISSUE', {
    warehouseId: main.id,
    customerId: customer.id,
    referenceNumber: CANONICAL_V2_REFERENCE_NUMBERS.issue,
    lines: lines({ 'WAT-500': '5', 'TEA-1L': '2' }),
  }, CANONICAL_V2_REFERENCE_NUMBERS.issue)
  await post(atUtcDaysAgo(2), 'ADJUSTMENT', {
    warehouseId: main.id,
    reason: 'Canonical controlled-demo final count',
    referenceNumber: CANONICAL_V2_REFERENCE_NUMBERS.adjustment,
    lines: adjustmentLines({ 'WAT-500': '120', 'TEA-1L': '35', 'COF-1KG': '5' }),
  }, CANONICAL_V2_REFERENCE_NUMBERS.adjustment)

  const balances = await prisma.stockBalance.findMany({
    where: { orgId: org.id, productId: { in: products.map(({ id }) => id) }, warehouseId: { in: [main.id, secondary.id] } },
    include: { product: { select: { code: true } }, warehouse: { select: { code: true } } },
  })
  const expected = new Map([
    ['WAT-500:MAIN', '120'], ['WAT-500:SECONDARY', '10'],
    ['TEA-1L:MAIN', '35'], ['TEA-1L:SECONDARY', '5'],
    ['COF-1KG:MAIN', '5'], ['COF-1KG:SECONDARY', '3'],
  ])
  for (const balance of balances) {
    const key = `${balance.product.code}:${balance.warehouse.code}`
    if (balance.quantity.toFixed() !== expected.get(key)) throw new Error(`Canonical final balance mismatch for ${key}.`)
    expected.delete(key)
  }
  if (expected.size) throw new Error('Canonical final balance rows are incomplete.')
  const references = Object.values(CANONICAL_V2_REFERENCE_NUMBERS)
  const transactionCount = await prisma.inventoryTransaction.count({ where: { orgId: org.id, referenceNumber: { in: references } } })
  if (transactionCount !== 4) throw new Error('Canonical V2 demo must contain exactly four reference transactions.')
  const permissionKeys = (await prisma.permission.findMany({ where: { orgId: org.id, roleId: role.id } }))
    .map(permissionKey)
    .sort()
  const expectedPermissionKeys = WAREHOUSE_OPERATOR_V2_PERMISSION_PROFILE.map(permissionKey).sort()
  if (JSON.stringify(permissionKeys) !== JSON.stringify(expectedPermissionKeys)) throw new Error('Warehouse Operator permission profile mismatch.')
  return { organization: org.slug, transactionCount, balanceCount: balances.length, permissionCount: permissionKeys.length }
}

async function main() {
  loadDemoEnvFiles()
  validateCutoverEnv(process.env)
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl(process.env) }) })
  try {
    process.stdout.write(`${JSON.stringify(await provisionCanonicalV2Demo(prisma, process.env, { reset: true }), null, 2)}\n`)
  } finally {
    await prisma.$disconnect()
  }
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error: unknown) => {
    process.stderr.write(`Inventory V2 cutover demo provisioning failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    process.exitCode = 1
  })
}
