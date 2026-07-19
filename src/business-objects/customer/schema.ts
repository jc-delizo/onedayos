import { z } from 'zod'
import { listQuerySchema, optionalEmail, optionalText, requiredText } from '../shared/schema'

export const customerListQuerySchema = listQuerySchema

export const createCustomerSchema = z.strictObject({
  name: requiredText(180),
  email: optionalEmail,
  phone: optionalText(40),
  address: optionalText(500),
})

export const updateCustomerSchema = createCustomerSchema.partial().refine(
  (input) => Object.values(input).some((value) => value !== undefined),
  { message: 'At least one field is required.' },
)

export type CreateCustomerInput = z.infer<typeof createCustomerSchema>
export type UpdateCustomerInput = z.infer<typeof updateCustomerSchema>
