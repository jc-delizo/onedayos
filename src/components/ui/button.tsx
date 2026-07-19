import Link from 'next/link'
import { forwardRef, type ButtonHTMLAttributes, type ComponentProps, type ReactNode } from 'react'
import { cn } from '@/lib/cn'

type ButtonVariant = 'primary' | 'default' | 'secondary' | 'outline' | 'ghost' | 'quiet' | 'destructive' | 'danger' | 'link'
type ButtonSize = 'sm' | 'default' | 'md' | 'lg' | 'icon'

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    'border-transparent bg-[var(--color-primary)] text-[color:var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]',
  default:
    'border-transparent bg-[var(--color-primary)] text-[color:var(--color-primary-foreground)] hover:bg-[var(--color-primary-hover)]',
  secondary:
    'border-transparent bg-[var(--color-accent)] text-[color:var(--color-accent-foreground)] hover:bg-[var(--color-surface-muted)]',
  outline:
    'border-[var(--color-border)] bg-[var(--color-surface)] text-[color:var(--color-foreground)] hover:bg-[var(--color-surface-muted)]',
  ghost:
    'border-transparent bg-transparent text-[color:var(--color-muted-foreground)] hover:bg-[var(--color-surface-muted)] hover:text-[color:var(--color-foreground)]',
  quiet:
    'border-transparent bg-transparent text-[color:var(--color-muted-foreground)] hover:bg-[var(--color-surface-muted)] hover:text-[color:var(--color-foreground)]',
  destructive:
    'border-[var(--color-destructive)] bg-[var(--color-destructive-soft)] text-[color:var(--color-destructive)] hover:border-[var(--color-destructive)]',
  danger:
    'border-[var(--color-destructive)] bg-[var(--color-destructive-soft)] text-[color:var(--color-destructive)] hover:border-[var(--color-destructive)]',
  link:
    'border-transparent bg-transparent px-0 text-[color:var(--color-primary)] underline-offset-4 hover:underline',
}

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'h-8 px-3 text-xs',
  default: 'h-9 px-3.5 text-sm',
  md: 'h-9 px-3.5 text-sm',
  lg: 'h-10 px-4 text-sm',
  icon: 'size-9 p-0 text-sm',
}

type BaseButtonProps = {
  variant?: ButtonVariant
  size?: ButtonSize
}

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & BaseButtonProps>(
  ({ className, variant = 'default', size = 'default', type = 'button', children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        type={type}
        className={cn(
          'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border font-medium transition-colors disabled:pointer-events-none disabled:opacity-55',
          sizeClasses[size],
          variantClasses[variant],
          className,
        )}
        {...props}
      >
        {children}
      </button>
    )
  },
)
Button.displayName = 'Button'

export function LinkButton({
  className,
  variant = 'default',
  size = 'default',
  href,
  children,
  ...props
}: Omit<ComponentProps<typeof Link>, 'className' | 'href'> &
  BaseButtonProps & { className?: string; href: string; children: ReactNode }) {
  return (
    <Link
      href={href as never}
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] border font-medium transition-colors',
        sizeClasses[size],
        variantClasses[variant],
        className,
      )}
      {...props}
    >
      {children}
    </Link>
  )
}
