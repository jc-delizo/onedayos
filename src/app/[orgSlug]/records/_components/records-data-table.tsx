'use client'

import { DataTableV2, type DataTablePageMeta, type DataTableQueryState, type DataTableV2Column } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import type { RecordAreaId } from './records-config'

export type RecordTableRow = {
  id: string
  code?: string | null
  name: string
  description?: string | null
  unit?: string | null
  email?: string | null
  phone?: string | null
  address?: string | null
  categoryName?: string | null
  isActive?: boolean
  employeeNo?: string | null
  position?: string | null
  employmentStatus?: string | null
}

function columnsFor(areaId: RecordAreaId): DataTableV2Column<RecordTableRow>[] {
  if (areaId === 'products') {
    return [
      { id: 'code', header: 'Code', cell: (row) => row.code ?? '—', accessor: (row) => row.code, sortable: true, required: true },
      { id: 'name', header: 'Name', cell: (row) => row.name, accessor: (row) => row.name, sortable: true, required: true },
      { id: 'category', header: 'Category', cell: (row) => row.categoryName ?? 'Uncategorized', accessor: (row) => row.categoryName },
      { id: 'unit', header: 'Unit', cell: (row) => row.unit ?? '—', accessor: (row) => row.unit },
      { id: 'status', header: 'Status', cell: (row) => <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</StatusBadge>, accessor: (row) => row.isActive ? 'Active' : 'Inactive' },
    ]
  }
  if (areaId === 'warehouses') {
    return [
      { id: 'code', header: 'Code', cell: (row) => row.code ?? '—', accessor: (row) => row.code, sortable: true, required: true },
      { id: 'name', header: 'Name', cell: (row) => row.name, accessor: (row) => row.name, sortable: true, required: true },
      { id: 'address', header: 'Address', cell: (row) => row.address ?? '—', accessor: (row) => row.address },
      { id: 'status', header: 'Status', cell: (row) => <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</StatusBadge>, accessor: (row) => row.isActive ? 'Active' : 'Inactive' },
    ]
  }
  if (areaId === 'customers' || areaId === 'suppliers') {
    return [
      { id: 'name', header: 'Name', cell: (row) => row.name, accessor: (row) => row.name, sortable: true, required: true },
      { id: 'email', header: 'Email', cell: (row) => row.email ?? '—', accessor: (row) => row.email },
      { id: 'phone', header: 'Phone', cell: (row) => row.phone ?? '—', accessor: (row) => row.phone },
    ]
  }
  if (areaId === 'employees') {
    return [
      { id: 'employeeNo', header: 'No.', cell: (row) => row.employeeNo ?? '—', accessor: (row) => row.employeeNo, sortable: true, required: true },
      { id: 'name', header: 'Name', cell: (row) => row.name, accessor: (row) => row.name, sortable: true, required: true },
      { id: 'email', header: 'Email', cell: (row) => row.email ?? '—', accessor: (row) => row.email },
      { id: 'position', header: 'Position', cell: (row) => row.position ?? '—', accessor: (row) => row.position },
      { id: 'status', header: 'Status', cell: (row) => <StatusBadge variant={row.employmentStatus === 'active' ? 'success' : 'neutral'}>{row.employmentStatus ?? '—'}</StatusBadge>, accessor: (row) => row.employmentStatus },
    ]
  }
  return [
    { id: 'name', header: 'Name', cell: (row) => row.name, accessor: (row) => row.name, sortable: true, required: true },
  ]
}

export function RecordsDataTable({
  tableId,
  areaId,
  rows,
  baseHref,
  singular,
  canUpdate,
  canExport,
  exportEndpoint,
  query,
  pageMeta,
}: {
  tableId: string
  areaId: RecordAreaId
  rows: RecordTableRow[]
  baseHref: string
  singular: string
  canUpdate: boolean
  canExport: boolean
  exportEndpoint: string
  query: DataTableQueryState
  pageMeta: DataTablePageMeta
}) {
  return (
    <DataTableV2
      tableId={tableId}
      mode="server"
      query={query}
      pageMeta={pageMeta}
      columns={columnsFor(areaId)}
      rows={rows}
      getRowId={(row) => row.id}
      exportOptions={canExport ? {
        endpoint: exportEndpoint,
        resourceLabel: areaId,
        totalFilteredRows: pageMeta.total,
      } : undefined}
      filters={[
        ...(areaId === 'products'
          ? [
              {
                id: 'isActive',
                label: 'Active state',
                value: query.filters?.isActive,
                options: [
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ],
              },
            ]
          : areaId === 'warehouses'
            ? [{
                id: 'isActive',
                label: 'Active state',
                value: query.filters?.isActive,
                options: [
                  { value: 'true', label: 'Active' },
                  { value: 'false', label: 'Inactive' },
                ],
              }]
            : []),
      ]}
      rowInteraction={{
        href: (row) => canUpdate ? `${baseHref}/${row.id}/edit` : `${baseHref}/${row.id}`,
        label: (row) => `${canUpdate ? 'Edit' : 'View'} ${singular} ${row.name}`,
      }}
      rowActions={(row) => (
        <LinkButton href={canUpdate ? `${baseHref}/${row.id}/edit` : `${baseHref}/${row.id}`} size="sm" variant="outline">
          {canUpdate ? 'Edit' : 'View'}
        </LinkButton>
      )}
      emptyState={undefined}
    />
  )
}
