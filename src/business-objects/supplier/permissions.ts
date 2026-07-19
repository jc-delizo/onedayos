import { objectPermission } from '../shared/permissions'

export const SUPPLIER_PERMISSIONS = {
  READ: objectPermission('supplier', 'read'),
  CREATE: objectPermission('supplier', 'create'),
  UPDATE: objectPermission('supplier', 'update'),
  DELETE: objectPermission('supplier', 'delete'),
  RESTORE: objectPermission('supplier', 'restore'),
} as const
