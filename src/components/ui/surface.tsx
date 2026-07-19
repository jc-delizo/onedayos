import type { HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

export function Surface({ className, children, ...props }: HTMLAttributes<HTMLElement> & { children: ReactNode }) {
  return (
    <section
      className={cn(
        'rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]',
        className,
      )}
      {...props}
    >
      {children}
    </section>
  )
}

export function Panel({ className, children, ...props }: HTMLAttributes<HTMLDivElement> & { children: ReactNode }) {
  return (
    <div
      className={cn('rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]', className)}
      {...props}
    >
      {children}
    </div>
  )
}
