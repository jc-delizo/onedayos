import { z } from 'zod'
import { listQuerySchema, optionalText, requiredText } from '../shared/schema'

export const warehouseListQuerySchema = listQuerySchema

export const createWarehouseSchema = z.strictObject({
  code: requiredText(80),
  name: requiredText(180),
  address: optionalText(500),
  branchId: optionalText(128),
  isActive: z.boolean().optional(),
})

export const updateWarehouseSchema = createWarehouseSchema.partial().refine(
  (input) => Object.values(input).some((value) => value !== undefined),
  { message: 'At least one field is required.' },
)

export type CreateWarehouseInput = z.infer<typeof createWarehouseSchema>
export type UpdateWarehouseInput = z.infer<typeof updateWarehouseSchema>
