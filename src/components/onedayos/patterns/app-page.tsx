import Link from 'next/link'
import type { ReactNode } from 'react'
import { PageHeader, type PageHeaderMode } from '@/components/onedayos/page-header'
import { cn } from '@/lib/cn'

export type PageBreadcrumbItem = {
  label: ReactNode
  href?: string
}

export type AppPageContentWidth = 'narrow' | 'default' | 'wide'

export type AppPageProps = {
  breadcrumb?: ReactNode | readonly PageBreadcrumbItem[]
  title: ReactNode
  description?: ReactNode
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
  contextualHelp?: ReactNode
  headerMode?: PageHeaderMode
  contentWidth?: AppPageContentWidth
  className?: string
  children: ReactNode
}

const widthClasses: Record<AppPageContentWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-none',
}

function isBreadcrumbItems(breadcrumb: AppPageProps['breadcrumb']): breadcrumb is readonly PageBreadcrumbItem[] {
  return Array.isArray(breadcrumb)
}

function Breadcrumb({ breadcrumb }: { breadcrumb: NonNullable<AppPageProps['breadcrumb']> }) {
  if (!isBreadcrumbItems(breadcrumb)) {
    return (
      <nav aria-label="Breadcrumb" className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-brand)]">
        <span aria-current="page">{breadcrumb}</span>
      </nav>
    )
  }

  return (
    <nav aria-label="Breadcrumb" className="text-xs font-medium uppercase tracking-[0.14em] text-[var(--color-muted)]">
      <ol className="flex flex-wrap items-center gap-1">
        {breadcrumb.map((item, index) => {
          const isLast = index === breadcrumb.length - 1

          return (
            <li key={index} className="flex items-center gap-1">
              {item.href && !isLast ? (
                <Link href={item.href as never} className="text-[var(--color-muted)] hover:text-[var(--color-foreground)]">
                  {item.label}
                </Link>
              ) : (
                <span className={cn(isLast ? 'text-[var(--color-brand)]' : 'text-[var(--color-muted)]')} aria-current={isLast ? 'page' : undefined}>
                  {item.label}
                </span>
              )}
              {!isLast ? <span aria-hidden="true" className="text-[var(--color-subtle)]">/</span> : null}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}

function HeaderActions({
  primaryAction,
  secondaryActions,
}: {
  primaryAction?: ReactNode
  secondaryActions?: ReactNode
}) {
  if (!primaryAction && !secondaryActions) return null

  return (
    <>
      {secondaryActions}
      {primaryAction}
    </>
  )
}

export function AppPage({
  breadcrumb,
  title,
  description,
  primaryAction,
  secondaryActions,
  contextualHelp,
  headerMode = 'explanatory',
  contentWidth = 'default',
  className,
  children,
}: AppPageProps) {
  const actions = primaryAction || secondaryActions ? (
    <HeaderActions primaryAction={primaryAction} secondaryActions={secondaryActions} />
  ) : undefined

  return (
    <div className={cn('mx-auto w-full space-y-6', widthClasses[contentWidth], className)}>
      <div className={headerMode === 'compact' ? 'space-y-1.5' : 'space-y-3'}>
        {breadcrumb ? <Breadcrumb breadcrumb={breadcrumb} /> : null}
        <PageHeader
          title={title}
          description={description}
          actions={actions}
          mode={headerMode}
          className={breadcrumb ? 'pt-0' : undefined}
        />
      </div>
      {contextualHelp ? (
        <aside className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] px-4 py-3 text-sm leading-6 text-[var(--color-muted)]">
          {contextualHelp}
        </aside>
      ) : null}
      <div className="space-y-6">{children}</div>
    </div>
  )
}
