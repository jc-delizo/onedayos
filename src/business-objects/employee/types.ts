import type { Employee } from '@prisma/client'
import type { CreateEmployeeInput, UpdateEmployeeInput } from './schema'

export type EmployeeRecord = Employee
export type { CreateEmployeeInput, UpdateEmployeeInput }
