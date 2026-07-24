import { Prisma, PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { createClient } from '@supabase/supabase-js'
import { getSupabaseAdminApiKey } from '../src/kernel/env/supabase-admin-key'
import {
  buildCanonicalDemoActivity,
  CANONICAL_DEMO_PRODUCTS,
  hasPlaceholderValue,
  loadDemoEnvFiles,
  permissionKey,
  quantityDelta,
  stockMovementType,
  WAREHOUSE_OPERATOR_PERMISSION_PROFILE,
  WAREHOUSE_OPERATOR_ROLE_NAME,
} from './demo-ops'

loadDemoEnvFiles()

const REQUIRED_ENV = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
  'ONEDAYOS_SANDBOX_DB_APPROVED',
  'ONEDAYOS_DEMO_ADMIN_EMAIL',
  'ONEDAYOS_DEMO_ADMIN_PASSWORD',
  'ONEDAYOS_DEMO_ORG_NAME',
  'ONEDAYOS_DEMO_ORG_SLUG',
  'ONEDAYOS_DEMO_WAREHOUSE_EMAIL',
  'ONEDAYOS_DEMO_WAREHOUSE_PASSWORD',
  'ONEDAYOS_DEMO_WAREHOUSE_NAME',
] as const

type RequiredEnvKey = (typeof REQUIRED_ENV)[number]

function readRequiredEnv(): Record<RequiredEnvKey, string> {
  const invalid = REQUIRED_ENV.filter((key) => {
    const value = process.env[key]
    return !value || hasPlaceholderValue(value)
  })

  if (invalid.length > 0) {
    throw new Error(`Sandbox demo provisioning is missing required env vars: ${invalid.join(', ')}`)
  }

  if (process.env.ONEDAYOS_SANDBOX_DB_APPROVED !== 'true') {
    throw new Error('ONEDAYOS_SANDBOX_DB_APPROVED must be true before provisioning sandbox demo data.')
  }

  if (!/:1320\/?$/.test(process.env.NEXT_PUBLIC_APP_URL ?? '')) {
    throw new Error('NEXT_PUBLIC_APP_URL must use port 1320 for sandbox provisioning.')
  }

  return Object.fromEntries(REQUIRED_ENV.map((key) => [key, process.env[key] as string])) as Record<
    RequiredEnvKey,
    string
  >
}

function assertUrl(value: string, name: string, protocols: string[]): void {
  let parsed: URL

  try {
    parsed = new URL(value)
  } catch {
    throw new Error(`${name} must be a valid URL.`)
  }

  if (!protocols.includes(parsed.protocol)) {
    throw new Error(`${name} must use one of these protocols: ${protocols.join(', ')}`)
  }
}

const env = readRequiredEnv()

assertUrl(env.DATABASE_URL, 'DATABASE_URL', ['postgresql:', 'postgres:'])
assertUrl(env.DIRECT_URL, 'DIRECT_URL', ['postgresql:', 'postgres:'])
assertUrl(env.NEXT_PUBLIC_SUPABASE_URL, 'NEXT_PUBLIC_SUPABASE_URL', ['https:', 'http:'])
assertUrl(env.NEXT_PUBLIC_APP_URL, 'NEXT_PUBLIC_APP_URL', ['https:', 'http:'])

const prisma = new PrismaClient({
  adapter: new PrismaPg({
    connectionString: env.DIRECT_URL,
  }),
})

const supabaseAdmin = createClient(env.NEXT_PUBLIC_SUPABASE_URL, getSupabaseAdminApiKey(), {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
})

type SupabaseAuthUser = {
  id: string
  email?: string | null
}

type DemoAuthUserResult = {
  user: SupabaseAuthUser
  action: 'created' | 'updated'
}

type DemoAuthUserInput = {
  email: string
  password: string
  name: string
  organizationName: string
}

async function findAuthUserByEmail(email: string): Promise<SupabaseAuthUser | null> {
  const normalizedEmail = email.toLowerCase()
  const perPage = 1000

  for (let page = 1; page <= 20; page += 1) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage })

    if (error) {
      throw new Error('Could not inspect Supabase Auth users for sandbox demo provisioning.')
    }

    const found = data.users.find((user) => user.email?.toLowerCase() === normalizedEmail)

    if (found) {
      return found
    }

    if (data.users.length < perPage) {
      return null
    }
  }

  throw new Error('Supabase Auth user list exceeded the provisioning safety page limit.')
}

async function ensureDemoAuthUser(input: DemoAuthUserInput): Promise<DemoAuthUserResult> {
  const email = input.email.toLowerCase()
  const existing = await findAuthUserByEmail(email)

  if (existing) {
    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(existing.id, {
      password: input.password,
      user_metadata: {
        name: input.name,
        organizationName: input.organizationName,
      },
    })

    if (error) {
      throw new Error('Could not update the existing Supabase Auth demo user.')
    }

    return { user: data.user ?? existing, action: 'updated' }
  }

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      organizationName: input.organizationName,
    },
  })

  if (error || !data.user) {
    throw new Error('Could not create the Supabase Auth demo user.')
  }

  return { user: data.user, action: 'created' }
}

async function main() {
  const canonicalActivity = buildCanonicalDemoActivity(new Date())
  const { user: authUser, action: authUserAction } = await ensureDemoAuthUser({
    email: env.ONEDAYOS_DEMO_ADMIN_EMAIL,
    password: env.ONEDAYOS_DEMO_ADMIN_PASSWORD,
    name: 'Demo Admin',
    organizationName: env.ONEDAYOS_DEMO_ORG_NAME,
  })
  const { user: warehouseAuthUser, action: warehouseAuthUserAction } = await ensureDemoAuthUser({
    email: env.ONEDAYOS_DEMO_WAREHOUSE_EMAIL,
    password: env.ONEDAYOS_DEMO_WAREHOUSE_PASSWORD,
    name: env.ONEDAYOS_DEMO_WAREHOUSE_NAME,
    organizationName: env.ONEDAYOS_DEMO_ORG_NAME,
  })
  const demoEmail = env.ONEDAYOS_DEMO_ADMIN_EMAIL.toLowerCase()
  const warehouseEmail = env.ONEDAYOS_DEMO_WAREHOUSE_EMAIL.toLowerCase()

  const summary = await prisma.$transaction(async (tx) => {
    const org = await tx.organization.upsert({
      where: {
        slug: env.ONEDAYOS_DEMO_ORG_SLUG,
      },
      update: {
        name: env.ONEDAYOS_DEMO_ORG_NAME,
        status: 'ACTIVE',
        isActive: true,
        deletedAt: null,
        deletedBy: null,
      },
      create: {
        name: env.ONEDAYOS_DEMO_ORG_NAME,
        slug: env.ONEDAYOS_DEMO_ORG_SLUG,
        status: 'ACTIVE',
        isActive: true,
      },
    })

    await tx.subscription.upsert({
      where: {
        orgId: org.id,
      },
      update: {
        plan: 'demo',
        status: 'ACTIVE',
      },
      create: {
        orgId: org.id,
        plan: 'demo',
        status: 'ACTIVE',
      },
    })

    const user = await tx.user.upsert({
      where: {
        id: authUser.id,
      },
      update: {
        orgId: org.id,
        name: 'Demo Admin',
        email: demoEmail,
        isActive: true,
        deletedAt: null,
        deletedBy: null,
      },
      create: {
        id: authUser.id,
        orgId: org.id,
        name: 'Demo Admin',
        email: demoEmail,
        isActive: true,
      },
    })

    const warehouseUser = await tx.user.upsert({
      where: {
        id: warehouseAuthUser.id,
      },
      update: {
        orgId: org.id,
        name: env.ONEDAYOS_DEMO_WAREHOUSE_NAME,
        email: warehouseEmail,
        isActive: true,
        deletedAt: null,
        deletedBy: null,
      },
      create: {
        id: warehouseAuthUser.id,
        orgId: org.id,
        name: env.ONEDAYOS_DEMO_WAREHOUSE_NAME,
        email: warehouseEmail,
        isActive: true,
      },
    })

    const role = await tx.role.upsert({
      where: {
        orgId_name: {
          orgId: org.id,
          name: 'Admin',
        },
      },
      update: {
        description: 'Full administrative access within this organization.',
        isSystem: true,
        isActive: true,
        deletedAt: null,
        deletedBy: null,
      },
      create: {
        orgId: org.id,
        name: 'Admin',
        description: 'Full administrative access within this organization.',
        isSystem: true,
        isActive: true,
      },
    })

    await tx.userRole.upsert({
      where: {
        orgId_userId_roleId: {
          orgId: org.id,
          userId: user.id,
          roleId: role.id,
        },
      },
      update: {
        createdBy: user.id,
      },
      create: {
        orgId: org.id,
        userId: user.id,
        roleId: role.id,
        createdBy: user.id,
      },
    })

    await tx.permission.upsert({
      where: {
        orgId_roleId_module_resource_action: {
          orgId: org.id,
          roleId: role.id,
          module: '*',
          resource: '*',
          action: '*',
        },
      },
      update: {
        conditions: Prisma.DbNull,
      },
      create: {
        orgId: org.id,
        roleId: role.id,
        module: '*',
        resource: '*',
        action: '*',
        conditions: Prisma.DbNull,
      },
    })

    const warehouseRole = await tx.role.upsert({
      where: {
        orgId_name: {
          orgId: org.id,
          name: WAREHOUSE_OPERATOR_ROLE_NAME,
        },
      },
      update: {
        description: 'Sandbox least-privilege Inventory operator for role-based UX validation preparation.',
        isSystem: false,
        isActive: true,
        deletedAt: null,
        deletedBy: null,
      },
      create: {
        orgId: org.id,
        name: WAREHOUSE_OPERATOR_ROLE_NAME,
        description: 'Sandbox least-privilege Inventory operator for role-based UX validation preparation.',
        isSystem: false,
        isActive: true,
      },
    })

    await tx.userRole.upsert({
      where: {
        orgId_userId_roleId: {
          orgId: org.id,
          userId: warehouseUser.id,
          roleId: warehouseRole.id,
        },
      },
      update: {
        createdBy: user.id,
      },
      create: {
        orgId: org.id,
        userId: warehouseUser.id,
        roleId: warehouseRole.id,
        createdBy: user.id,
      },
    })

    const approvedWarehousePermissionKeys = new Set(WAREHOUSE_OPERATOR_PERMISSION_PROFILE.map(permissionKey))
    const existingWarehousePermissions = await tx.permission.findMany({
      where: {
        orgId: org.id,
        roleId: warehouseRole.id,
      },
      select: {
        id: true,
        module: true,
        resource: true,
        action: true,
      },
    })
    const staleWarehousePermissionIds = existingWarehousePermissions
      .filter((permission) => !approvedWarehousePermissionKeys.has(permissionKey(permission)))
      .map((permission) => permission.id)

    if (staleWarehousePermissionIds.length > 0) {
      await tx.permission.deleteMany({
        where: {
          id: {
            in: staleWarehousePermissionIds,
          },
        },
      })
    }

    for (const permission of WAREHOUSE_OPERATOR_PERMISSION_PROFILE) {
      await tx.permission.upsert({
        where: {
          orgId_roleId_module_resource_action: {
            orgId: org.id,
            roleId: warehouseRole.id,
            module: permission.module,
            resource: permission.resource,
            action: permission.action,
          },
        },
        update: {
          conditions: Prisma.DbNull,
        },
        create: {
          orgId: org.id,
          roleId: warehouseRole.id,
          module: permission.module,
          resource: permission.resource,
          action: permission.action,
          conditions: Prisma.DbNull,
        },
      })
    }

    const orgModule = await tx.orgModule.upsert({
      where: {
        orgId_moduleId: {
          orgId: org.id,
          moduleId: 'inventory',
        },
      },
      update: {
        isEnabled: true,
        enabledAt: new Date(),
        disabledAt: null,
      },
      create: {
        orgId: org.id,
        moduleId: 'inventory',
        isEnabled: true,
        enabledAt: new Date(),
      },
    })

    const branch = await tx.branch.upsert({
      where: {
        orgId_name: {
          orgId: org.id,
          name: 'Main Branch',
        },
      },
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
      where: {
        orgId_name: {
          orgId: org.id,
          name: 'Operations',
        },
      },
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
      where: {
        orgId_name: {
          orgId: org.id,
          name: 'Beverages',
        },
      },
      update: {
        parentId: null,
        deletedAt: null,
        deletedBy: null,
      },
      create: {
        orgId: org.id,
        name: 'Beverages',
      },
    })

    const warehouse = await tx.warehouse.upsert({
      where: {
        orgId_code: {
          orgId: org.id,
          code: 'MAIN',
        },
      },
      update: {
        branchId: branch.id,
        name: 'Main Warehouse',
        address: 'Sandbox demo warehouse',
        isActive: true,
        deletedAt: null,
        deletedBy: null,
      },
      create: {
        orgId: org.id,
        branchId: branch.id,
        code: 'MAIN',
        name: 'Main Warehouse',
        address: 'Sandbox demo warehouse',
        isActive: true,
      },
    })

    const supplier = await tx.supplier.findFirst({
      where: {
        orgId: org.id,
        name: 'Demo Supplier Co.',
        deletedAt: null,
      },
    })

    if (supplier) {
      await tx.supplier.update({
        where: {
          id: supplier.id,
        },
        data: {
          email: 'supplier@example.test',
          phone: '+10000000000',
          address: 'Sandbox supplier address',
          deletedAt: null,
          deletedBy: null,
        },
      })
    } else {
      await tx.supplier.create({
        data: {
          orgId: org.id,
          name: 'Demo Supplier Co.',
          email: 'supplier@example.test',
          phone: '+10000000000',
          address: 'Sandbox supplier address',
        },
      })
    }

    for (const productInput of CANONICAL_DEMO_PRODUCTS) {
      const product = await tx.product.upsert({
        where: {
          orgId_code: {
            orgId: org.id,
            code: productInput.code,
          },
        },
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

      await tx.inventoryProductExtension.upsert({
        where: {
          orgId_productId: {
            orgId: org.id,
            productId: product.id,
          },
        },
        update: {
          reorderPoint: productInput.reorderPoint,
          isStockTracked: true,
          deletedAt: null,
          deletedBy: null,
        },
        create: {
          orgId: org.id,
          productId: product.id,
          reorderPoint: productInput.reorderPoint,
          isStockTracked: true,
        },
      })

      const existingBalance = await tx.stockBalance.findUnique({
        where: {
          orgId_productId_warehouseId: {
            orgId: org.id,
            productId: product.id,
            warehouseId: warehouse.id,
          },
        },
      })

      if (!existingBalance) {
        for (const activity of canonicalActivity[productInput.code]) {
          const adjustment = await tx.stockAdjustment.create({
            data: {
              orgId: org.id,
              productId: product.id,
              warehouseId: warehouse.id,
              quantityBefore: activity.quantityBefore,
              quantityAfter: activity.quantityAfter,
              quantityDelta: quantityDelta(activity.quantityBefore, activity.quantityAfter),
              reason: activity.reason,
              notes: 'sandbox-demo-canonical-activity',
              status: 'posted',
              createdBy: user.id,
              createdAt: activity.occurredAt,
            },
          })

          await tx.stockMovement.create({
            data: {
              orgId: org.id,
              productId: product.id,
              warehouseId: warehouse.id,
              type: stockMovementType(activity.quantityBefore, activity.quantityAfter),
              quantityDelta: adjustment.quantityDelta,
              resultingQuantity: adjustment.quantityAfter,
              sourceType: 'stock_adjustment',
              sourceId: adjustment.id,
              reason: adjustment.reason,
              createdBy: user.id,
              occurredAt: activity.occurredAt,
              createdAt: activity.occurredAt,
            },
          })
        }

        await tx.stockBalance.create({
          data: {
            orgId: org.id,
            productId: product.id,
            warehouseId: warehouse.id,
            quantity: productInput.quantity,
          },
        })
      } else if (Number(existingBalance.quantity) !== Number(productInput.quantity)) {
        const adjustment = await tx.stockAdjustment.create({
          data: {
            orgId: org.id,
            productId: product.id,
            warehouseId: warehouse.id,
            quantityBefore: existingBalance.quantity,
            quantityAfter: productInput.quantity,
            quantityDelta: quantityDelta(String(existingBalance.quantity), productInput.quantity),
            reason: 'Sandbox reset balance',
            notes: 'sandbox-demo-balance-reset',
            status: 'posted',
            createdBy: user.id,
          },
        })

        await tx.stockMovement.create({
          data: {
            orgId: org.id,
            productId: product.id,
            warehouseId: warehouse.id,
            type: stockMovementType(String(existingBalance.quantity), productInput.quantity),
            quantityDelta: adjustment.quantityDelta,
            resultingQuantity: adjustment.quantityAfter,
            sourceType: 'stock_adjustment',
            sourceId: adjustment.id,
            reason: adjustment.reason,
            createdBy: user.id,
          },
        })

        await tx.stockBalance.update({
          where: {
            orgId_productId_warehouseId: {
              orgId: org.id,
              productId: product.id,
              warehouseId: warehouse.id,
            },
          },
          data: {
            quantity: productInput.quantity,
          },
        })
      }
    }

    const legacyDemoMovements = await tx.stockMovement.findMany({
      where: {
        orgId: org.id,
        type: 'adjustment',
        sourceType: 'stock_adjustment',
      },
      select: {
        id: true,
        quantityDelta: true,
        resultingQuantity: true,
      },
    })

    for (const movement of legacyDemoMovements) {
      await tx.stockMovement.update({
        where: {
          id: movement.id,
        },
        data: {
          type: stockMovementType(
            String(Number(movement.resultingQuantity) - Number(movement.quantityDelta)),
            String(movement.resultingQuantity),
          ),
        },
      })
    }

    const [
      productCategoryCount,
      productCount,
      warehouseCount,
      supplierCount,
      productExtensionCount,
      stockBalanceCount,
      stockMovementCount,
      stockAdjustmentCount,
    ] = await Promise.all([
      tx.productCategory.count({ where: { orgId: org.id, deletedAt: null } }),
      tx.product.count({ where: { orgId: org.id, deletedAt: null } }),
      tx.warehouse.count({ where: { orgId: org.id, deletedAt: null } }),
      tx.supplier.count({ where: { orgId: org.id, deletedAt: null } }),
      tx.inventoryProductExtension.count({ where: { orgId: org.id, deletedAt: null } }),
      tx.stockBalance.count({ where: { orgId: org.id } }),
      tx.stockMovement.count({ where: { orgId: org.id } }),
      tx.stockAdjustment.count({ where: { orgId: org.id, deletedAt: null } }),
    ])

    return {
      orgSlug: org.slug,
      demoAdminEmail: user.email,
      warehouseEmail: warehouseUser.email,
      authUserAction,
      warehouseAuthUserAction,
      prismaUserEnsured: true,
      warehousePrismaUserEnsured: true,
      adminRoleEnsured: true,
      adminWildcardPermissionEnsured: true,
      warehouseRoleEnsured: true,
      warehouseUserRoleEnsured: true,
      warehousePermissionProfile: [...approvedWarehousePermissionKeys].sort(),
      warehouseOrgAdminPermissionCount: await tx.permission.count({
        where: {
          orgId: org.id,
          roleId: warehouseRole.id,
          module: 'kernel',
          resource: 'organization',
          action: 'manage',
        },
      }),
      warehouseWildcardPermissionCount: await tx.permission.count({
        where: {
          orgId: org.id,
          roleId: warehouseRole.id,
          module: '*',
          resource: '*',
          action: '*',
        },
      }),
      inventoryEnabled: orgModule.isEnabled,
      productCategoryCount,
      productCount,
      warehouseCount,
      supplierCount,
      productExtensionCount,
      stockBalanceCount,
      stockMovementCount,
      stockAdjustmentCount,
    }
  }, { timeout: 20_000 })

  console.log(
    JSON.stringify(
      {
        ok: true,
        summary,
      },
      null,
      2,
    ),
  )
}

main()
  .catch((error: unknown) => {
    console.error('Sandbox demo provisioning failed.', {
      message: error instanceof Error ? error.message : 'Unknown error',
    })
    process.exitCode = 1
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
