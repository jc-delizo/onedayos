import { LinkButton } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { AppPage, SectionHeader } from '@/components/onedayos'
import { sdk } from '@/sdk/server'
import { RecordsShell } from './_components/records-shell'
import { recordAreas } from './_components/records-config'

export default async function RecordsPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  await sdk.auth.requirePageOrgContext(orgSlug)
  const landingAreas = recordAreas.filter((area) => area.id !== 'employees')

  return (
    <RecordsShell orgSlug={orgSlug} activeArea="overview">
      <AppPage
        breadcrumb="Shared Records"
        title="Shared Records"
        description="Shared Records are organization-wide business identities used by enabled apps."
        contextualHelp="Records are not an app. Use the app switcher to return to Inventory or Organization; People administration lives under Organization."
      >
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {landingAreas.map((area) => (
            <Surface key={area.id} className="flex flex-col gap-4 p-4">
              <SectionHeader title={area.label} description={area.description} />
              <div className="mt-auto">
                <LinkButton href={`/${orgSlug}/records/${area.id}`} size="sm" variant="secondary">Open {area.label}</LinkButton>
              </div>
            </Surface>
          ))}
        </div>
      </AppPage>
    </RecordsShell>
  )
}
