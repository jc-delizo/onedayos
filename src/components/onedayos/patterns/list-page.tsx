import type { ReactNode } from 'react'
import type { AppPageProps } from './app-page'
import { AppPage } from './app-page'
import {
  FilteredEmptyPageState,
  SafePageErrorState,
  TablePageLoadingState,
  TrueEmptyState,
} from './page-states'

export type ListPageState =
  | { type: 'ready' }
  | { type: 'loading'; label?: string }
  | { type: 'empty'; title: ReactNode; description?: ReactNode; action?: ReactNode }
  | { type: 'filtered-empty'; action?: ReactNode }
  | { type: 'error'; title?: ReactNode; message?: string; action?: ReactNode }

export type ListPageProps = Omit<AppPageProps, 'children'> & {
  toolbar?: ReactNode
  pagination?: ReactNode
  state?: ListPageState
  children: ReactNode
}

function ListContent({ state, children }: { state: ListPageState; children: ReactNode }) {
  if (state.type === 'loading') {
    return <TablePageLoadingState label={state.label} />
  }

  if (state.type === 'empty') {
    return <TrueEmptyState title={state.title} description={state.description} action={state.action} />
  }

  if (state.type === 'filtered-empty') {
    return <FilteredEmptyPageState action={state.action} />
  }

  if (state.type === 'error') {
    return <SafePageErrorState title={state.title} message={state.message} action={state.action} />
  }

  return <>{children}</>
}

export function ListPage({
  toolbar,
  pagination,
  state = { type: 'ready' },
  children,
  ...appPageProps
}: ListPageProps) {
  return (
    <AppPage {...appPageProps}>
      {toolbar ? (
        <section aria-label="List filters and actions" className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
          {toolbar}
        </section>
      ) : null}
      <section aria-label="List content">
        <ListContent state={state}>{children}</ListContent>
      </section>
      {pagination && state.type === 'ready' ? <nav aria-label="Pagination">{pagination}</nav> : null}
    </AppPage>
  )
}
