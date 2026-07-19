import 'server-only'
import type { Customer } from '@prisma/client'
import { createBusinessObjectService } from '../shared/service-factory'
import { CUSTOMER_EVENTS } from './events'
import { CUSTOMER_PERMISSIONS } from './permissions'
import type { CreateCustomerInput, UpdateCustomerInput } from './schema'

export const CustomerService = createBusinessObjectService<CreateCustomerInput, UpdateCustomerInput, Customer>({
  delegate: (prisma) => prisma.customer,
  permissions: CUSTOMER_PERMISSIONS,
  events: CUSTOMER_EVENTS,
  eventIdField: 'customerId',
  searchFields: ['name', 'email', 'phone', 'address'],
  orderBy: { name: 'asc' },
  createData(input) {
    return {
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
    }
  },
  updateData(input) {
    return {
      name: input.name,
      email: input.email,
      phone: input.phone,
      address: input.address,
    }
  },
})
