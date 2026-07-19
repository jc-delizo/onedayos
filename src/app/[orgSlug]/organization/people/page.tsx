import type { PrismaClient } from '@prisma/client'
import { sdk } from '@/sdk/server'
import { DataTable, EmptyState, ListPage, SectionHeader } from '@/components/onedayos'
import { StatusBadge } from '@/components/ui/status-badge'
import { Surface } from '@/components/ui/surface'
import { requireOrganizationAdmin } from '@/platform/organization-admin'

export default async function OrganizationPeoplePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  requireOrganizationAdmin(ctx)

  const prisma = sdk.getDb(ctx).prisma as PrismaClient
  const [users, employees] = await Promise.all([
    prisma.user.findMany({
      where: { orgId: ctx.org.id, deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        name: true,
        email: true,
        isActive: true,
        roles: {
          select: {
            role: {
              select: { name: true },
            },
          },
        },
      },
    }),
    prisma.employee.findMany({
      where: { orgId: ctx.org.id, deletedAt: null },
      orderBy: { name: 'asc' },
      select: {
        id: true,
        employeeNo: true,
        name: true,
        email: true,
        employmentStatus: true,
        userId: true,
        branch: { select: { name: true } },
        department: { select: { name: true } },
      },
    }),
  ])

  return (
    <ListPage
      breadcrumb="Organization / People"
      title="People"
      description="Manage people and platform-user relationships for this organization."
      contextualHelp="User login and Employee records are related but separate. An Employee can exist without platform login access."
    >
      <Surface className="p-4">
        <SectionHeader title="Platform Users" description="Users can sign in and receive organization roles." />
        <div className="mt-4">
          <DataTable
            columns={[
              { id: 'name', header: 'Name', cell: (row) => row.name },
              { id: 'email', header: 'Email', cell: (row) => row.email },
              {
                id: 'roles',
                header: 'Roles',
                cell: (row) => row.roles.map((assignment) => assignment.role.name).join(', ') || 'No roles',
              },
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
            rows={users}
            getRowId={(row) => row.id}
            emptyState={<EmptyState title="No platform users" description="Users appear here after registration or invitation." />}
          />
        </div>
      </Surface>

      <Surface className="p-4">
        <SectionHeader title="Employees" description="Employees are shared people records and may exist without login access." />
        <div className="mt-4">
          <DataTable
            columns={[
              { id: 'employeeNo', header: 'Employee No.', cell: (row) => row.employeeNo },
              { id: 'name', header: 'Name', cell: (row) => row.name },
              { id: 'email', header: 'Email', cell: (row) => row.email ?? '-' },
              { id: 'branch', header: 'Branch', cell: (row) => row.branch?.name ?? '-' },
              { id: 'department', header: 'Department', cell: (row) => row.department?.name ?? '-' },
              {
                id: 'login',
                header: 'Login',
                cell: (row) => (
                  <StatusBadge variant={row.userId ? 'info' : 'neutral'}>
                    {row.userId ? 'Linked' : 'No login'}
                  </StatusBadge>
                ),
              },
              { id: 'status', header: 'Employment', cell: (row) => row.employmentStatus },
            ]}
            rows={employees}
            getRowId={(row) => row.id}
            emptyState={<EmptyState title="No employees" description="Shared employee records will appear here when created." />}
          />
        </div>
      </Surface>
    </ListPage>
  )
}
