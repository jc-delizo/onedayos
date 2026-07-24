import { sdk } from '@/sdk/server'
import { ListPage, SectionHeader } from '@/components/onedayos'
import { Surface } from '@/components/ui/surface'
import { OrganizationTableService, organizationTableQuerySchema } from '@/platform/organization/table-service'
import { requireOrganizationAdmin } from '@/platform/organization-admin'
import { EMPLOYEE_PERMISSIONS } from '@/business-objects/employee'
import { OrganizationEmployeesTable, OrganizationUsersTable } from '../_components/organization-data-tables'

export default async function OrganizationPeoplePage({ params, searchParams }: { params: Promise<{ orgSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  requireOrganizationAdmin(ctx)
  const query = organizationTableQuerySchema.parse(await searchParams)
  const result = await OrganizationTableService.listPeople(ctx, query)

  return (
    <ListPage
      breadcrumb="Organization / People"
      title="People"
      headerMode="compact"
      contextualHelp="User login and Employee records are related but separate. An Employee can exist without platform login access."
    >
      <Surface className="p-4">
        <SectionHeader title="Platform Users" description="Users can sign in and receive organization roles." />
        <div className="mt-4">
          <OrganizationUsersTable rows={result.users.rows} query={query} pageMeta={result.users.meta} />
        </div>
      </Surface>

      <Surface className="p-4">
        <SectionHeader title="Employees" description="Employees are shared people records and may exist without login access." />
        <div className="mt-4">
          <OrganizationEmployeesTable orgSlug={orgSlug} rows={result.employees.rows} query={query} pageMeta={result.employees.meta} canExport={sdk.permissions.can(ctx, EMPLOYEE_PERMISSIONS.EXPORT)} />
        </div>
      </Surface>
    </ListPage>
  )
}
