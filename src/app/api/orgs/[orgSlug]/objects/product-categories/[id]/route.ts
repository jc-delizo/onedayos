import { createBusinessObjectItemHandlers } from '@/business-objects/shared/api-routes'
import { ProductCategoryService, PRODUCT_CATEGORY_PERMISSIONS, updateProductCategorySchema } from '@/business-objects/product'

const handlers = createBusinessObjectItemHandlers({
  updateSchema: updateProductCategorySchema,
  service: ProductCategoryService,
  permissions: PRODUCT_CATEGORY_PERMISSIONS,
})

export const GET = handlers.GET
export const PATCH = handlers.PATCH
export const DELETE = handlers.DELETE
