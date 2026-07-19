import { sdk } from '@/sdk/server'
import { AppPage, SectionHeader } from '@/components/onedayos'
import { LinkButton } from '@/components/ui/button'
import { Surface } from '@/components/ui/surface'
import { requireOrganizationAdmin } from '@/platform/organization-admin'

const organizationAreas = [
  {
    href: 'people',
    title: 'People',
    description: 'Manage people and platform-user relationships for this organization.',
  },
  {
    href: 'branches-departments',
    title: 'Branches & Departments',
    description: 'Manage company locations and organizational structure used across OneDayOS.',
  },
  {
    href: 'settings',
    title: 'Settings',
    description: 'Configure organization-wide preferences supported by OneDayOS.',
  },
]

export default async function OrganizationPage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)
  requireOrganizationAdmin(ctx)

  return (
    <AppPage
      breadcrumb="Organization"
      title="Organization"
      description="Built-in Org Admin surfaces for people, company structure, and supported organization-wide settings."
      contextualHelp="Organization is a built-in admin app. It is not a business module and is only available to Org Admin users."
    >
      <div className="grid gap-4 md:grid-cols-3">
        {organizationAreas.map((area) => (
          <Surface key={area.href} className="flex flex-col gap-4 p-4">
            <SectionHeader title={area.title} description={area.description} />
            <div className="mt-auto">
              <LinkButton href={`/${orgSlug}/organization/${area.href}`} size="sm" variant="secondary">
                Open {area.title}
              </LinkButton>
            </div>
          </Surface>
        ))}
      </div>
    </AppPage>
  )
}
