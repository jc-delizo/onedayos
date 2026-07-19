import { z } from 'zod'

export const CUSTOMER_EVENTS = {
  CREATED: 'objects.customer.created',
  UPDATED: 'objects.customer.updated',
  DELETED: 'objects.customer.deleted',
  RESTORED: 'objects.customer.restored',
} as const

export const customerEventPayloadSchema = z.strictObject({
  customerId: z.string().min(1),
  changedFields: z.array(z.string().min(1)).optional(),
})
