import { createBusinessObjectRestoreHandler } from '@/business-objects/shared/api-routes'
import { CustomerService, CUSTOMER_PERMISSIONS } from '@/business-objects/customer'

export const POST = createBusinessObjectRestoreHandler({
  service: CustomerService,
  permission: CUSTOMER_PERMISSIONS.RESTORE,
})
