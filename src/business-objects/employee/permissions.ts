import { objectPermission } from '../shared/permissions'

export const EMPLOYEE_PERMISSIONS = {
  READ: objectPermission('employee', 'read'),
  CREATE: objectPermission('employee', 'create'),
  UPDATE: objectPermission('employee', 'update'),
  DELETE: objectPermission('employee', 'delete'),
  RESTORE: objectPermission('employee', 'restore'),
  DEACTIVATE: objectPermission('employee', 'deactivate'),
  REACTIVATE: objectPermission('employee', 'reactivate'),
} as const
