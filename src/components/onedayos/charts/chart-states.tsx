import { Skeleton } from '@/components/ui/skeleton'

export function ChartEmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div role="status" className="grid h-64 place-items-center rounded-[var(--radius-sm)] border border-dashed border-[var(--color-border)] bg-[var(--color-surface-muted)] p-6 text-center">
      <div className="max-w-sm space-y-1">
        <p className="text-sm font-medium text-[var(--color-foreground)]">{title}</p>
        <p className="text-xs leading-5 text-[var(--color-muted)]">{description}</p>
      </div>
    </div>
  )
}

export function ChartLoadingState({ label = 'Loading chart' }: { label?: string }) {
  return (
    <div role="status" aria-label={label} className="space-y-4">
      <Skeleton className="h-4 w-32" />
      <Skeleton className="h-3 w-3/4" />
      <div className="flex h-52 items-end gap-3">
        {['h-20', 'h-32', 'h-16', 'h-40', 'h-28', 'h-36'].map((heightClass, index) => (
          <Skeleton key={`${heightClass}-${index}`} className={`flex-1 ${heightClass}`} />
        ))}
      </div>
    </div>
  )
}

export function ChartErrorState({ message = 'Chart data is temporarily unavailable.' }: { message?: string }) {
  return (
    <div role="alert" className="grid h-64 place-items-center rounded-[var(--radius-sm)] border border-[var(--color-destructive)] bg-[var(--color-destructive-soft)] p-6 text-center text-sm text-[var(--color-destructive)]">
      {message}
    </div>
  )
}
