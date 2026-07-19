import type { ReactNode } from 'react'
import { Surface } from '@/components/ui/surface'
import type { AppPageProps } from './app-page'
import { AppPage } from './app-page'

export type DetailPageProps = Omit<AppPageProps, 'children'> & {
  summary: ReactNode
  sections: ReactNode
  metadata?: ReactNode
  actions?: ReactNode
}

export function DetailPage({
  summary,
  sections,
  metadata,
  actions,
  ...appPageProps
}: DetailPageProps) {
  return (
    <AppPage {...appPageProps}>
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_18rem]">
        <div className="space-y-6">
          <Surface className="p-4" aria-label="Record summary">
            {summary}
          </Surface>
          <section aria-label="Record sections" className="space-y-4">
            {sections}
          </section>
        </div>
        {(metadata || actions) ? (
          <aside className="space-y-4" aria-label="Record metadata and actions">
            {actions ? <Surface className="p-4">{actions}</Surface> : null}
            {metadata ? <Surface className="p-4">{metadata}</Surface> : null}
          </aside>
        ) : null}
      </div>
    </AppPage>
  )
}
