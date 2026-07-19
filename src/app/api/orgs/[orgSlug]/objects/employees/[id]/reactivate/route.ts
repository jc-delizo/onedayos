import { createBusinessObjectStatusActionHandler } from '@/business-objects/shared/api-routes'
import { EmployeeService, EMPLOYEE_PERMISSIONS } from '@/business-objects/employee'

export const POST = createBusinessObjectStatusActionHandler({
  service: EmployeeService,
  permission: EMPLOYEE_PERMISSIONS.REACTIVATE,
  action: 'reactivate',
})
