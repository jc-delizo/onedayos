import { createBusinessObjectItemHandlers } from '@/business-objects/shared/api-routes'
import { SupplierService, SUPPLIER_PERMISSIONS, updateSupplierSchema } from '@/business-objects/supplier'

const handlers = createBusinessObjectItemHandlers({
  updateSchema: updateSupplierSchema,
  service: SupplierService,
  permissions: SUPPLIER_PERMISSIONS,
})

export const GET = handlers.GET
export const PATCH = handlers.PATCH
export const DELETE = handlers.DELETE
