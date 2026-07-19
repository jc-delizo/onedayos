import { createBusinessObjectCollectionHandlers } from '@/business-objects/shared/api-routes'
import {
  ProductCategoryService,
  PRODUCT_CATEGORY_PERMISSIONS,
  createProductCategorySchema,
  productCategoryListQuerySchema,
} from '@/business-objects/product'

const handlers = createBusinessObjectCollectionHandlers({
  listSchema: productCategoryListQuerySchema,
  createSchema: createProductCategorySchema,
  service: ProductCategoryService,
  permissions: PRODUCT_CATEGORY_PERMISSIONS,
})

export const GET = handlers.GET
export const POST = handlers.POST
