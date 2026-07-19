import { createBusinessObjectRestoreHandler } from '@/business-objects/shared/api-routes'
import { ProductCategoryService, PRODUCT_CATEGORY_PERMISSIONS } from '@/business-objects/product'

export const POST = createBusinessObjectRestoreHandler({
  service: ProductCategoryService,
  permission: PRODUCT_CATEGORY_PERMISSIONS.RESTORE,
})
