import { z } from 'zod'

export const EMPLOYEE_EVENTS = {
  CREATED: 'objects.employee.created',
  UPDATED: 'objects.employee.updated',
  DELETED: 'objects.employee.deleted',
  RESTORED: 'objects.employee.restored',
  DEACTIVATED: 'objects.employee.deactivated',
  REACTIVATED: 'objects.employee.reactivated',
} as const

export const employeeEventPayloadSchema = z.strictObject({
  employeeId: z.string().min(1),
  changedFields: z.array(z.string().min(1)).optional(),
})
