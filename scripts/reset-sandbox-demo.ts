import { spawn } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import {
  CANONICAL_DEMO_CATEGORY,
  CANONICAL_DEMO_PRODUCTS,
  CANONICAL_DEMO_SUPPLIER,
  CANONICAL_DEMO_WAREHOUSE,
  DEMO_RESET_REQUIRED_ENV,
  hasPlaceholderValue,
  loadDemoEnvFiles,
  quantityDelta,
  stockMovementType,
} from './demo-ops'
import {
  checksFromDemoData,
  createLiveDemoDataSnapshot,
  formatDemoChecks,
  type DemoCheck,
} from './check-demo-readiness'

type ResetEnv = Record<string, string | undefined>

function check(name: string, ok: boolean, nextAction?: string): DemoCheck {
  return { name, ok, nextAction }
}

export function validateDemoResetEnv(env: ResetEnv, args: string[] = []): DemoCheck[] {
  const checks: DemoCheck[] = [
    check('Demo mode enabled', env.ONEDAYOS_DEMO_MODE === 'true', 'Set ONEDAYOS_DEMO_MODE=true.'),
    check('Sandbox DB approval enabled', env.ONEDAYOS_SANDBOX_DB_APPROVED === 'true', 'Set ONEDAYOS_SANDBOX_DB_APPROVED=true only for the approved sandbox DB.'),
    check('Demo reset approval enabled', env.ONEDAYOS_DEMO_RESET_APPROVED === 'true', 'Set ONEDAYOS_DEMO_RESET_APPROVED=true only before an intentional reset.'),
    check('No arbitrary org slug argument accepted', args.length === 0, 'Remove command arguments; reset uses ONEDAYOS_DEMO_ORG_SLUG only.'),
  ]

  for (const key of DEMO_RESET_REQUIRED_ENV) {
    checks.push(check(`Env ${key} present`, Boolean(env[key]), `Set ${key} privately before reset.`))
  }

  for (const key of ['DATABASE_URL', 'DIRECT_URL']) {
    checks.push(check(`Env ${key} is non-placeholder`, !hasPlaceholderValue(env[key]), `Set ${key} to the approved sandbox database.`))
  }

  return checks
}

async function runProvisioner(): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const child = spawn('npm', ['run', 'demo:provision'], {
      cwd: process.cwd(),
      env: process.env,
      stdio: ['ignore', 'ignore', 'pipe'],
    })
    let stderr = ''

    child.stderr.on('data', (chunk: Buffer) => {
      stderr += chunk.toString('utf8')
    })
    child.on('error', reject)
    child.on('close', (code) => {
      if (code === 0) {
        resolve()
        return
      }

      reject(new Error(stderr.trim() || 'demo:provision failed during reset.'))
    })
  })
}

export async function resetSandboxDemo(env: ResetEnv): Promise<DemoCheck[]> {
  const prisma = new PrismaClient({
    adapter: new PrismaPg({
      connectionString: env.DIRECT_URL ?? env.DATABASE_URL,
    }),
  })

  try {
    await prisma.$transaction(async (tx) => {
      const org = await tx.organization.findUnique({
        where: { slug: env.ONEDAYOS_DEMO_ORG_SLUG ?? '' },
        select: { id: true },
      })

      if (!org) {
        throw new Error('Configured demo organization was not found.')
      }

      const adminUser = await tx.user.findFirst({
        where: {
          orgId: org.id,
          email: (env.ONEDAYOS_DEMO_ADMIN_EMAIL ?? '').toLowerCase(),
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

      await tx.department.upsert({
        where: { orgId_name: { orgId: org.id, name: 'Operations' } },
        update: {
          branchId: branch.id,
          code: 'OPS',
          isActive: true,
          deletedAt: null,
          deletedBy: null,
        },
        create: {
          orgId: org.id,
          branchId: branch.id,
          name: 'Operations',
          code: 'OPS',
          isActive: true,
        },
      })

      const category = await tx.productCategory.upsert({
        where: { orgId_name: { orgId: org.id, name: CANONICAL_DEMO_CATEGORY.name } },
        update: {
          parentId: null,
          deletedAt: null,
          deletedBy: null,
        },
        create: {
          orgId: org.id,
          name: CANONICAL_DEMO_CATEGORY.name,
        },
      })

      const warehouse = await tx.warehouse.upsert({
        where: { orgId_code: { orgId: org.id, code: CANONICAL_DEMO_WAREHOUSE.code } },
        update: {
          branchId: branch.id,
          name: CANONICAL_DEMO_WAREHOUSE.name,
          address: CANONICAL_DEMO_WAREHOUSE.address,
          isActive: true,
          deletedAt: null,
          deletedBy: null,
        },
        create: {
          orgId: org.id,
          branchId: branch.id,
          code: CANONICAL_DEMO_WAREHOUSE.code,
          name: CANONICAL_DEMO_WAREHOUSE.name,
          address: CANONICAL_DEMO_WAREHOUSE.address,
          isActive: true,
        },
      })

      const existingSupplier = await tx.supplier.findFirst({
        where: { orgId: org.id, name: CANONICAL_DEMO_SUPPLIER.name, deletedAt: null },
        select: { id: true },
      })

      if (existingSupplier) {
        await tx.supplier.update({
          where: { id: existingSupplier.id },
          data: {
            email: CANONICAL_DEMO_SUPPLIER.email,
            phone: CANONICAL_DEMO_SUPPLIER.phone,
            address: CANONICAL_DEMO_SUPPLIER.address,
            deletedAt: null,
            deletedBy: null,
          },
        })
      } else {
        await tx.supplier.create({
          data: {
            orgId: org.id,
            ...CANONICAL_DEMO_SUPPLIER,
          },
        })
      }

      for (const productInput of CANONICAL_DEMO_PRODUCTS) {
        const product = await tx.product.upsert({
          where: { orgId_code: { orgId: org.id, code: productInput.code } },
          update: {
            categoryId: category.id,
            name: productInput.name,
            unit: productInput.unit,
            isActive: true,
            deletedAt: null,
            deletedBy: null,
          },
          create: {
            orgId: org.id,
            categoryId: category.id,
            code: productInput.code,
            name: productInput.name,
            unit: productInput.unit,
            isActive: true,
          },
        })

        await tx.inventoryProductExtension.create({
          data: {
            orgId: org.id,
            productId: product.id,
            reorderPoint: productInput.reorderPoint,
            isStockTracked: true,
          },
        })

        const adjustment = await tx.stockAdjustment.create({
          data: {
            orgId: org.id,
            productId: product.id,
            warehouseId: warehouse.id,
            quantityBefore: '0',
            quantityAfter: productInput.quantity,
            quantityDelta: quantityDelta('0', productInput.quantity),
            reason: 'Sandbox opening balance',
            notes: 'sandbox-demo-reset-baseline',
            status: 'posted',
            createdBy: adminUser.id,
          },
        })

        await tx.stockMovement.create({
          data: {
            orgId: org.id,
            productId: product.id,
            warehouseId: warehouse.id,
            type: stockMovementType('0', productInput.quantity),
            quantityDelta: adjustment.quantityDelta,
            resultingQuantity: adjustment.quantityAfter,
            sourceType: 'stock_adjustment',
            sourceId: adjustment.id,
            reason: adjustment.reason,
            createdBy: adminUser.id,
          },
        })

        await tx.stockBalance.create({
          data: {
            orgId: org.id,
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: productInput.quantity,
          },
        })
      }
    })
  } finally {
    await prisma.$disconnect()
  }

  await runProvisioner()

  return checksFromDemoData(await createLiveDemoDataSnapshot(env))
}

async function main() {
  loadDemoEnvFiles()
  const guardChecks = validateDemoResetEnv(process.env, process.argv.slice(2))

  if (guardChecks.some((item) => !item.ok)) {
    console.log(formatDemoChecks(guardChecks))
    console.error('Sandbox demo reset refused. Fix failed guard names only; do not print secrets.')
    process.exitCode = 1
    return
  }

  const dataChecks = await resetSandboxDemo(process.env)
  const checks = [...guardChecks, ...dataChecks]

  console.log(formatDemoChecks(checks))

  if (checks.some((item) => !item.ok)) {
    console.error('Sandbox demo reset finished with failed verification checks.')
    process.exitCode = 1
    return
  }

  console.log('Sandbox demo reset completed for the configured demo organization only.')
}

const isDirectRun = process.argv[1] === fileURLToPath(import.meta.url)

if (isDirectRun) {
  main().catch((error: unknown) => {
    console.error('Sandbox demo reset failed.', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    process.exitCode = 1
  })
}
