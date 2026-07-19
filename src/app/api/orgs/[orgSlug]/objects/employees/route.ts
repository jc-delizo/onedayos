import { createBusinessObjectCollectionHandlers } from '@/business-objects/shared/api-routes'
import { EmployeeService, EMPLOYEE_PERMISSIONS, createEmployeeSchema, employeeListQuerySchema } from '@/business-objects/employee'

const handlers = createBusinessObjectCollectionHandlers({
  listSchema: employeeListQuerySchema,
  createSchema: createEmployeeSchema,
  service: EmployeeService,
  permissions: EMPLOYEE_PERMISSIONS,
})

export const GET = handlers.GET
export const POST = handlers.POST
