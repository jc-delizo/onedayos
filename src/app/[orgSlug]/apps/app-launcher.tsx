import { LinkButton } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { EmptyState, PageHeader, SectionHeader } from '@/components/onedayos'
import type { TenantAppSwitcherItem } from '@/platform/navigation/types'

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
        description="Open an available OneDayOS app for this organization. Shared Records support apps, but Records are not an app."
      />
      {apps.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {apps.map((app) => (
            <Surface key={app.id} className="flex min-h-44 flex-col gap-4 p-4">
              <SectionHeader title={app.label} description={app.description} />
              <div className="mt-auto">
                <LinkButton href={app.href} size="sm" variant="primary">
                  Open {app.label}
                </LinkButton>
              </div>
            </Surface>
          ))}
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
