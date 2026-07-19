import { createBusinessObjectItemHandlers } from '@/business-objects/shared/api-routes'
import { EmployeeService, EMPLOYEE_PERMISSIONS, updateEmployeeSchema } from '@/business-objects/employee'

const handlers = createBusinessObjectItemHandlers({
  updateSchema: updateEmployeeSchema,
  service: EmployeeService,
  permissions: EMPLOYEE_PERMISSIONS,
})

export const GET = handlers.GET
export const PATCH = handlers.PATCH
export const DELETE = handlers.DELETE
