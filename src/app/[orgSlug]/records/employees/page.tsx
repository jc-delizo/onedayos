import { EMPLOYEE_PERMISSIONS, EmployeeService, employeeListQuerySchema } from '@/business-objects/employee'
import { StatusBadge } from '@/components/ui/status-badge'
import { sdk } from '@/sdk/server'
import { getRecordArea } from '../_components/records-config'
import { RecordsListPage } from '../_components/records-list-page'

export default async function EmployeesPage({ params, searchParams }: { params: Promise<{ orgSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  const query = employeeListQuerySchema.parse(await searchParams)
  const result = await EmployeeService.listPage(ctx, query)
  const records = result.rows
  const area = getRecordArea('employees')
  const canCreate = sdk.permissions.can(ctx, EMPLOYEE_PERMISSIONS.CREATE)
  const canUpdate = sdk.permissions.can(ctx, EMPLOYEE_PERMISSIONS.UPDATE)

  return (
    <RecordsListPage
      orgSlug={orgSlug}
      area={area}
      rows={records}
      v2={{
        rows: records.map((row) => ({
          id: row.id,
          employeeNo: row.employeeNo,
          name: row.name,
          email: row.email,
          position: row.position,
          employmentStatus: row.employmentStatus,
        })),
        canUpdate,
        canExport: sdk.permissions.can(ctx, EMPLOYEE_PERMISSIONS.EXPORT),
        exportEndpoint: `/api/orgs/${orgSlug}/objects/employees/export`,
        query,
        pageMeta: result.meta,
      }}
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
    />
  )
}
