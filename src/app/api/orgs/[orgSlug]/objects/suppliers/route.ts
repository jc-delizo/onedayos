import { createBusinessObjectCollectionHandlers } from '@/business-objects/shared/api-routes'
import { SupplierService, SUPPLIER_PERMISSIONS, createSupplierSchema, supplierListQuerySchema } from '@/business-objects/supplier'

const handlers = createBusinessObjectCollectionHandlers({
  listSchema: supplierListQuerySchema,
  createSchema: createSupplierSchema,
  service: SupplierService,
  permissions: SUPPLIER_PERMISSIONS,
})

export const GET = handlers.GET
export const POST = handlers.POST
