import { createBusinessObjectCollectionHandlers } from '@/business-objects/shared/api-routes'
import { WarehouseService, WAREHOUSE_PERMISSIONS, createWarehouseSchema, warehouseListQuerySchema } from '@/business-objects/warehouse'

const handlers = createBusinessObjectCollectionHandlers({
  listSchema: warehouseListQuerySchema,
  createSchema: createWarehouseSchema,
  service: WarehouseService,
  permissions: WAREHOUSE_PERMISSIONS,
})

export const GET = handlers.GET
export const POST = handlers.POST
