import { objectPermission } from '../shared/permissions'

export const CUSTOMER_PERMISSIONS = {
  READ: objectPermission('customer', 'read'),
  EXPORT: objectPermission('customer', 'export'),
  CREATE: objectPermission('customer', 'create'),
  UPDATE: objectPermission('customer', 'update'),
  DELETE: objectPermission('customer', 'delete'),
  RESTORE: objectPermission('customer', 'restore'),
} as const
