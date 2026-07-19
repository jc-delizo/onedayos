import { createBusinessObjectCollectionHandlers } from '@/business-objects/shared/api-routes'
import { CustomerService, CUSTOMER_PERMISSIONS, createCustomerSchema, customerListQuerySchema } from '@/business-objects/customer'

const handlers = createBusinessObjectCollectionHandlers({
  listSchema: customerListQuerySchema,
  createSchema: createCustomerSchema,
  service: CustomerService,
  permissions: CUSTOMER_PERMISSIONS,
})

export const GET = handlers.GET
export const POST = handlers.POST
