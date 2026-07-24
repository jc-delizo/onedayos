'use client'

import { DataTableV2, type DataTablePageMeta, type DataTableQueryState, type DataTableV2Column } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import type {
  StockAdjustmentListItem,
  StockLevelListItem,
  StockMovementListItem,
  InventoryProductSettingListItem,
  InventoryFormOption,
} from '@/modules/inventory/types'
import type { StockAdjustmentQuery, StockLevelQuery, StockMovementQuery } from '@/modules/inventory/schema'

function stockStatus(row: StockLevelListItem) {
  if (Number(row.quantity) <= 0) return { label: 'Out of Stock', variant: 'danger' as const }
  if (row.isLowStock) return { label: 'Low Stock', variant: 'warning' as const }
  return { label: 'In Stock', variant: 'success' as const }
}

export function ProductSettingsDataTable({ orgSlug, rows, query, pageMeta }: { orgSlug: string; rows: InventoryProductSettingListItem[]; query: DataTableQueryState; pageMeta: DataTablePageMeta }) {
  const columns: DataTableV2Column<InventoryProductSettingListItem>[] = [
    { id: 'code', header: 'Code', cell: (row) => row.productCode, accessor: (row) => row.productCode, required: true },
    { id: 'product', header: 'Product', cell: (row) => row.productName, accessor: (row) => row.productName, sortable: true, required: true },
    { id: 'category', header: 'Category', cell: (row) => row.categoryName ?? 'Uncategorized', accessor: (row) => row.categoryName },
    { id: 'tracking', header: 'Tracking', cell: (row) => <StatusBadge variant={row.isStockTracked ? 'success' : 'neutral'}>{row.isStockTracked ? 'Tracked' : 'Not Tracked'}</StatusBadge>, accessor: (row) => row.isStockTracked ? 'Tracked' : 'Not Tracked' },
    { id: 'reorderPoint', header: 'Reorder Point', cell: (row) => `${row.reorderPoint} ${row.productUnit}`, accessor: (row) => Number(row.reorderPoint), sortable: true },
  ]
  return (
    <DataTableV2
      tableId="inventory.product-settings"
      mode="server"
      query={query}
      pageMeta={pageMeta}
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      enableSelection={false}
      rowInteraction={{
        href: (row) => `/${orgSlug}/inventory/related/products/${row.productId}`,
        label: (row) => `View shared Product ${row.productName}`,
      }}
      rowActions={(row) => <LinkButton href={`/${orgSlug}/inventory/related/products/${row.productId}`} size="sm" variant="outline">View Product</LinkButton>}
    />
  )
}

export function StockLevelsDataTable({
  orgSlug,
  rows,
  canAdjust,
  canExport,
  query,
  pageMeta,
  warehouseOptions,
}: {
  orgSlug: string
  rows: StockLevelListItem[]
  canAdjust: boolean
  canExport: boolean
  query: StockLevelQuery
  pageMeta: DataTablePageMeta
  warehouseOptions: InventoryFormOption[]
}) {
  const columns: DataTableV2Column<StockLevelListItem>[] = [
    { id: 'productCode', header: 'Product Code', cell: (row) => row.productCode, accessor: (row) => row.productCode, required: true },
    { id: 'product', header: 'Product', cell: (row) => row.productName, accessor: (row) => row.productName, sortable: true, required: true },
    { id: 'category', header: 'Category', cell: (row) => row.categoryName ?? 'Uncategorized', accessor: (row) => row.categoryName },
    { id: 'warehouse', header: 'Warehouse', cell: (row) => row.warehouseName, accessor: (row) => row.warehouseName, sortable: true },
    { id: 'quantity', header: 'Quantity', cell: (row) => `${row.quantity} ${row.productUnit}`, accessor: (row) => Number(row.quantity), sortable: true },
    { id: 'unit', header: 'Unit', cell: (row) => row.productUnit, accessor: (row) => row.productUnit },
    { id: 'reorder', header: 'Reorder Point', cell: (row) => row.reorderPoint ?? '—', accessor: (row) => Number(row.reorderPoint ?? 0) },
    { id: 'status', header: 'Status', cell: (row) => {
      const status = stockStatus(row)
      return <StatusBadge variant={status.variant}>{status.label}</StatusBadge>
    }, accessor: (row) => stockStatus(row).label },
  ]
  return (
    <DataTableV2
      tableId="inventory.stock-levels"
      mode="server"
      query={query as DataTableQueryState}
      pageMeta={pageMeta}
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      exportOptions={canExport ? {
        endpoint: `/api/orgs/${orgSlug}/inventory/stock-levels/export`,
        resourceLabel: 'stock levels',
        totalFilteredRows: pageMeta.total,
      } : undefined}
      filters={[
        {
          id: 'warehouseId',
          label: 'Warehouse',
          value: query.warehouseId,
          options: warehouseOptions.map((option) => ({ value: option.id, label: option.label })),
        },
      ]}
      rowInteraction={{
        href: (row) => `/${orgSlug}/inventory/stock-levels/${row.id}`,
        label: (row) => `View stock level for ${row.productName} at ${row.warehouseName}`,
      }}
      rowActions={canAdjust ? (row) => (
        <LinkButton
          href={`/${orgSlug}/inventory/stock-adjustments/new?productId=${encodeURIComponent(row.productId)}&warehouseId=${encodeURIComponent(row.warehouseId)}`}
          size="sm"
          variant="outline"
        >
          Adjust Stock
        </LinkButton>
      ) : undefined}
    />
  )
}

export function StockMovementsDataTable({ orgSlug, rows, query, pageMeta, warehouseOptions, canExport }: { orgSlug: string; rows: StockMovementListItem[]; query: StockMovementQuery; pageMeta: DataTablePageMeta; warehouseOptions: InventoryFormOption[]; canExport: boolean }) {
  const columns: DataTableV2Column<StockMovementListItem>[] = [
    { id: 'occurredAt', header: 'Date', cell: (row) => new Date(row.occurredAt).toLocaleString(), accessor: (row) => row.occurredAt, sortable: true, required: true },
    { id: 'product', header: 'Product', cell: (row) => row.productName, accessor: (row) => row.productName, sortable: true, required: true },
    { id: 'warehouse', header: 'Warehouse', cell: (row) => row.warehouseName, accessor: (row) => row.warehouseName },
    { id: 'type', header: 'Type', cell: (row) => <StatusBadge variant="info">{row.type}</StatusBadge>, accessor: (row) => row.type },
    { id: 'quantity', header: 'Delta', cell: (row) => row.quantityDelta, accessor: (row) => Number(row.quantityDelta), sortable: true },
    { id: 'result', header: 'Resulting', cell: (row) => row.resultingQuantity ?? '—', accessor: (row) => Number(row.resultingQuantity ?? 0) },
    { id: 'reason', header: 'Reason', cell: (row) => row.reason ?? '—', accessor: (row) => row.reason },
  ]
  return (
    <DataTableV2
      tableId="inventory.stock-movements"
      mode="server"
      query={query as DataTableQueryState}
      pageMeta={pageMeta}
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      exportOptions={canExport ? {
        endpoint: `/api/orgs/${orgSlug}/inventory/stock-movements/export`,
        resourceLabel: 'stock movements',
        totalFilteredRows: pageMeta.total,
      } : undefined}
      filters={[
        { id: 'warehouseId', label: 'Warehouse', value: query.warehouseId, options: warehouseOptions.map((option) => ({ value: option.id, label: option.label })) },
        { id: 'type', label: 'Movement type', value: query.type, options: [
          { value: 'opening_balance', label: 'Opening balance' },
          { value: 'adjustment_in', label: 'Adjustment in' },
          { value: 'adjustment_out', label: 'Adjustment out' },
          { value: 'manual_in', label: 'Manual in' },
          { value: 'manual_out', label: 'Manual out' },
        ] },
      ]}
      rowInteraction={{
        href: (row) => `/${orgSlug}/inventory/stock-movements/${row.id}`,
        label: (row) => `View immutable movement for ${row.productName}`,
      }}
      rowActions={(row) => <LinkButton href={`/${orgSlug}/inventory/stock-movements/${row.id}`} size="sm" variant="outline">View</LinkButton>}
    />
  )
}

export function StockAdjustmentsDataTable({ orgSlug, rows, query, pageMeta, warehouseOptions, canExport }: { orgSlug: string; rows: StockAdjustmentListItem[]; query: StockAdjustmentQuery; pageMeta: DataTablePageMeta; warehouseOptions: InventoryFormOption[]; canExport: boolean }) {
  const columns: DataTableV2Column<StockAdjustmentListItem>[] = [
    { id: 'createdAt', header: 'Date', cell: (row) => new Date(row.createdAt).toLocaleString(), accessor: (row) => row.createdAt, sortable: true, required: true },
    { id: 'product', header: 'Product', cell: (row) => row.productName, accessor: (row) => row.productName, sortable: true, required: true },
    { id: 'warehouse', header: 'Warehouse', cell: (row) => row.warehouseName, accessor: (row) => row.warehouseName },
    { id: 'before', header: 'Before', cell: (row) => row.quantityBefore, accessor: (row) => Number(row.quantityBefore) },
    { id: 'after', header: 'After', cell: (row) => row.quantityAfter, accessor: (row) => Number(row.quantityAfter) },
    { id: 'quantity', header: 'Delta', cell: (row) => row.quantityDelta, accessor: (row) => Number(row.quantityDelta), sortable: true },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge variant="success">{row.status}</StatusBadge>, accessor: (row) => row.status },
    { id: 'reason', header: 'Reason', cell: (row) => row.reason, accessor: (row) => row.reason },
  ]
  return (
    <DataTableV2
      tableId="inventory.stock-adjustments"
      mode="server"
      query={query as DataTableQueryState}
      pageMeta={pageMeta}
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      exportOptions={canExport ? {
        endpoint: `/api/orgs/${orgSlug}/inventory/stock-adjustments/export`,
        resourceLabel: 'stock adjustments',
        totalFilteredRows: pageMeta.total,
      } : undefined}
      filters={[
        { id: 'warehouseId', label: 'Warehouse', value: query.warehouseId, options: warehouseOptions.map((option) => ({ value: option.id, label: option.label })) },
        { id: 'status', label: 'Status', value: query.status, options: [{ value: 'posted', label: 'Posted' }] },
      ]}
      rowInteraction={{
        href: (row) => `/${orgSlug}/inventory/stock-adjustments/${row.id}`,
        label: (row) => `View posted adjustment for ${row.productName}`,
      }}
      rowActions={(row) => <LinkButton href={`/${orgSlug}/inventory/stock-adjustments/${row.id}`} size="sm" variant="outline">View</LinkButton>}
    />
  )
}
