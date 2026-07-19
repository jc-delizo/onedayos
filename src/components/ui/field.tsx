import type { HTMLAttributes, LabelHTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Field({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={cn('space-y-1.5', className)}>{children}</div>
}

export function Label({
  className,
  required,
  children,
  ...props
}: LabelHTMLAttributes<HTMLLabelElement> & { required?: boolean }) {
  return (
    <label className={cn('block text-sm font-medium text-[var(--color-foreground)]', className)} {...props}>
      {children}
      {required ? <span className="ml-1 text-[var(--color-brand)]" aria-label="required">*</span> : null}
    </label>
  )
}

export function FieldDescription({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={cn('text-xs leading-5 text-[var(--color-muted)]', className)} {...props}>
      {children}
    </p>
  )
}

export function FieldError({ className, children, ...props }: HTMLAttributes<HTMLParagraphElement>) {
  if (!children) return null

  return (
    <p className={cn('text-xs leading-5 text-[var(--color-destructive)]', className)} role="alert" {...props}>
      {children}
    </p>
  )
}

export function FormMessage({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'danger' | 'success' }) {
  if (!children) return null

  const classes = {
    neutral: 'border-[var(--color-border)] bg-[var(--color-surface-raised)] text-[var(--color-muted)]',
    danger: 'border-[var(--color-destructive)] bg-[var(--color-destructive-soft)] text-[var(--color-destructive)]',
    success: 'border-[var(--color-success)] bg-[var(--color-success-soft)] text-[var(--color-success)]',
  }

  return <p className={cn('rounded-[var(--radius-sm)] border px-3 py-2 text-sm', classes[tone])}>{children}</p>
}
