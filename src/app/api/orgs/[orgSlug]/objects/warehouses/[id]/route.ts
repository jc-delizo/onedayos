import { createBusinessObjectItemHandlers } from '@/business-objects/shared/api-routes'
import { WarehouseService, WAREHOUSE_PERMISSIONS, updateWarehouseSchema } from '@/business-objects/warehouse'

const handlers = createBusinessObjectItemHandlers({
  updateSchema: updateWarehouseSchema,
  service: WarehouseService,
  permissions: WAREHOUSE_PERMISSIONS,
})

export const GET = handlers.GET
export const PATCH = handlers.PATCH
export const DELETE = handlers.DELETE
