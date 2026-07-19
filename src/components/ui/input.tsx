import { forwardRef, type InputHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'h-9 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-foreground)] shadow-none transition-colors placeholder:text-[var(--color-subtle)] hover:border-[var(--color-border-strong)] disabled:cursor-not-allowed disabled:bg-[var(--color-surface-muted)] disabled:text-[var(--color-subtle)] aria-invalid:border-[var(--color-destructive)]',
          className,
        )}
        {...props}
      />
    )
  },
)
Input.displayName = 'Input'
