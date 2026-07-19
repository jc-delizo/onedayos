import 'server-only'
import type { Supplier } from '@prisma/client'
import { createBusinessObjectService } from '../shared/service-factory'
import { SUPPLIER_EVENTS } from './events'
import { SUPPLIER_PERMISSIONS } from './permissions'
import type { CreateSupplierInput, UpdateSupplierInput } from './schema'

export const SupplierService = createBusinessObjectService<CreateSupplierInput, UpdateSupplierInput, Supplier>({
  delegate: (prisma) => prisma.supplier,
  permissions: SUPPLIER_PERMISSIONS,
  events: SUPPLIER_EVENTS,
  eventIdField: 'supplierId',
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
