import type { ReactNode } from 'react'
import { FormMessage } from '@/components/ui/field'
import { Surface } from '@/components/ui/surface'
import type { AppPageProps } from './app-page'
import { AppPage } from './app-page'

export type SettingsPageProps = Omit<AppPageProps, 'children'> & {
  sectionNavigation?: ReactNode
  sections: ReactNode
  saveState?: ReactNode
  error?: ReactNode
}

export function SettingsPage({
  sectionNavigation,
  sections,
  saveState,
  error,
  ...appPageProps
}: SettingsPageProps) {
  return (
    <AppPage {...appPageProps}>
      {error ? <FormMessage tone="danger">{error}</FormMessage> : null}
      {saveState ? <div role="status" className="text-sm text-[var(--color-muted)]">{saveState}</div> : null}
      <div className={sectionNavigation ? 'grid gap-6 lg:grid-cols-[15rem_minmax(0,1fr)]' : 'space-y-4'}>
        {sectionNavigation ? (
          <aside aria-label="Settings sections">
            <Surface className="p-3">{sectionNavigation}</Surface>
          </aside>
        ) : null}
        <section aria-label="Settings content" className="space-y-4">
          {sections}
        </section>
      </div>
    </AppPage>
  )
}
