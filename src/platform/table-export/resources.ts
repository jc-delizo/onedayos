import 'server-only'
import { z } from 'zod'
import type { PermissionRequirement, PlatformContext } from '@/sdk'
import {
  stockAdjustmentQuerySchema,
  stockLevelQuerySchema,
  stockMovementQuerySchema,
} from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import type {
  StockAdjustmentListItem,
  StockLevelListItem,
  StockMovementListItem,
} from '@/modules/inventory/types'
import { transactionQuerySchema, type InventoryTransactionType } from '@/modules/inventory/transactions/schemas'
import { InventoryTransactionService } from '@/modules/inventory/transactions/service'
import type { InventoryTransactionDto } from '@/modules/inventory/transactions/ui-types'
import {
  ProductService,
  ProductCategoryService,
  PRODUCT_PERMISSIONS,
  PRODUCT_CATEGORY_PERMISSIONS,
  productListQuerySchema,
  productCategoryListQuerySchema,
} from '@/business-objects/product'
import { CustomerService, CUSTOMER_PERMISSIONS, customerListQuerySchema } from '@/business-objects/customer'
import { SupplierService, SUPPLIER_PERMISSIONS, supplierListQuerySchema } from '@/business-objects/supplier'
import { WarehouseService, WAREHOUSE_PERMISSIONS, warehouseListQuerySchema } from '@/business-objects/warehouse'
import { EmployeeService, EMPLOYEE_PERMISSIONS, employeeListQuerySchema } from '@/business-objects/employee'
import {
  OrganizationTableService,
  organizationTableQuerySchema,
} from '@/platform/organization/table-service'
import { ORGANIZATION_ADMIN_PERMISSION, ORGANIZATION_EXPORT_PERMISSIONS } from '@/platform/organization-admin'
import { createTableExportRequestSchema } from './schema'
import type { ExportColumn, TableExportConfig } from './types'

type AnyRow = Record<string, any>
type AnyQuery = Record<string, any>

export type ExportResource = {
  requestSchema: z.ZodType
  config: TableExportConfig<any, any>
  readPermission: PermissionRequirement
  exportPermission: PermissionRequirement
}

function resource<Row extends AnyRow>({
  ctx,
  name,
  worksheetName,
  querySchema,
  columns,
  defaultColumns,
  readPermission,
  exportPermission,
  listPage,
}: {
  ctx: PlatformContext
  name: string
  worksheetName: string
  querySchema: z.ZodType
  columns: readonly ExportColumn<Row>[]
  defaultColumns: readonly string[]
  readPermission: PermissionRequirement
  exportPermission: PermissionRequirement
  listPage: (ctx: PlatformContext, query: AnyQuery) => Promise<{ rows: Row[]; meta: { total: number } }>
}): ExportResource {
  const allowed = columns.map((column) => column.id) as [string, ...string[]]
  return {
    requestSchema: createTableExportRequestSchema(querySchema, allowed),
    config: {
      resource: name,
      worksheetName,
      columns: columns as readonly ExportColumn<any>[],
      defaultColumns,
      getRowId: (row) => row.id,
      async loadPage(query) {
        const result = await listPage(ctx, query)
        return { rows: result.rows, total: result.meta.total }
      },
    },
    readPermission,
    exportPermission,
  }
}

const stockLevelColumns: readonly ExportColumn<StockLevelListItem>[] = [
  { id: 'productCode', header: 'Product Code', getValue: (row) => row.productCode, required: true },
  { id: 'product', header: 'Product Name', getValue: (row) => row.productName, required: true },
  { id: 'category', header: 'Category', getValue: (row) => row.categoryName },
  { id: 'warehouse', header: 'Warehouse', getValue: (row) => row.warehouseName, required: true },
  { id: 'quantity', header: 'Quantity', getValue: (row) => Number(row.quantity) },
  { id: 'unit', header: 'Unit', getValue: (row) => row.productUnit },
  { id: 'reorder', header: 'Reorder Point', getValue: (row) => row.reorderPoint == null ? null : Number(row.reorderPoint) },
  { id: 'status', header: 'Status', getValue: (row) => row.status === 'ok' ? 'In Stock' : row.status === 'low_stock' ? 'Low Stock' : 'Not Tracked' },
]

const movementColumns: readonly ExportColumn<StockMovementListItem>[] = [
  { id: 'occurredAt', header: 'Date/Time', getValue: (row) => new Date(row.occurredAt), required: true },
  { id: 'productCode', header: 'Product Code', getValue: (row) => row.productCode },
  { id: 'product', header: 'Product Name', getValue: (row) => row.productName, required: true },
  { id: 'warehouse', header: 'Warehouse', getValue: (row) => row.warehouseName },
  { id: 'type', header: 'Movement Type', getValue: (row) => row.type },
  { id: 'quantity', header: 'Quantity Change', getValue: (row) => Number(row.quantityDelta) },
  { id: 'result', header: 'Balance After', getValue: (row) => row.resultingQuantity == null ? null : Number(row.resultingQuantity) },
  { id: 'reason', header: 'Reason', getValue: (row) => row.reason },
]

const adjustmentColumns: readonly ExportColumn<StockAdjustmentListItem>[] = [
  { id: 'createdAt', header: 'Date/Time', getValue: (row) => new Date(row.createdAt), required: true },
  { id: 'productCode', header: 'Product Code', getValue: (row) => row.productCode },
  { id: 'product', header: 'Product Name', getValue: (row) => row.productName, required: true },
  { id: 'warehouse', header: 'Warehouse', getValue: (row) => row.warehouseName },
  { id: 'quantity', header: 'Quantity Change', getValue: (row) => Number(row.quantityDelta) },
  { id: 'before', header: 'Quantity Before', getValue: (row) => Number(row.quantityBefore) },
  { id: 'after', header: 'Quantity After', getValue: (row) => Number(row.quantityAfter) },
  { id: 'reason', header: 'Reason', getValue: (row) => row.reason },
  { id: 'createdBy', header: 'Created By', getValue: (row) => row.createdByName },
]

const transactionColumns: readonly ExportColumn<InventoryTransactionDto>[] = [
  { id: 'transactionNumber', header: 'Transaction Number', getValue: (row) => row.transactionNumber, required: true },
  { id: 'type', header: 'Type', getValue: (row) => row.type, required: true },
  { id: 'status', header: 'Status', getValue: (row) => row.status, required: true },
  { id: 'postedAt', header: 'Posted At', getValue: (row) => new Date(row.postedAt) },
  { id: 'referenceDate', header: 'Reference Date', getValue: (row) => row.referenceDate ? new Date(row.referenceDate) : null },
  { id: 'referenceNumber', header: 'Reference Number', getValue: (row) => row.referenceNumber ?? null },
  { id: 'warehouse', header: 'Warehouse', getValue: (row) => row.warehouse?.name ?? null },
  { id: 'sourceWarehouse', header: 'Source Warehouse', getValue: (row) => row.sourceWarehouse?.name ?? null },
  { id: 'destinationWarehouse', header: 'Destination Warehouse', getValue: (row) => row.destinationWarehouse?.name ?? null },
  { id: 'supplier', header: 'Supplier', getValue: (row) => row.supplier?.name ?? null },
  { id: 'customer', header: 'Customer', getValue: (row) => row.customer?.name ?? null },
  { id: 'lineCount', header: 'Line Count', getValue: (row) => row.lines.length },
  { id: 'reversal', header: 'Reversal Transaction', getValue: (row) => row.reversal?.transactionNumber ?? null },
  { id: 'reversalOf', header: 'Reversal Of', getValue: (row) => row.reversalOf?.transactionNumber ?? null },
  { id: 'reason', header: 'Reason', getValue: (row) => row.reason ?? null },
]

const transactionTypeByKind = {
  receipts: 'RECEIPT',
  issues: 'ISSUE',
  transfers: 'TRANSFER',
  adjustments: 'ADJUSTMENT',
} as const satisfies Record<string, InventoryTransactionType>

const transactionReadPermission = {
  RECEIPT: INVENTORY_PERMISSIONS.RECEIPT_READ,
  ISSUE: INVENTORY_PERMISSIONS.ISSUE_READ,
  TRANSFER: INVENTORY_PERMISSIONS.TRANSFER_READ,
  ADJUSTMENT: INVENTORY_PERMISSIONS.ADJUSTMENT_READ,
} as const

export function inventoryExportResource(
  ctx: PlatformContext,
  kind: 'stock-levels' | 'stock-movements' | 'stock-adjustments' | keyof typeof transactionTypeByKind,
): ExportResource {
  if (kind in transactionTypeByKind) {
    const type = transactionTypeByKind[kind as keyof typeof transactionTypeByKind]
    return resource({
      ctx,
      name: `inventory-${kind}`,
      worksheetName: kind[0].toUpperCase() + kind.slice(1),
      querySchema: transactionQuerySchema.omit({ page: true, pageSize: true, type: true }),
      columns: transactionColumns,
      defaultColumns: transactionColumns.map((column) => column.id),
      readPermission: transactionReadPermission[type],
      exportPermission: INVENTORY_PERMISSIONS.TRANSACTION_EXPORT,
      async listPage(context, query) {
        return InventoryTransactionService.list(context, type, query as never) as unknown as Promise<{
          rows: InventoryTransactionDto[]
          meta: { total: number }
        }>
      },
    })
  }
  if (kind === 'stock-levels') {
    return resource({
      ctx,
      name: 'stock-levels',
      worksheetName: 'Stock Levels',
      querySchema: stockLevelQuerySchema.omit({ page: true, pageSize: true, search: true }),
      columns: stockLevelColumns,
      defaultColumns: stockLevelColumns.map((column) => column.id),
      readPermission: INVENTORY_PERMISSIONS.STOCK_LEVEL_READ,
      exportPermission: INVENTORY_PERMISSIONS.STOCK_LEVEL_EXPORT,
      listPage: InventoryService.listStockLevelsPage.bind(InventoryService) as any,
    })
  }
  if (kind === 'stock-movements') {
    return resource({
      ctx,
      name: 'stock-movements',
      worksheetName: 'Stock Movements',
      querySchema: stockMovementQuerySchema.omit({ page: true, pageSize: true, search: true }),
      columns: movementColumns,
      defaultColumns: movementColumns.map((column) => column.id),
      readPermission: INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ,
      exportPermission: INVENTORY_PERMISSIONS.STOCK_MOVEMENT_EXPORT,
      listPage: InventoryService.listStockMovementsPage.bind(InventoryService) as any,
    })
  }
  return resource({
    ctx,
    name: 'stock-adjustments',
    worksheetName: 'Stock Adjustments',
    querySchema: stockAdjustmentQuerySchema.omit({ page: true, pageSize: true, search: true }),
    columns: adjustmentColumns,
    defaultColumns: adjustmentColumns.map((column) => column.id),
    readPermission: INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ,
    exportPermission: INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_EXPORT,
    listPage: InventoryService.listStockAdjustmentsPage.bind(InventoryService) as any,
  })
}

const objectDefinitions = {
  products: {
    name: 'products',
    worksheetName: 'Products',
    schema: productListQuerySchema,
    service: ProductService,
    read: PRODUCT_PERMISSIONS.READ,
    export: PRODUCT_PERMISSIONS.EXPORT,
    columns: [
      { id: 'code', header: 'Code', getValue: (row: AnyRow) => row.code, required: true },
      { id: 'name', header: 'Name', getValue: (row: AnyRow) => row.name, required: true },
      { id: 'description', header: 'Description', getValue: (row: AnyRow) => row.description },
      { id: 'category', header: 'Category', getValue: (row: AnyRow) => row.category?.name ?? null },
      { id: 'unit', header: 'Unit', getValue: (row: AnyRow) => row.unit },
      { id: 'status', header: 'Status', getValue: (row: AnyRow) => row.isActive ? 'Active' : 'Inactive' },
      { id: 'updatedAt', header: 'Updated At', getValue: (row: AnyRow) => row.updatedAt },
    ],
  },
  'product-categories': {
    name: 'product-categories',
    worksheetName: 'Product Categories',
    schema: productCategoryListQuerySchema,
    service: ProductCategoryService,
    read: PRODUCT_CATEGORY_PERMISSIONS.READ,
    export: PRODUCT_CATEGORY_PERMISSIONS.EXPORT,
    columns: [
      { id: 'name', header: 'Name', getValue: (row: AnyRow) => row.name, required: true },
      { id: 'parent', header: 'Parent Category', getValue: (row: AnyRow) => row.parent?.name ?? null },
    ],
  },
  customers: {
    name: 'customers',
    worksheetName: 'Customers',
    schema: customerListQuerySchema,
    service: CustomerService,
    read: CUSTOMER_PERMISSIONS.READ,
    export: CUSTOMER_PERMISSIONS.EXPORT,
    columns: [
      { id: 'name', header: 'Name', getValue: (row: AnyRow) => row.name, required: true },
      { id: 'email', header: 'Email', getValue: (row: AnyRow) => row.email },
      { id: 'phone', header: 'Phone', getValue: (row: AnyRow) => row.phone },
      { id: 'address', header: 'Address', getValue: (row: AnyRow) => row.address },
    ],
  },
  suppliers: {
    name: 'suppliers',
    worksheetName: 'Suppliers',
    schema: supplierListQuerySchema,
    service: SupplierService,
    read: SUPPLIER_PERMISSIONS.READ,
    export: SUPPLIER_PERMISSIONS.EXPORT,
    columns: [
      { id: 'name', header: 'Name', getValue: (row: AnyRow) => row.name, required: true },
      { id: 'email', header: 'Email', getValue: (row: AnyRow) => row.email },
      { id: 'phone', header: 'Phone', getValue: (row: AnyRow) => row.phone },
      { id: 'address', header: 'Address', getValue: (row: AnyRow) => row.address },
    ],
  },
  warehouses: {
    name: 'warehouses',
    worksheetName: 'Warehouses',
    schema: warehouseListQuerySchema,
    service: WarehouseService,
    read: WAREHOUSE_PERMISSIONS.READ,
    export: WAREHOUSE_PERMISSIONS.EXPORT,
    columns: [
      { id: 'code', header: 'Code', getValue: (row: AnyRow) => row.code, required: true },
      { id: 'name', header: 'Name', getValue: (row: AnyRow) => row.name, required: true },
      { id: 'branch', header: 'Branch', getValue: (row: AnyRow) => row.branch?.name ?? null },
      { id: 'address', header: 'Address', getValue: (row: AnyRow) => row.address },
      { id: 'status', header: 'Status', getValue: (row: AnyRow) => row.isActive ? 'Active' : 'Inactive' },
    ],
  },
  employees: {
    name: 'employees',
    worksheetName: 'Employees',
    schema: employeeListQuerySchema,
    service: EmployeeService,
    read: EMPLOYEE_PERMISSIONS.READ,
    export: EMPLOYEE_PERMISSIONS.EXPORT,
    columns: [
      { id: 'employeeNo', header: 'Employee Number', getValue: (row: AnyRow) => row.employeeNo, required: true },
      { id: 'name', header: 'Name', getValue: (row: AnyRow) => row.name, required: true },
      { id: 'email', header: 'Email', getValue: (row: AnyRow) => row.email },
      { id: 'phone', header: 'Phone', getValue: (row: AnyRow) => row.phone },
      { id: 'branch', header: 'Branch', getValue: (row: AnyRow) => row.branch?.name ?? null },
      { id: 'department', header: 'Department', getValue: (row: AnyRow) => row.department?.name ?? null },
      { id: 'login', header: 'Login', getValue: (row: AnyRow) => row.userId ? 'Linked' : 'No login' },
      { id: 'position', header: 'Position', getValue: (row: AnyRow) => row.position },
      { id: 'employmentType', header: 'Employment Type', getValue: (row: AnyRow) => row.employmentType },
      { id: 'hiredAt', header: 'Hired At', getValue: (row: AnyRow) => row.hiredAt },
      { id: 'status', header: 'Status', getValue: (row: AnyRow) => row.employmentStatus },
    ],
  },
} as const

export type ObjectExportKind = keyof typeof objectDefinitions

export function objectExportResource(ctx: PlatformContext, kind: ObjectExportKind): ExportResource {
  const definition = objectDefinitions[kind]
  return resource({
    ctx,
    name: definition.name,
    worksheetName: definition.worksheetName,
    querySchema: (definition.schema as z.ZodObject<any>).omit({ page: true, pageSize: true, search: true }),
    columns: definition.columns,
    defaultColumns: definition.columns.map((column) => column.id),
    readPermission: definition.read,
    exportPermission: definition.export,
    listPage: definition.service.listPage.bind(definition.service) as never,
  })
}

export function organizationExportResource(
  ctx: PlatformContext,
  kind: 'branches' | 'departments',
): ExportResource {
  const columns: readonly ExportColumn<AnyRow>[] = [
    { id: 'code', header: 'Code', getValue: (row) => row.code, required: true },
    { id: 'name', header: 'Name', getValue: (row) => row.name, required: true },
    ...(kind === 'departments'
      ? [{ id: 'branch', header: 'Branch', getValue: (row: AnyRow) => row.branchName ?? null }]
      : []),
    { id: 'status', header: 'Status', getValue: (row) => row.isActive ? 'Active' : 'Inactive' },
  ]
  return resource({
    ctx,
    name: kind,
    worksheetName: kind === 'branches' ? 'Branches' : 'Departments',
    querySchema: organizationTableQuerySchema.omit({ page: true, pageSize: true, search: true }),
    columns,
    defaultColumns: columns.map((column) => column.id),
    readPermission: ORGANIZATION_ADMIN_PERMISSION,
    exportPermission: kind === 'branches'
      ? ORGANIZATION_EXPORT_PERMISSIONS.BRANCH
      : ORGANIZATION_EXPORT_PERMISSIONS.DEPARTMENT,
    async listPage(context, query) {
      const result = await OrganizationTableService.listStructure(context, query as never)
      return kind === 'branches' ? result.branches : result.departments
    },
  })
}
