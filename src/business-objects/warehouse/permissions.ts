import { objectPermission } from '../shared/permissions'

export const WAREHOUSE_PERMISSIONS = {
  READ: objectPermission('warehouse', 'read'),
  EXPORT: objectPermission('warehouse', 'export'),
  CREATE: objectPermission('warehouse', 'create'),
  UPDATE: objectPermission('warehouse', 'update'),
  DELETE: objectPermission('warehouse', 'delete'),
  RESTORE: objectPermission('warehouse', 'restore'),
  DEACTIVATE: objectPermission('warehouse', 'deactivate'),
  REACTIVATE: objectPermission('warehouse', 'reactivate'),
} as const
