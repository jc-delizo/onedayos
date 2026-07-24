'use client'

import { DataTableV2, type DataTablePageMeta, type DataTableQueryState, type DataTableV2Column } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'

type UserRow = {
  id: string
  name: string
  email: string
  isActive: boolean
  roleNames: string[]
}

type EmployeeRow = {
  id: string
  employeeNo: string
  name: string
  email: string | null
  employmentStatus: string
  userId: string | null
  branchName: string | null
  departmentName: string | null
}

type StructureRow = {
  id: string
  code: string | null
  name: string
  isActive: boolean
  branchName?: string | null
}

export function OrganizationUsersTable({ rows, query, pageMeta }: { rows: UserRow[]; query: DataTableQueryState; pageMeta: DataTablePageMeta }) {
  const columns: DataTableV2Column<UserRow>[] = [
    { id: 'name', header: 'Name', cell: (row) => row.name, accessor: (row) => row.name, sortable: true, required: true },
    { id: 'email', header: 'Email', cell: (row) => row.email, accessor: (row) => row.email },
    { id: 'roles', header: 'Roles', cell: (row) => row.roleNames.join(', ') || 'No roles', accessor: (row) => row.roleNames.join(' ') },
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</StatusBadge>, accessor: (row) => row.isActive ? 'Active' : 'Inactive' },
  ]
  return <DataTableV2 tableId="organization.users" mode="server" query={query} pageMeta={pageMeta} columns={columns} rows={rows} getRowId={(row) => row.id} enableSelection={false} />
}

export function OrganizationEmployeesTable({ orgSlug, rows, query, pageMeta, canExport }: { orgSlug: string; rows: EmployeeRow[]; query: DataTableQueryState; pageMeta: DataTablePageMeta; canExport: boolean }) {
  const columns: DataTableV2Column<EmployeeRow>[] = [
    { id: 'employeeNo', header: 'Employee No.', cell: (row) => row.employeeNo, accessor: (row) => row.employeeNo, sortable: true, required: true },
    { id: 'name', header: 'Name', cell: (row) => row.name, accessor: (row) => row.name, sortable: true, required: true },
    { id: 'email', header: 'Email', cell: (row) => row.email ?? '—', accessor: (row) => row.email },
    { id: 'branch', header: 'Branch', cell: (row) => row.branchName ?? '—', accessor: (row) => row.branchName },
    { id: 'department', header: 'Department', cell: (row) => row.departmentName ?? '—', accessor: (row) => row.departmentName },
    { id: 'login', header: 'Login', cell: (row) => <StatusBadge variant={row.userId ? 'info' : 'neutral'}>{row.userId ? 'Linked' : 'No login'}</StatusBadge>, accessor: (row) => row.userId ? 'Linked' : 'No login' },
    { id: 'status', header: 'Employment', cell: (row) => row.employmentStatus, accessor: (row) => row.employmentStatus },
  ]
  return (
    <DataTableV2
      tableId="organization.people"
      mode="server"
      query={query}
      pageMeta={pageMeta}
      columns={columns}
      rows={rows}
      getRowId={(row) => row.id}
      exportOptions={canExport ? {
        endpoint: `/api/orgs/${orgSlug}/objects/employees/export`,
        resourceLabel: 'employees',
        totalFilteredRows: pageMeta.total,
      } : undefined}
      rowInteraction={{
        href: (row) => `/${orgSlug}/records/employees/${row.id}/edit`,
        label: (row) => `Edit employee ${row.name}`,
      }}
      rowActions={(row) => <LinkButton href={`/${orgSlug}/records/employees/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>}
    />
  )
}

export function OrganizationStructureTable({
  kind,
  rows,
  query,
  pageMeta,
  orgSlug,
  canExport,
}: {
  kind: 'branches' | 'departments'
  rows: StructureRow[]
  query: DataTableQueryState
  pageMeta: DataTablePageMeta
  orgSlug: string
  canExport: boolean
}) {
  const columns: DataTableV2Column<StructureRow>[] = [
    { id: 'code', header: 'Code', cell: (row) => row.code ?? '—', accessor: (row) => row.code, sortable: true, required: true },
    { id: 'name', header: 'Name', cell: (row) => row.name, accessor: (row) => row.name, sortable: true, required: true },
    ...(kind === 'departments'
      ? [{ id: 'branch', header: 'Branch', cell: (row: StructureRow) => row.branchName ?? '—', accessor: (row: StructureRow) => row.branchName }]
      : []),
    { id: 'status', header: 'Status', cell: (row) => <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>{row.isActive ? 'Active' : 'Inactive'}</StatusBadge>, accessor: (row) => row.isActive ? 'Active' : 'Inactive' },
  ]
  return <DataTableV2 tableId={`organization.${kind}`} mode="server" query={query} pageMeta={pageMeta} columns={columns} rows={rows} getRowId={(row) => row.id} exportOptions={canExport ? {
    endpoint: `/api/orgs/${orgSlug}/organization/${kind}/export`,
    resourceLabel: kind,
    totalFilteredRows: pageMeta.total,
  } : undefined} />
}
