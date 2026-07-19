import { objectPermission } from '../shared/permissions'

export const PRODUCT_PERMISSIONS = {
  READ: objectPermission('product', 'read'),
  CREATE: objectPermission('product', 'create'),
  UPDATE: objectPermission('product', 'update'),
  DELETE: objectPermission('product', 'delete'),
  RESTORE: objectPermission('product', 'restore'),
} as const

export const PRODUCT_CATEGORY_PERMISSIONS = {
  READ: objectPermission('product_category', 'read'),
  CREATE: objectPermission('product_category', 'create'),
  UPDATE: objectPermission('product_category', 'update'),
  DELETE: objectPermission('product_category', 'delete'),
  RESTORE: objectPermission('product_category', 'restore'),
} as const
