import type { Customer } from '@prisma/client'
import type { CreateCustomerInput, UpdateCustomerInput } from './schema'

export type CustomerRecord = Customer
export type { CreateCustomerInput, UpdateCustomerInput }
