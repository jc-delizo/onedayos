import { createBusinessObjectStatusActionHandler } from '@/business-objects/shared/api-routes'
import { ProductService, PRODUCT_PERMISSIONS } from '@/business-objects/product'

export const POST = createBusinessObjectStatusActionHandler({
  service: ProductService,
  permission: PRODUCT_PERMISSIONS.UPDATE,
  action: 'reactivate',
})
