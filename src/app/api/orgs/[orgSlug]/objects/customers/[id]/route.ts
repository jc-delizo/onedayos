import { createBusinessObjectItemHandlers } from '@/business-objects/shared/api-routes'
import { CustomerService, CUSTOMER_PERMISSIONS, updateCustomerSchema } from '@/business-objects/customer'

const handlers = createBusinessObjectItemHandlers({
  updateSchema: updateCustomerSchema,
  service: CustomerService,
  permissions: CUSTOMER_PERMISSIONS,
})

export const GET = handlers.GET
export const PATCH = handlers.PATCH
export const DELETE = handlers.DELETE
