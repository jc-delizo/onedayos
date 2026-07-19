import type { PrismaClient } from '@prisma/client'
import { sdk } from '@/sdk/server'
import { DataTable, EmptyState, ListPage, SectionHeader } from '@/components/onedayos'
import { StatusBadge } from '@/components/ui/status-badge'
import { Surface } from '@/components/ui/surface'
import { requireOrganizationAdmin } from '@/platform/organization-admin'

export default async function BranchesDepartmentsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  requireOrganizationAdmin(ctx)

  const prisma = sdk.getDb(ctx).prisma as PrismaClient
  const [branches, departments] = await Promise.all([
    prisma.branch.findMany({
      where: { orgId: ctx.org.id, deletedAt: null },
      orderBy: { name: 'asc' },
      select: { id: true, code: true, name: true, isActive: true },
    }),
    prisma.department.findMany({
      where: { orgId: ctx.org.id, deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        code: true,
        name: true,
        isActive: true,
        branch: { select: { name: true } },
      },
    }),
  ])

  return (
    <ListPage
      breadcrumb="Organization / Branches & Departments"
      title="Branches & Departments"
      description="Manage company locations and organizational structure used across OneDayOS."
    >
      <Surface className="p-4">
        <SectionHeader title="Branches" description="Operational locations or branches for this organization." />
        <div className="mt-4">
          <DataTable
            columns={[
              { id: 'code', header: 'Code', cell: (row) => row.code ?? '-' },
              { id: 'name', header: 'Name', cell: (row) => row.name },
              {
                id: 'status',
                header: 'Status',
                cell: (row) => (
                  <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                  </StatusBadge>
                ),
              },
            ]}
            rows={branches}
            getRowId={(row) => row.id}
            emptyState={<EmptyState title="No branches" description="Branches can be added when company structure is ready." />}
          />
        </div>
      </Surface>

      <Surface className="p-4">
        <SectionHeader title="Departments" description="Departments may optionally belong to a branch." />
        <div className="mt-4">
          <DataTable
            columns={[
              { id: 'code', header: 'Code', cell: (row) => row.code ?? '-' },
              { id: 'name', header: 'Name', cell: (row) => row.name },
              { id: 'branch', header: 'Branch', cell: (row) => row.branch?.name ?? '-' },
              {
                id: 'status',
                header: 'Status',
                cell: (row) => (
                  <StatusBadge variant={row.isActive ? 'success' : 'neutral'}>
                    {row.isActive ? 'Active' : 'Inactive'}
                  </StatusBadge>
                ),
              },
            ]}
            rows={departments}
            getRowId={(row) => row.id}
            emptyState={<EmptyState title="No departments" description="Departments can be added as organization structure matures." />}
          />
        </div>
      </Surface>
    </ListPage>
  )
}
