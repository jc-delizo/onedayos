import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

type StatusVariant = 'neutral' | 'success' | 'warning' | 'danger' | 'destructive' | 'info' | 'information' | 'brand'

const variantClasses: Record<StatusVariant, string> = {
  neutral: 'border-[var(--color-border)] bg-[var(--color-neutral-soft)] text-[var(--color-neutral)]',
  success: 'border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]',
  warning: 'border-[var(--color-warning)] bg-[var(--color-warning-soft)] text-[var(--color-warning)]',
  danger: 'border-[var(--color-destructive)] bg-[var(--color-destructive-soft)] text-[var(--color-destructive)]',
  destructive: 'border-[var(--color-destructive)] bg-[var(--color-destructive-soft)] text-[var(--color-destructive)]',
  info: 'border-[var(--color-information)] bg-[var(--color-information-soft)] text-[var(--color-information)]',
  information: 'border-[var(--color-information)] bg-[var(--color-information-soft)] text-[var(--color-information)]',
  brand: 'border-[var(--color-brand)] bg-[var(--color-brand-soft)] text-[var(--color-brand)]',
}

export function StatusBadge({
  variant = 'neutral',
  children,
}: {
  variant?: StatusVariant
  children: ReactNode
}) {
  return (
    <span
      data-variant={variant}
      className={cn(
        'inline-flex h-6 items-center rounded-full border px-2 text-xs font-medium leading-none',
        variantClasses[variant],
      )}
    >
      {children}
    </span>
  )
}
