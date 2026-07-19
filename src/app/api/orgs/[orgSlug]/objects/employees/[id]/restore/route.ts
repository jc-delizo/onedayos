import { createBusinessObjectRestoreHandler } from '@/business-objects/shared/api-routes'
import { EmployeeService, EMPLOYEE_PERMISSIONS } from '@/business-objects/employee'

export const POST = createBusinessObjectRestoreHandler({
  service: EmployeeService,
  permission: EMPLOYEE_PERMISSIONS.RESTORE,
})
