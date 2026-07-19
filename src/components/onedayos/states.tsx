import type { ReactNode } from 'react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/cn'

function StateShell({
  tone = 'neutral',
  title,
  description,
  action,
}: {
  tone?: 'neutral' | 'danger' | 'warning' | 'info'
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  const dotClass = {
    neutral: 'bg-[var(--color-neutral)]',
    danger: 'bg-[var(--color-danger)]',
    warning: 'bg-[var(--color-warning)]',
    info: 'bg-[var(--color-info)]',
  }[tone]

  return (
    <div className="flex min-h-36 flex-col items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-raised)] p-6 text-center">
      <span className={cn('mb-3 size-2 rounded-full', dotClass)} aria-hidden="true" />
      <h3 className="text-sm font-semibold text-[var(--color-foreground)]">{title}</h3>
      {description ? <p className="mt-1 max-w-md text-sm leading-6 text-[var(--color-muted)]">{description}</p> : null}
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  )
}

export function EmptyState({
  title,
  description,
  action,
}: {
  title: ReactNode
  description?: ReactNode
  action?: ReactNode
}) {
  return <StateShell title={title} description={description} action={action} />
}

export function FilteredEmptyState({ action }: { action?: ReactNode }) {
  return (
    <StateShell
      title="No matching records"
      description="Adjust the current filters or clear them to see available records."
      action={action}
    />
  )
}

function safeErrorMessage(message?: string) {
  if (!message) return 'Something went wrong while loading this area. Try again or contact support if it continues.'

  const technicalPatterns = [/Prisma/i, /SQL/i, /stack/i, /TypeError/i, /Supabase/i, /NEXT_/i]

  if (technicalPatterns.some((pattern) => pattern.test(message))) {
    return 'Something went wrong while loading this area. Try again or contact support if it continues.'
  }

  return message
}

export function ErrorState({
  title = 'Unable to load this area',
  message,
  action,
}: {
  title?: ReactNode
  message?: string
  action?: ReactNode
}) {
  return <StateShell tone="danger" title={title} description={safeErrorMessage(message)} action={action} />
}

export function PermissionDeniedState() {
  return (
    <StateShell
      tone="warning"
      title="Permission required"
      description="You do not have permission to view or change this area. Ask your OneDayOS administrator if you need access."
    />
  )
}

export function ModuleUnavailableState({ moduleName = 'This module' }: { moduleName?: string }) {
  return (
    <StateShell
      tone="info"
      title={`${moduleName} is unavailable`}
      description="This area is not enabled for the current organization."
      action={<Button variant="secondary">Back to foundation</Button>}
    />
  )
}
