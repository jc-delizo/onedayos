import { createBusinessObjectItemHandlers } from '@/business-objects/shared/api-routes'
import { ProductService, PRODUCT_PERMISSIONS, updateProductSchema } from '@/business-objects/product'

const handlers = createBusinessObjectItemHandlers({
  updateSchema: updateProductSchema,
  service: ProductService,
  permissions: PRODUCT_PERMISSIONS,
})

export const GET = handlers.GET
export const PATCH = handlers.PATCH
export const DELETE = handlers.DELETE
