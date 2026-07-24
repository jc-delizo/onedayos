import { LinkButton } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { EmptyState, PageHeader, SectionHeader } from '@/components/onedayos'
import type { TenantAppSwitcherItem } from '@/platform/navigation/types'

const appIcons = { Package, Database, Building2 } as const

export function AppLauncher({
  apps,
}: {
  apps: TenantAppSwitcherItem[]
}) {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Apps"
        title="Choose an app"
        description="Open an available OneDayOS app for this organization. Shared Records provide organization-wide identities reused by enabled apps."
        mode="explanatory"
      />
      {apps.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => {
            const Icon = appIcons[app.icon]

            return (
              <Surface key={app.id} className="flex min-h-44 flex-col gap-4 p-4">
                <Icon aria-hidden="true" className="size-5 text-[var(--color-primary)]" />
                <SectionHeader title={app.label} description={app.description} />
                <div className="mt-auto">
                  <LinkButton href={app.href} size="sm" variant="primary">
                    Open {app.label}
                  </LinkButton>
                </div>
              </Surface>
            )
          })}
        </div>
      ) : (
        <EmptyState
          title="No apps available"
          description="No enabled apps are visible to your account yet. Ask an Org Admin to review your access."
        />
      )}
    </div>
  )
}
import { Building2, Database, Package } from 'lucide-react'
