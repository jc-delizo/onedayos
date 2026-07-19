import type { ReactNode } from 'react'
import { Surface } from '@/components/ui/surface'
import type { AppPageProps } from './app-page'
import { AppPage } from './app-page'

export type DashboardPageProps = Omit<AppPageProps, 'children'> & {
  metrics?: ReactNode
  primaryContent: ReactNode
  secondaryContent?: ReactNode
}

export function DashboardPage({
  metrics,
  primaryContent,
  secondaryContent,
  ...appPageProps
}: DashboardPageProps) {
  return (
    <AppPage {...appPageProps}>
      {metrics ? <section aria-label="Dashboard metrics" className="grid gap-3 md:grid-cols-3">{metrics}</section> : null}
      <section aria-label="Dashboard content">{primaryContent}</section>
      {secondaryContent ? <section aria-label="Recent activity">{secondaryContent}</section> : null}
    </AppPage>
  )
}

export function DashboardMetric({
  label,
  value,
  description,
}: {
  label: ReactNode
  value: ReactNode
  description?: ReactNode
}) {
  return (
    <Surface className="space-y-2 p-4">
      <p className="text-xs font-medium uppercase tracking-normal text-[var(--color-muted)]">{label}</p>
      <p className="text-2xl font-semibold text-[var(--color-foreground)]">{value}</p>
      {description ? <p className="text-sm leading-6 text-[var(--color-muted)]">{description}</p> : null}
    </Surface>
  )
}
