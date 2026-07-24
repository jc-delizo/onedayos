import 'server-only'
import type { PrismaClient, Warehouse } from '@prisma/client'
import type { PlatformContext } from '@/sdk'
import { createBusinessObjectService } from '../shared/service-factory'
import { requireSameOrgReference } from '../shared/service-utils'
import { WAREHOUSE_EVENTS } from './events'
import { WAREHOUSE_PERMISSIONS } from './permissions'
import type { CreateWarehouseInput, UpdateWarehouseInput } from './schema'

async function validateBranchReference(
  ctx: PlatformContext,
  prisma: PrismaClient,
  branchId: string | undefined,
) {
  if (!branchId) return

  await requireSameOrgReference(
    prisma.branch.findFirst({
      where: {
        id: branchId,
        orgId: ctx.org.id,
        deletedAt: null,
      },
    }),
    'Branch was not found for this organization.',
  )
}

export const WarehouseService = createBusinessObjectService<CreateWarehouseInput, UpdateWarehouseInput, Warehouse>({
  delegate: (prisma) => prisma.warehouse,
  permissions: WAREHOUSE_PERMISSIONS,
  events: WAREHOUSE_EVENTS,
  eventIdField: 'warehouseId',
  searchFields: ['code', 'name', 'address'],
  orderBy: { name: 'asc' },
  listArgs: {
    include: {
      branch: {
        select: { name: true },
      },
    },
  },
  async createData(input, ctx, prisma) {
    await validateBranchReference(ctx, prisma, input.branchId)

    return {
      code: input.code,
      name: input.name,
      address: input.address,
      branchId: input.branchId,
      isActive: input.isActive ?? true,
    }
  },
  async updateData(input, ctx, prisma) {
    await validateBranchReference(ctx, prisma, input.branchId)

    return {
      code: input.code,
      name: input.name,
      address: input.address,
      branchId: input.branchId,
      isActive: input.isActive,
    }
  },
  deactivateData: {
    isActive: false,
  },
  reactivateData: {
    isActive: true,
  },
})
