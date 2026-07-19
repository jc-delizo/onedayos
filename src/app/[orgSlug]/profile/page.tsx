import { sdk } from '@/sdk/server'
import { PageHeader, SectionHeader } from '@/components/onedayos'
import { Surface } from '@/components/ui/surface'

export default async function ProfilePage({ params }: { params: Promise<{ orgSlug: string }> }) {
  const { orgSlug } = await params
  const ctx = await sdk.auth.requirePageOrgContext(orgSlug)

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Profile"
        title={ctx.user.name}
        description="Your current OneDayOS identity and organization context."
      />
      <Surface className="p-4">
        <SectionHeader title="Account" description="Profile editing is intentionally limited in this sandbox pass." />
        <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
            <dt className="text-xs font-medium uppercase tracking-normal text-[var(--color-muted)]">Name</dt>
            <dd className="mt-1 font-medium text-[var(--color-foreground)]">{ctx.user.name}</dd>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
            <dt className="text-xs font-medium uppercase tracking-normal text-[var(--color-muted)]">Email</dt>
            <dd className="mt-1 font-medium text-[var(--color-foreground)]">{ctx.user.email}</dd>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
            <dt className="text-xs font-medium uppercase tracking-normal text-[var(--color-muted)]">Organization</dt>
            <dd className="mt-1 font-medium text-[var(--color-foreground)]">{ctx.org.name}</dd>
          </div>
          <div className="rounded-[var(--radius-sm)] border border-[var(--color-border)] p-3">
            <dt className="text-xs font-medium uppercase tracking-normal text-[var(--color-muted)]">Status</dt>
            <dd className="mt-1 font-medium text-[var(--color-foreground)]">{ctx.user.isActive ? 'Active' : 'Inactive'}</dd>
          </div>
        </dl>
      </Surface>
    </div>
  )
}
