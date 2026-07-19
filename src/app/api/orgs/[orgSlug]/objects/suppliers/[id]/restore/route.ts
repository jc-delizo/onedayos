import { createBusinessObjectRestoreHandler } from '@/business-objects/shared/api-routes'
import { SupplierService, SUPPLIER_PERMISSIONS } from '@/business-objects/supplier'

export const POST = createBusinessObjectRestoreHandler({
  service: SupplierService,
  permission: SUPPLIER_PERMISSIONS.RESTORE,
})
