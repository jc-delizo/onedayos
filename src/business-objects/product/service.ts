import 'server-only'
import type { PrismaClient, Product, ProductCategory } from '@prisma/client'
import type { PlatformContext } from '@/sdk'
import { apiErrors } from '@/kernel/api/errors'
import { createBusinessObjectService } from '../shared/service-factory'
import { requireSameOrgReference } from '../shared/service-utils'
import { PRODUCT_CATEGORY_EVENTS, PRODUCT_EVENTS } from './events'
import { PRODUCT_CATEGORY_PERMISSIONS, PRODUCT_PERMISSIONS } from './permissions'
import type {
  CreateProductCategoryInput,
  CreateProductInput,
  UpdateProductCategoryInput,
  UpdateProductInput,
} from './schema'

async function validateCategoryReference(
  ctx: PlatformContext,
  prisma: PrismaClient,
  categoryId: string | undefined,
) {
  if (!categoryId) return

  await requireSameOrgReference(
    prisma.productCategory.findFirst({
      where: {
        id: categoryId,
        orgId: ctx.org.id,
        deletedAt: null,
      },
    }),
    'Product category was not found for this organization.',
  )
}

async function validateParentCategoryReference(
  ctx: PlatformContext,
  prisma: PrismaClient,
  parentId: string | undefined,
  currentId?: string,
) {
  if (!parentId) return

  if (currentId && parentId === currentId) {
    throw apiErrors.validation({ parentId: ['A category cannot be its own parent.'] })
  }

  await requireSameOrgReference(
    prisma.productCategory.findFirst({
      where: {
        id: parentId,
        orgId: ctx.org.id,
        deletedAt: null,
      },
    }),
    'Parent category was not found for this organization.',
  )
}

export const ProductService = createBusinessObjectService<CreateProductInput, UpdateProductInput, Product>({
  delegate: (prisma) => prisma.product,
  permissions: {
    ...PRODUCT_PERMISSIONS,
    DEACTIVATE: PRODUCT_PERMISSIONS.UPDATE,
    REACTIVATE: PRODUCT_PERMISSIONS.UPDATE,
  },
  events: PRODUCT_EVENTS,
  eventIdField: 'productId',
  searchFields: ['code', 'name', 'description', 'unit'],
  orderBy: { name: 'asc' },
  async createData(input, ctx, prisma) {
    await validateCategoryReference(ctx, prisma, input.categoryId)

    return {
      code: input.code,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      unit: input.unit ?? 'pcs',
      isActive: input.isActive ?? true,
    }
  },
  async updateData(input, ctx, prisma) {
    await validateCategoryReference(ctx, prisma, input.categoryId)

    return {
      code: input.code,
      name: input.name,
      description: input.description,
      categoryId: input.categoryId,
      unit: input.unit,
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

export const ProductCategoryService = createBusinessObjectService<
  CreateProductCategoryInput,
  UpdateProductCategoryInput,
  ProductCategory
>({
  delegate: (prisma) => prisma.productCategory,
  permissions: PRODUCT_CATEGORY_PERMISSIONS,
  events: PRODUCT_CATEGORY_EVENTS,
  eventIdField: 'productCategoryId',
  searchFields: ['name'],
  orderBy: { name: 'asc' },
  async createData(input, ctx, prisma) {
    await validateParentCategoryReference(ctx, prisma, input.parentId)

    return {
      name: input.name,
      parentId: input.parentId,
    }
  },
  async updateData(input, ctx, prisma, id) {
    await validateParentCategoryReference(ctx, prisma, input.parentId, id)

    return {
      name: input.name,
      parentId: input.parentId,
    }
  },
})
