import { LinkButton } from '@/components/ui/button'
import { Panel, Surface } from '@/components/ui/surface'
import { StatusBadge } from '@/components/ui/status-badge'
import { DataTable, FoundationShell, PageHeader, SectionHeader } from '@/components/onedayos'

export default function HomePage() {
  const checks = [
    { id: 'api', area: 'API contract', state: 'JSON envelope' },
    { id: 'tenant', area: 'Tenant context', state: 'Server verified' },
    { id: 'rbac', area: 'RBAC', state: 'Wildcard safe' },
  ]

  return (
    <FoundationShell>
      <div className="grid flex-1 gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="flex flex-col justify-center gap-8">
          <PageHeader
            eyebrow="Foundation Package 1"
            title="The platform base is intentionally narrow."
            description="OneDayOS foundation currently covers authentication, organization context, RBAC, SDK boundaries, Prisma schema, environment safety, and architecture checks."
            actions={
              <>
                <LinkButton href="/login" variant="primary">Login</LinkButton>
                <LinkButton href="/register" variant="secondary">Register</LinkButton>
              </>
            }
          />
          <Surface className="p-4">
            <SectionHeader
              title="Foundation checks"
              description="Visible UI stays quiet while the security and tenancy contract remains explicit."
            />
            <div className="mt-4">
              <DataTable
                columns={[
                  { id: 'area', header: 'Area', cell: (row) => row.area },
                  {
                    id: 'state',
                    header: 'State',
                    cell: (row) => <StatusBadge variant="success">{row.state}</StatusBadge>,
                  },
                ]}
                rows={checks}
                getRowId={(row) => row.id}
              />
            </div>
          </Surface>
        </section>
        <aside className="flex items-center">
          <Panel className="space-y-4 p-5">
            <StatusBadge variant="brand">Port 1320</StatusBadge>
            <h2 className="text-lg font-semibold text-[var(--color-foreground)]">Ready for design-system validation</h2>
            <p className="text-sm leading-6 text-[var(--color-muted)]">
              No modules, dashboards, charts, fake metrics, or client-specific forks are present in this package.
            </p>
          </Panel>
        </aside>
      </div>
    </FoundationShell>
  )
}
