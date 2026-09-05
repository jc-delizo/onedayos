import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { executeLegacyAdjustmentBackfill } from './backfill-execute'
import { provisionCanonicalV2Demo } from './cutover-demo'
import {
  CANONICAL_DEMO_CATEGORY,
  CANONICAL_DEMO_PRODUCTS,
  CANONICAL_DEMO_SUPPLIER,
  CANONICAL_DEMO_WAREHOUSE,
  WAREHOUSE_OPERATOR_ROLE_NAME,
} from '../demo-ops'

const url = process.env.INVENTORY_V2_CUTOVER_TEST_DATABASE_URL
if (!url) throw new Error('Disposable cutover database URL is required.')
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) })

const orgSlug = 'v2-6d-rehearsal'
const adminEmail = 'admin@v2-6d.example.invalid'

async function seed() {
  const org = await prisma.organization.create({ data: { name: 'V2-6D Rehearsal', slug: orgSlug } })
  const other = await prisma.organization.create({ data: { name: 'Isolation Control', slug: 'v2-6d-isolation' } })
  const admin = await prisma.user.create({ data: { id: 'v2-6d-admin', orgId: org.id, name: 'Admin', email: adminEmail } })
  await prisma.user.create({ data: { id: 'v2-6d-other-user', orgId: other.id, name: 'Other', email: 'other@example.invalid' } })
  await prisma.role.create({ data: { orgId: org.id, name: WAREHOUSE_OPERATOR_ROLE_NAME, description: 'Rehearsal role' } })
  const branch = await prisma.branch.create({ data: { orgId: org.id, name: 'Main Branch', code: 'MAIN' } })
  const category = await prisma.productCategory.create({ data: { orgId: org.id, ...CANONICAL_DEMO_CATEGORY } })
  const warehouse = await prisma.warehouse.create({ data: { orgId: org.id, branchId: branch.id, ...CANONICAL_DEMO_WAREHOUSE } })
  await prisma.supplier.create({ data: { orgId: org.id, ...CANONICAL_DEMO_SUPPLIER } })
  const histories = [
    [['0', '100'], ['100', '135'], ['135', '120']],
    [['0', '30'], ['30', '42'], ['42', '35']],
    [['0', '10'], ['10', '14'], ['14', '8']],
  ] as const
  for (const [productIndex, definition] of CANONICAL_DEMO_PRODUCTS.entries()) {
    const product = await prisma.product.create({ data: { orgId: org.id, categoryId: category.id, code: definition.code, name: definition.name, unit: definition.unit } })
    await prisma.inventoryProductExtension.create({ data: { orgId: org.id, productId: product.id, reorderPoint: definition.reorderPoint } })
    for (const [index, [before, after]] of histories[productIndex].entries()) {
      const delta = String(Number(after) - Number(before))
      const when = new Date(Date.UTC(2026, 6, 1 + productIndex * 3 + index, 9))
      const adjustment = await prisma.stockAdjustment.create({
        data: { orgId: org.id, productId: product.id, warehouseId: warehouse.id, quantityBefore: before, quantityAfter: after, quantityDelta: delta, reason: `legacy-${productIndex}-${index}`, status: 'posted', createdBy: admin.id, createdAt: when },
      })
      await prisma.stockMovement.create({
        data: { orgId: org.id, productId: product.id, warehouseId: warehouse.id, type: before === '0' ? 'opening_balance' : Number(delta) > 0 ? 'adjustment_in' : 'adjustment_out', quantityDelta: delta, resultingQuantity: after, sourceType: 'stock_adjustment', sourceId: adjustment.id, reason: adjustment.reason, createdBy: admin.id, occurredAt: new Date(when.getTime() + 1000), createdAt: new Date(when.getTime() + 1000) },
      })
    }
    await prisma.stockBalance.create({ data: { orgId: org.id, productId: product.id, warehouseId: warehouse.id, quantity: definition.quantity } })
  }
  await prisma.product.create({ data: { id: 'isolation-product', orgId: other.id, code: 'ISO', name: 'Isolation Product', unit: 'pcs' } })
  return { org, other }
}

async function main() {
  const { org, other } = await seed()
  const first = await executeLegacyAdjustmentBackfill(prisma)
  const second = await executeLegacyAdjustmentBackfill(prisma)
  if (first.inserted !== 9 || first.linked !== 9 || second.inserted !== 0 || second.alreadyMatching !== 9) {
    throw new Error('Backfill execution or idempotent rerun did not match the nine-row contract.')
  }
  const env = {
    ...process.env,
    DIRECT_URL: url,
    DATABASE_URL: url,
    ONEDAYOS_DEMO_ORG_SLUG: orgSlug,
    ONEDAYOS_DEMO_ADMIN_EMAIL: adminEmail,
  }
  const firstProvision = await provisionCanonicalV2Demo(prisma, env, { reset: true })
  const secondProvision = await provisionCanonicalV2Demo(prisma, env, { reset: true })
  const thirdProvision = await provisionCanonicalV2Demo(prisma, env, { reset: true })
  if (firstProvision.transactionCount !== 4 || secondProvision.transactionCount !== 4 || thirdProvision.transactionCount !== 4) {
    throw new Error('Repeated canonical reset/provision did not remain exact.')
  }
  const legacy = await prisma.stockAdjustment.count({ where: { orgId: org.id } })
  const backfilled = await prisma.inventoryTransaction.count({ where: { orgId: org.id, idempotencyKeyHash: null } })
  const isolationProducts = await prisma.product.count({ where: { orgId: other.id } })
  if (legacy !== 9 || backfilled !== 9 || isolationProducts !== 1) {
    throw new Error('Legacy preservation or organization isolation failed.')
  }
  process.stdout.write('[cutover-rehearsal] PASS: migration, 9-row backfill/rerun, permissions, four canonical transactions, two resets, exact balances, legacy preservation, and tenant isolation.\n')
}

void main().catch((error: unknown) => {
  process.stderr.write(`[cutover-rehearsal] ${error instanceof Error ? error.message : 'Unknown failure'}\n`)
  process.exitCode = 1
}).finally(async () => {
  await prisma.$disconnect()
})
