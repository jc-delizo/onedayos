import type { PrismaClient } from '@prisma/client'
import { sdk } from '@/sdk/server'
import { DataTable, EmptyState, SectionHeader, SettingsPage } from '@/components/onedayos'
import { StatusBadge } from '@/components/ui/status-badge'
import { Surface } from '@/components/ui/surface'
import { requireOrganizationAdmin } from '@/platform/organization-admin'

export default async function OrganizationSettingsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  requireOrganizationAdmin(ctx)

  const prisma = sdk.getDb(ctx).prisma as PrismaClient
  const [org, settings] = await Promise.all([
    prisma.organization.findFirst({
      where: { id: ctx.org.id, deletedAt: null },
      select: {
        name: true,
        slug: true,
        status: true,
        isActive: true,
        subscription: { select: { plan: true, status: true } },
      },
    }),
    prisma.setting.findMany({
      where: { orgId: ctx.org.id },
      orderBy: { key: 'asc' },
      select: { id: true, key: true, value: true, updatedAt: true },
    }),
  ])

  return (
    <SettingsPage
      breadcrumb="Organization / Settings"
      title="Settings"
      description="Configure organization-wide preferences supported by OneDayOS."
      contextualHelp="Only supported organization preferences are shown here. Theme appearance remains a personal browser-local preference."
      sections={
        <>
          <Surface className="p-4">
            <SectionHeader title="Organization" description="Core tenant status and subscription state." />
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
                <dt className="text-xs font-medium uppercase tracking-normal text-[var(--color-muted)]">Name</dt>
                <dd className="mt-1 font-medium text-[var(--color-foreground)]">{org?.name ?? ctx.org.name}</dd>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
                <dt className="text-xs font-medium uppercase tracking-normal text-[var(--color-muted)]">Slug</dt>
                <dd className="mt-1 font-medium text-[var(--color-foreground)]">/{org?.slug ?? ctx.org.slug}</dd>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
                <dt className="text-xs font-medium uppercase tracking-normal text-[var(--color-muted)]">Organization</dt>
                <dd className="mt-1">
                  <StatusBadge variant={org?.isActive ? 'success' : 'neutral'}>{org?.status ?? ctx.org.status}</StatusBadge>
                </dd>
              </div>
              <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
                <dt className="text-xs font-medium uppercase tracking-normal text-[var(--color-muted)]">Subscription</dt>
                <dd className="mt-1">
                  <StatusBadge variant="info">{org?.subscription?.status ?? ctx.org.subscriptionStatus}</StatusBadge>
                </dd>
              </div>
            </dl>
          </Surface>

          <Surface className="p-4">
            <SectionHeader title="Configuration" description="Configured values are shown without exposing raw setting payloads." />
            <div className="mt-4">
              <DataTable
                columns={[
                  { id: 'key', header: 'Key', cell: (row) => row.key },
                  {
                    id: 'value',
                    header: 'Value',
                    cell: (row) => (row.value === null ? 'Not set' : 'Configured'),
                  },
                  { id: 'updatedAt', header: 'Updated', cell: (row) => row.updatedAt.toLocaleDateString() },
                ]}
                rows={settings}
                getRowId={(row) => row.id}
                emptyState={<EmptyState title="No settings configured" description="Organization preferences will appear here when configured." />}
              />
            </div>
          </Surface>
        </>
      }
    />
  )
}
