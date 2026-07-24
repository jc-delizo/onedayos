import { sdk } from '@/sdk/server'
import { ListPage, SectionHeader } from '@/components/onedayos'
import { Surface } from '@/components/ui/surface'
import { OrganizationTableService, organizationTableQuerySchema } from '@/platform/organization/table-service'
import { ORGANIZATION_EXPORT_PERMISSIONS, requireOrganizationAdmin } from '@/platform/organization-admin'
import { OrganizationStructureTable } from '../_components/organization-data-tables'

export default async function BranchesDepartmentsPage({ params, searchParams }: { params: Promise<{ orgSlug: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  requireOrganizationAdmin(ctx)
  const query = organizationTableQuerySchema.parse(await searchParams)
  const result = await OrganizationTableService.listStructure(ctx, query)

  return (
    <ListPage
      breadcrumb="Organization / Branches & Departments"
      title="Branches & Departments"
      headerMode="compact"
    >
      <Surface className="p-4">
        <SectionHeader title="Branches" description="Operational locations or branches for this organization." />
        <div className="mt-4">
          <OrganizationStructureTable kind="branches" orgSlug={orgSlug} rows={result.branches.rows} query={query} pageMeta={result.branches.meta} canExport={sdk.permissions.can(ctx, ORGANIZATION_EXPORT_PERMISSIONS.BRANCH)} />
        </div>
      </Surface>

      <Surface className="p-4">
        <SectionHeader title="Departments" description="Departments may optionally belong to a branch." />
        <div className="mt-4">
          <OrganizationStructureTable kind="departments" orgSlug={orgSlug} rows={result.departments.rows} query={query} pageMeta={result.departments.meta} canExport={sdk.permissions.can(ctx, ORGANIZATION_EXPORT_PERMISSIONS.DEPARTMENT)} />
        </div>
      </Surface>
    </ListPage>
  )
}
