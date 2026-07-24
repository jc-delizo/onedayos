import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type PageHeaderMode = 'compact' | 'explanatory'

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  mode = 'explanatory',
  className,
}: {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  mode?: PageHeaderMode
  className?: string
}) {
  return (
    <header
      data-page-header-mode={mode}
      className={cn(
        'flex flex-col sm:flex-row sm:justify-between',
        mode === 'compact'
          ? 'gap-2 sm:items-center'
          : 'gap-4 border-b border-[var(--color-border)] pb-6 sm:items-end',
        className,
      )}
    >
      <div className={cn('min-w-0', mode === 'compact' ? 'space-y-1' : 'space-y-2')}>
        {eyebrow ? <p className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-brand)]">{eyebrow}</p> : null}
        <h1 className={cn('font-semibold tracking-normal text-[var(--color-foreground)]', mode === 'compact' ? 'text-xl' : 'text-2xl')}>{title}</h1>
        {description ? <p className="max-w-2xl text-sm leading-6 text-[var(--color-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
    </header>
  )
}

export function SectionHeader({
  title,
  description,
  actions,
}: {
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div className="space-y-1">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
        {description ? <p className="text-sm text-[var(--color-muted)]">{description}</p> : null}
      </div>
      {actions ? <div className="flex items-center gap-2">{actions}</div> : null}
    </div>
  )
}
