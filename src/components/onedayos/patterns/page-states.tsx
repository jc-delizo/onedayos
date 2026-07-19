import type { ReactNode } from 'react'
import {
  DashboardPageSkeleton,
  FormPageSkeleton,
  ProcessFlowPageSkeleton,
  TablePageSkeleton,
} from '@/components/onedayos/loading-skeletons'
import {
  EmptyState,
  ErrorState,
  FilteredEmptyState,
  ModuleUnavailableState,
  PermissionDeniedState,
} from '@/components/onedayos/states'
import { LoadingState } from '@/components/ui/skeleton'

export function PageLoadingState({ label = 'Loading page content' }: { label?: string }) {
  return <LoadingState label={label} />
}

export function TablePageLoadingState({ label = 'Loading table page' }: { label?: string }) {
  return <TablePageSkeleton label={label} />
}

export function FormPageLoadingState() {
  return <FormPageSkeleton />
}

export function DashboardPageLoadingState() {
  return <DashboardPageSkeleton />
}

export function ProcessFlowLoadingState() {
  return <ProcessFlowPageSkeleton />
}

export function TrueEmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return <EmptyState title={title} description={description} action={action} />
}

export function FilteredEmptyPageState({ action }: { action?: ReactNode }) {
  return <FilteredEmptyState action={action} />
}

export function SafePageErrorState({
  title = 'Unable to load this page',
  message,
  action,
}: {
  title?: ReactNode
  message?: string
  action?: ReactNode
}) {
  return <ErrorState title={title} message={message} action={action} />
}

export function PermissionDeniedPageState() {
  return <PermissionDeniedState />
}

export function ModuleUnavailablePageState({ moduleName }: { moduleName?: string }) {
  return <ModuleUnavailableState moduleName={moduleName} />
}
