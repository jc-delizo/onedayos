import { z } from 'zod'

export const WAREHOUSE_EVENTS = {
  CREATED: 'objects.warehouse.created',
  UPDATED: 'objects.warehouse.updated',
  DELETED: 'objects.warehouse.deleted',
  RESTORED: 'objects.warehouse.restored',
  DEACTIVATED: 'objects.warehouse.deactivated',
  REACTIVATED: 'objects.warehouse.reactivated',
} as const

export const warehouseEventPayloadSchema = z.strictObject({
  warehouseId: z.string().min(1),
  changedFields: z.array(z.string().min(1)).optional(),
})
