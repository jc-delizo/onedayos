import { LinkButton } from '@/components/ui/button'
import { StatusBadge } from '@/components/ui/status-badge'
import { EMPLOYEE_PERMISSIONS, EmployeeService } from '@/business-objects/employee'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../_components/records-config'
import { RecordsListPage } from '../_components/records-list-page'

export default async function EmployeesPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const records = await EmployeeService.list(ctx, {})
  const area = getRecordArea('employees')
  const canCreate = sdk.permissions.can(ctx, EMPLOYEE_PERMISSIONS.CREATE)
  const canUpdate = sdk.permissions.can(ctx, EMPLOYEE_PERMISSIONS.UPDATE)

  return (
    <RecordsListPage
      orgSlug={orgSlug}
      area={area}
      rows={records}
      getRowId={(row) => row.id}
      columns={[
        { id: 'employeeNo', header: 'No.', cell: (row) => row.employeeNo },
        { id: 'name', header: 'Name', cell: (row) => row.name },
        { id: 'position', header: 'Position', cell: (row) => row.position ?? '—' },
        {
          id: 'status',
          header: 'Status',
          cell: (row) => <StatusBadge variant={row.employmentStatus === 'active' ? 'success' : 'neutral'}>{row.employmentStatus}</StatusBadge>,
        },
      ]}
      canCreate={canCreate}
      rowActions={
        canUpdate
          ? (row) => <LinkButton href={`/${orgSlug}/records/employees/${row.id}/edit`} size="sm" variant="outline">Edit</LinkButton>
          : undefined
      }
    />
  )
}
