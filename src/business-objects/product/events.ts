import { z } from 'zod'

export const PRODUCT_EVENTS = {
  CREATED: 'objects.product.created',
  UPDATED: 'objects.product.updated',
  DEACTIVATED: 'objects.product.deactivated',
  REACTIVATED: 'objects.product.reactivated',
  DELETED: 'objects.product.deleted',
  RESTORED: 'objects.product.restored',
} as const

export const PRODUCT_CATEGORY_EVENTS = {
  CREATED: 'objects.product_category.created',
  UPDATED: 'objects.product_category.updated',
  DELETED: 'objects.product_category.deleted',
  RESTORED: 'objects.product_category.restored',
} as const

export const productEventPayloadSchema = z.strictObject({
  productId: z.string().min(1),
  changedFields: z.array(z.string().min(1)).optional(),
})

export const productCategoryEventPayloadSchema = z.strictObject({
  productCategoryId: z.string().min(1),
  changedFields: z.array(z.string().min(1)).optional(),
})
