import { z } from 'zod'

export const SUPPLIER_EVENTS = {
  CREATED: 'objects.supplier.created',
  UPDATED: 'objects.supplier.updated',
  DELETED: 'objects.supplier.deleted',
  RESTORED: 'objects.supplier.restored',
} as const

export const supplierEventPayloadSchema = z.strictObject({
  supplierId: z.string().min(1),
  changedFields: z.array(z.string().min(1)).optional(),
})
