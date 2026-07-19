import { z } from 'zod'
import { listQuerySchema, optionalEmail, optionalText, requiredText } from '../shared/schema'

export const supplierListQuerySchema = listQuerySchema

export const createSupplierSchema = z.strictObject({
  name: requiredText(180),
  email: optionalEmail,
  phone: optionalText(40),
  address: optionalText(500),
})

export const updateSupplierSchema = createSupplierSchema.partial().refine(
  (input) => Object.values(input).some((value) => value !== undefined),
  { message: 'At least one field is required.' },
)

export type CreateSupplierInput = z.infer<typeof createSupplierSchema>
export type UpdateSupplierInput = z.infer<typeof updateSupplierSchema>
