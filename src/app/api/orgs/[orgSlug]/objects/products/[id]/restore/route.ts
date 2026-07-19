import { createBusinessObjectRestoreHandler } from '@/business-objects/shared/api-routes'
import { ProductService, PRODUCT_PERMISSIONS } from '@/business-objects/product'

export const POST = createBusinessObjectRestoreHandler({
  service: ProductService,
  permission: PRODUCT_PERMISSIONS.RESTORE,
})
