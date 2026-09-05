'use client'

import { DataTableV2, EmptyState } from '@/components/onedayos'
import type { DataTablePageMeta, DataTableQueryState, DataTableV2Column } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import type { InventoryTransactionType, TransactionQuery } from '@/modules/inventory/transactions/schemas'
import type { InventoryTransactionDto } from '@/modules/inventory/transactions/ui-types'

const transactionUi = {
  RECEIPT: { singular: 'Receipt', plural: 'Receipts', segment: 'receipts' },
  ISSUE: { singular: 'Issue', plural: 'Issues', segment: 'issues' },
  TRANSFER: { singular: 'Transfer', plural: 'Transfers', segment: 'transfers' },
  ADJUSTMENT: { singular: 'Adjustment', plural: 'Adjustments', segment: 'adjustments' },
} as const

function transactionLocation(row: InventoryTransactionDto): string {
  return row.type === 'TRANSFER'
    ? `${row.sourceWarehouse?.name ?? 'Warehouse'} → ${row.destinationWarehouse?.name ?? 'Warehouse'}`
    : row.warehouse?.name ?? 'Warehouse'
}

export function InventoryTransactionsDataTable({ orgSlug, type, rows, query, pageMeta, warehouseOptions, canReverse, canExport }: {
  orgSlug: string
  type: InventoryTransactionType
  rows: InventoryTransactionDto[]
  query: TransactionQuery
  pageMeta: DataTablePageMeta
  warehouseOptions: Array<{ id: string; label: string }>
  canReverse: boolean
  canExport: boolean
}) {
  const config = transactionUi[type]
  const columns: DataTableV2Column<InventoryTransactionDto>[] = [
    { id: 'transactionNumber', header: 'Transaction', cell: (row) => row.transactionNumber, accessor: (row) => row.transactionNumber, sortable: true, required: true },
    { id: 'postedAt', header: 'Posted', cell: (row) => new Date(row.postedAt).toLocaleString(), accessor: (row) => row.postedAt, sortable: true },
    { id: 'location', header: type === 'TRANSFER' ? 'Route' : 'Warehouse', cell: transactionLocation, accessor: transactionLocation },
    { id: 'reference', header: 'Reference', cell: (row) => row.referenceNumber ?? '—', accessor: (row) => row.referenceNumber },
    { id: 'lines', header: 'Lines', cell: (row) => row.lines.length, accessor: (row) => row.lines.length },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge variant={row.status === 'POSTED' ? 'success' : 'neutral'}>{row.status}</StatusBadge>, accessor: (row) => row.status },
  ]
  return <DataTableV2 tableId={`inventory.transactions.${config.segment}`} mode="server" query={{ q: query.q, page: query.page, pageSize: query.pageSize, sort: query.sort, direction: query.direction, filters: { status: query.status, warehouseId: query.warehouseId } } satisfies DataTableQueryState} pageMeta={pageMeta} columns={columns} rows={rows} getRowId={(row) => row.id} filters={[{ id: 'status', label: 'Status', value: query.status, options: [{ value: 'POSTED', label: 'Posted' }, { value: 'REVERSED', label: 'Reversed' }] }, { id: 'warehouseId', label: 'Warehouse', value: query.warehouseId, options: warehouseOptions.map((option) => ({ value: option.id, label: option.label })) }]} rowInteraction={{ href: (row) => `/${orgSlug}/inventory/transactions/${config.segment}/${row.id}`, label: (row) => `View ${config.singular.toLowerCase()} ${row.transactionNumber}` }} rowActions={(row) => <div className="flex gap-2"><LinkButton href={`/${orgSlug}/inventory/transactions/${config.segment}/${row.id}`} size="sm" variant="outline">View</LinkButton>{canReverse && row.status === 'POSTED' ? <LinkButton href={`/${orgSlug}/inventory/transactions/${config.segment}/${row.id}/reverse`} size="sm" variant="destructive">Reverse</LinkButton> : null}</div>} exportOptions={canExport ? { endpoint: `/api/orgs/${orgSlug}/inventory/transactions/${config.segment}/export`, resourceLabel: config.plural.toLowerCase(), totalFilteredRows: pageMeta.total } : undefined} emptyState={<EmptyState title={`No ${config.plural.toLowerCase()} yet`} description={`Post a ${config.singular.toLowerCase()} to begin this canonical transaction history.`} />} />
}
