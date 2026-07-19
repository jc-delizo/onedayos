import { z } from 'zod'
import { listQuerySchema, optionalDate, optionalEmail, optionalText, requiredText } from '../shared/schema'

export const employeeListQuerySchema = listQuerySchema

export const createEmployeeSchema = z.strictObject({
  employeeNo: requiredText(64),
  name: requiredText(160),
  email: optionalEmail,
  phone: optionalText(40),
  branchId: optionalText(128),
  departmentId: optionalText(128),
  position: optionalText(120),
  employmentType: optionalText(80),
  employmentStatus: optionalText(40),
  hiredAt: optionalDate,
  endedAt: optionalDate,
})

export const updateEmployeeSchema = createEmployeeSchema.partial().refine(
  (input) => Object.values(input).some((value) => value !== undefined),
  { message: 'At least one field is required.' },
)

export type CreateEmployeeInput = z.infer<typeof createEmployeeSchema>
export type UpdateEmployeeInput = z.infer<typeof updateEmployeeSchema>
