import { z } from 'zod'
import { createTableQuerySchema } from '@/components/onedayos/data-table/query-schema'
import { optionalText, requiredText } from '../shared/schema'

const queryBoolean = z.preprocess((value) => value === 'true' ? true : value === 'false' ? false : value, z.boolean())
export const warehouseListQuerySchema = createTableQuerySchema(
  ['code', 'name', 'updatedAt'],
  { isActive: queryBoolean.optional() },
)

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
