import { createBusinessObjectStatusActionHandler } from '@/business-objects/shared/api-routes'
import { WarehouseService, WAREHOUSE_PERMISSIONS } from '@/business-objects/warehouse'

export const POST = createBusinessObjectStatusActionHandler({
  service: WarehouseService,
  permission: WAREHOUSE_PERMISSIONS.REACTIVATE,
  action: 'reactivate',
})
