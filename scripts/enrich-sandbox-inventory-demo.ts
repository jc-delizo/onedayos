import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  hasPlaceholderValue,
  loadDemoEnvFiles,
  quantityDelta,
  stockMovementType,
} from './demo-ops'

const ENRICHMENT_MARKER = 'sandbox-long-running-inventory-demo'

type EnrichmentEnv = Record<string, string | undefined>

type WarehouseSeed = {
  code: string
  name: string
  address: string
}

type SupplierSeed = {
  name: string
  email: string
  phone: string
  address: string
}

type WarehouseLedgerSeed = {
  opening: number
  deltas: number[]
}

type ProductSeed = {
  code: string
  name: string
  unit: string
  category: string
  reorderPoint: number
  warehouses: Record<string, WarehouseLedgerSeed>
}

const CATEGORIES = [
  'Beverages',
  'Coffee & Tea',
  'Snacks',
  'Packaging',
  'Cleaning Supplies',
] as const

const WAREHOUSES: WarehouseSeed[] = [
  { code: 'MAIN', name: 'Main Warehouse', address: 'Sandbox demo warehouse' },
  { code: 'FRONT', name: 'Front Store', address: 'Sandbox front-of-house stock room' },
  { code: 'COLD', name: 'Cold Storage', address: 'Sandbox chilled storage room' },
  { code: 'RETURNS', name: 'Returns & QA', address: 'Sandbox returns and quality-check area' },
]

const SUPPLIERS: SupplierSeed[] = [
  {
    name: 'Demo Supplier Co.',
    email: 'supplier@example.test',
    phone: '+10000000000',
    address: 'Sandbox supplier address',
  },
  {
    name: 'Manila Demo Wholesale',
    email: 'manila-wholesale@example.test',
    phone: '+10000000001',
    address: 'Sandbox Manila supplier address',
  },
  {
    name: 'Cebu Beverage Depot',
    email: 'cebu-beverage@example.test',
    phone: '+10000000002',
    address: 'Sandbox Cebu supplier address',
  },
  {
    name: 'Packaging Sample Supply',
    email: 'packaging-supply@example.test',
    phone: '+10000000003',
    address: 'Sandbox packaging supplier address',
  },
]

const PRODUCTS: ProductSeed[] = [
  {
    code: 'WAT-500',
    name: 'Bottled Water 500ml',
    unit: 'bottle',
    category: 'Beverages',
    reorderPoint: 50,
    warehouses: { MAIN: { opening: 85, deltas: [40, -18, 26, -13] } },
  },
  {
    code: 'TEA-1L',
    name: 'Iced Tea 1L',
    unit: 'bottle',
    category: 'Beverages',
    reorderPoint: 25,
    warehouses: { MAIN: { opening: 30, deltas: [22, -12, 7, -12] } },
  },
  {
    code: 'COF-1KG',
    name: 'Coffee Beans 1kg',
    unit: 'bag',
    category: 'Coffee & Tea',
    reorderPoint: 10,
    warehouses: { MAIN: { opening: 18, deltas: [-4, 12, -9, -9] } },
  },
  {
    code: 'SPK-330',
    name: 'Sparkling Water 330ml',
    unit: 'can',
    category: 'Beverages',
    reorderPoint: 36,
    warehouses: {
      MAIN: { opening: 60, deltas: [42, -24, 18, -10] },
      FRONT: { opening: 18, deltas: [12, -9, 6] },
    },
  },
  {
    code: 'JCE-1L',
    name: 'Orange Juice 1L',
    unit: 'carton',
    category: 'Beverages',
    reorderPoint: 18,
    warehouses: {
      MAIN: { opening: 34, deltas: [18, -11, 9, -8] },
      COLD: { opening: 15, deltas: [10, -7, 4] },
    },
  },
  {
    code: 'MLK-1L',
    name: 'Almond Milk 1L',
    unit: 'carton',
    category: 'Beverages',
    reorderPoint: 20,
    warehouses: {
      MAIN: { opening: 28, deltas: [-6, 12, -14, -8] },
      COLD: { opening: 10, deltas: [8, -6, 3] },
    },
  },
  {
    code: 'TEA-BAG-100',
    name: 'Black Tea Bags 100ct',
    unit: 'box',
    category: 'Coffee & Tea',
    reorderPoint: 12,
    warehouses: { MAIN: { opening: 22, deltas: [10, -8, 7, -5] } },
  },
  {
    code: 'COC-500',
    name: 'Cocoa Powder 500g',
    unit: 'pack',
    category: 'Coffee & Tea',
    reorderPoint: 14,
    warehouses: { MAIN: { opening: 20, deltas: [8, -6, 7, -4] } },
  },
  {
    code: 'SUG-SACH',
    name: 'Sugar Sachets 1000ct',
    unit: 'case',
    category: 'Coffee & Tea',
    reorderPoint: 8,
    warehouses: { MAIN: { opening: 15, deltas: [-4, 9, -6, 3] } },
  },
  {
    code: 'CHP-SEA',
    name: 'Sea Salt Chips',
    unit: 'case',
    category: 'Snacks',
    reorderPoint: 16,
    warehouses: {
      MAIN: { opening: 26, deltas: [14, -12, 8, -6] },
      FRONT: { opening: 8, deltas: [6, -5, 4] },
    },
  },
  {
    code: 'CRK-BUT',
    name: 'Butter Crackers',
    unit: 'case',
    category: 'Snacks',
    reorderPoint: 10,
    warehouses: {
      MAIN: { opening: 18, deltas: [12, -7, 5, -4] },
      FRONT: { opening: 5, deltas: [4, -3, 2] },
    },
  },
  {
    code: 'NUT-MIX',
    name: 'Trail Mix Pouches',
    unit: 'case',
    category: 'Snacks',
    reorderPoint: 12,
    warehouses: { MAIN: { opening: 21, deltas: [8, -9, 6, -5] } },
  },
  {
    code: 'CUP-12OZ',
    name: 'Paper Cups 12oz',
    unit: 'sleeve',
    category: 'Packaging',
    reorderPoint: 25,
    warehouses: {
      MAIN: { opening: 38, deltas: [-10, 20, -18, -12] },
      FRONT: { opening: 12, deltas: [8, -5, 4] },
    },
  },
  {
    code: 'LID-12OZ',
    name: 'Cup Lids 12oz',
    unit: 'sleeve',
    category: 'Packaging',
    reorderPoint: 25,
    warehouses: {
      MAIN: { opening: 40, deltas: [-12, 18, -14, -5] },
      FRONT: { opening: 10, deltas: [8, -4, 5] },
    },
  },
  {
    code: 'BAG-PAPER',
    name: 'Small Paper Bags',
    unit: 'bundle',
    category: 'Packaging',
    reorderPoint: 20,
    warehouses: { MAIN: { opening: 35, deltas: [15, -18, 7, -9] } },
  },
  {
    code: 'DSH-SOAP',
    name: 'Dish Soap 1L',
    unit: 'bottle',
    category: 'Cleaning Supplies',
    reorderPoint: 8,
    warehouses: {
      MAIN: { opening: 14, deltas: [6, -5, 4, -3] },
      RETURNS: { opening: 2, deltas: [3, -1, 1] },
    },
  },
  {
    code: 'SAN-500',
    name: 'Hand Sanitizer 500ml',
    unit: 'bottle',
    category: 'Cleaning Supplies',
    reorderPoint: 12,
    warehouses: {
      MAIN: { opening: 24, deltas: [-6, 10, -8, 4] },
      FRONT: { opening: 6, deltas: [5, -3, 2] },
    },
  },
  {
    code: 'TOW-PAPER',
    name: 'Paper Towels',
    unit: 'case',
    category: 'Cleaning Supplies',
    reorderPoint: 9,
    warehouses: { MAIN: { opening: 16, deltas: [6, -7, 5, -4] } },
  },
]

const LEDGER_DATES = [
  new Date('2026-01-08T09:00:00.000Z'),
  new Date('2026-02-05T10:30:00.000Z'),
  new Date('2026-03-11T14:15:00.000Z'),
  new Date('2026-04-09T11:45:00.000Z'),
  new Date('2026-05-14T15:20:00.000Z'),
  new Date('2026-06-12T09:40:00.000Z'),
] as const

function requireEnv(env: EnrichmentEnv): void {
  const required = [
    'ONEDAYOS_DEMO_MODE',
    'ONEDAYOS_SANDBOX_DB_APPROVED',
    'ONEDAYOS_DEMO_RESET_APPROVED',
    'ONEDAYOS_DEMO_ORG_SLUG',
    'ONEDAYOS_DEMO_ADMIN_EMAIL',
    'DATABASE_URL',
    'DIRECT_URL',
  ] as const
  const missing = required.filter((key) => !env[key])

  if (missing.length > 0) {
    throw new Error(`Sandbox Inventory enrichment missing required env vars: ${missing.join(', ')}`)
  }

  if (env.ONEDAYOS_DEMO_MODE !== 'true') {
    throw new Error('ONEDAYOS_DEMO_MODE must be true before enriching sandbox Inventory data.')
  }

  if (env.ONEDAYOS_SANDBOX_DB_APPROVED !== 'true') {
    throw new Error('ONEDAYOS_SANDBOX_DB_APPROVED must be true before enriching sandbox Inventory data.')
  }

  if (env.ONEDAYOS_DEMO_RESET_APPROVED !== 'true') {
    throw new Error('ONEDAYOS_DEMO_RESET_APPROVED must be true because enrichment rebuilds demo Inventory operational rows.')
  }

  if (hasPlaceholderValue(env.DATABASE_URL) || hasPlaceholderValue(env.DIRECT_URL)) {
    throw new Error('Sandbox Inventory enrichment requires non-placeholder sandbox database URLs.')
  }
}

function decimalString(value: number): string {
  return value.toFixed(4)
}

async function ensureSupplier(
  tx: Parameters<Parameters<PrismaClient['$transaction']>[0]>[0],
  orgId: string,
  supplier: SupplierSeed,
) {
  const existing = await tx.supplier.findFirst({
    where: { orgId, name: supplier.name },
    select: { id: true },
  })

  if (existing) {
    await tx.supplier.update({
      where: { id: existing.id },
      data: {
        email: supplier.email,
        phone: supplier.phone,
        address: supplier.address,
        deletedAt: null,
        deletedBy: null,
      },
    })
    return
  }

  await tx.supplier.create({
    data: {
      orgId,
      ...supplier,
    },
  })
}

async function main() {
  loadDemoEnvFiles()
  requireEnv(process.env)

  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
    }),
  })

  try {
    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUnique({
        where: { slug: process.env.ONEDAYOS_DEMO_ORG_SLUG ?? '' },
        select: { id: true },
      })

      if (!org) {
        throw new Error('Configured demo organization was not found.')
      }

      const adminUser = await tx.user.findFirst({
        where: {
          orgId: org.id,
          email: (process.env.ONEDAYOS_DEMO_ADMIN_EMAIL ?? '').toLowerCase(),
          deletedAt: null,
        },
        select: { id: true },
      })

      if (!adminUser) {
        throw new Error('Configured demo admin user was not found.')
      }

      await tx.stockMovement.deleteMany({ where: { orgId: org.id } })
      await tx.stockAdjustment.deleteMany({ where: { orgId: org.id } })
      await tx.stockBalance.deleteMany({ where: { orgId: org.id } })
      await tx.inventoryProductExtension.deleteMany({ where: { orgId: org.id } })

      const branch = await tx.branch.upsert({
        where: { orgId_name: { orgId: org.id, name: 'Main Branch' } },
        update: {
          code: 'MAIN',
          isActive: true,
          deletedAt: null,
          deletedBy: null,
        },
        create: {
          orgId: org.id,
          name: 'Main Branch',
          code: 'MAIN',
          isActive: true,
        },
      })

      const categoryByName = new Map<string, string>()
      for (const categoryName of CATEGORIES) {
        const category = await tx.productCategory.upsert({
          where: { orgId_name: { orgId: org.id, name: categoryName } },
          update: {
            deletedAt: null,
            deletedBy: null,
          },
          create: {
            orgId: org.id,
            name: categoryName,
          },
        })
        categoryByName.set(categoryName, category.id)
      }

      const warehouseByCode = new Map<string, string>()
      for (const warehouseSeed of WAREHOUSES) {
        const warehouse = await tx.warehouse.upsert({
          where: { orgId_code: { orgId: org.id, code: warehouseSeed.code } },
          update: {
            branchId: branch.id,
            name: warehouseSeed.name,
            address: warehouseSeed.address,
            isActive: true,
            deletedAt: null,
            deletedBy: null,
          },
          create: {
            orgId: org.id,
            branchId: branch.id,
            code: warehouseSeed.code,
            name: warehouseSeed.name,
            address: warehouseSeed.address,
            isActive: true,
          },
        })
        warehouseByCode.set(warehouseSeed.code, warehouse.id)
      }

      for (const supplier of SUPPLIERS) {
        await ensureSupplier(tx, org.id, supplier)
      }

      let movementCount = 0
      let adjustmentCount = 0
      let balanceCount = 0

      for (const productSeed of PRODUCTS) {
        const product = await tx.product.upsert({
          where: { orgId_code: { orgId: org.id, code: productSeed.code } },
          update: {
            categoryId: categoryByName.get(productSeed.category),
            name: productSeed.name,
            unit: productSeed.unit,
            isActive: true,
            deletedAt: null,
            deletedBy: null,
          },
          create: {
            orgId: org.id,
            categoryId: categoryByName.get(productSeed.category),
            code: productSeed.code,
            name: productSeed.name,
            unit: productSeed.unit,
            isActive: true,
          },
        })

        await tx.inventoryProductExtension.create({
          data: {
            orgId: org.id,
            productId: product.id,
            reorderPoint: decimalString(productSeed.reorderPoint),
            isStockTracked: true,
          },
        })

        for (const [warehouseCode, ledgerSeed] of Object.entries(productSeed.warehouses)) {
          const warehouseId = warehouseByCode.get(warehouseCode)

          if (!warehouseId) {
            throw new Error(`Unknown warehouse code in enrichment plan: ${warehouseCode}`)
          }

          let currentQuantity = 0
          const plannedQuantities = [ledgerSeed.opening, ...ledgerSeed.deltas.map((delta) => delta)]

          for (let index = 0; index < plannedQuantities.length; index += 1) {
            const before = currentQuantity
            const after = index === 0 ? plannedQuantities[index] : currentQuantity + plannedQuantities[index]

            if (after < 0) {
              throw new Error(`Enrichment plan would create negative stock for ${productSeed.code}.`)
            }

            const eventDate = LEDGER_DATES[Math.min(index, LEDGER_DATES.length - 1)]
            const reason =
              index === 0
                ? 'Long-running demo opening balance'
                : `Long-running demo cycle count ${index}`
            const adjustment = await tx.stockAdjustment.create({
              data: {
                orgId: org.id,
                productId: product.id,
                warehouseId,
                quantityBefore: decimalString(before),
                quantityAfter: decimalString(after),
                quantityDelta: quantityDelta(decimalString(before), decimalString(after)),
                reason,
                notes: `${ENRICHMENT_MARKER}:${productSeed.code}:${warehouseCode}`,
                status: 'posted',
                createdBy: adminUser.id,
                createdAt: eventDate,
              },
            })
            adjustmentCount += 1

            await tx.stockMovement.create({
              data: {
                orgId: org.id,
                productId: product.id,
                warehouseId,
                type: stockMovementType(decimalString(before), decimalString(after)),
                quantityDelta: adjustment.quantityDelta,
                resultingQuantity: adjustment.quantityAfter,
                sourceType: 'stock_adjustment',
                sourceId: adjustment.id,
                reason,
                occurredAt: eventDate,
                createdBy: adminUser.id,
                createdAt: eventDate,
              },
            })
            movementCount += 1
            currentQuantity = after
          }

          await tx.stockBalance.create({
            data: {
              orgId: org.id,
              productId: product.id,
              warehouseId,
              quantity: decimalString(currentQuantity),
            },
          })
          balanceCount += 1
        }
      }

      return {
        categories: CATEGORIES.length,
        products: PRODUCTS.length,
        suppliers: SUPPLIERS.length,
        warehouses: WAREHOUSES.length,
        extensions: PRODUCTS.length,
        balances: balanceCount,
        movements: movementCount,
        adjustments: adjustmentCount,
      }
    }, { timeout: 60_000 })

    console.log('Sandbox Inventory enrichment completed for the configured demo organization only.')
    console.log(
      `COUNTS categories=${result.categories} products=${result.products} suppliers=${result.suppliers} warehouses=${result.warehouses} extensions=${result.extensions} balances=${result.balances} movements=${result.movements} adjustments=${result.adjustments}`,
    )
  } finally {
    await prisma.$disconnect()
  }
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error('Sandbox Inventory enrichment failed.', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    process.exitCode = 1
  })
}
