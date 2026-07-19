import { createBusinessObjectCollectionHandlers } from '@/business-objects/shared/api-routes'
import { ProductService, PRODUCT_PERMISSIONS, createProductSchema, productListQuerySchema } from '@/business-objects/product'

const handlers = createBusinessObjectCollectionHandlers({
  listSchema: productListQuerySchema,
  createSchema: createProductSchema,
  service: ProductService,
  permissions: PRODUCT_PERMISSIONS,
})

export const GET = handlers.GET
export const POST = handlers.POST
