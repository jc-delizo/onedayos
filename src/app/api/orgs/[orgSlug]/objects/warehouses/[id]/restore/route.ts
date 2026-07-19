import { createBusinessObjectRestoreHandler } from '@/business-objects/shared/api-routes'
import { WarehouseService, WAREHOUSE_PERMISSIONS } from '@/business-objects/warehouse'

export const POST = createBusinessObjectRestoreHandler({
  service: WarehouseService,
  permission: WAREHOUSE_PERMISSIONS.RESTORE,
})
