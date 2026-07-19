import { cn } from '@/lib/cn'

export function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="inline-flex items-center gap-2" aria-label="OneDayOS">
      <span
        aria-hidden="true"
        className={cn(
          'grid place-items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] text-xs font-semibold text-[var(--color-brand)] shadow-[var(--shadow-panel)]',
          compact ? 'size-7' : 'size-8',
        )}
      >
        1D
      </span>
      {compact ? null : <span className="text-sm font-semibold tracking-normal text-[var(--color-foreground)]">OneDayOS</span>}
    </div>
  )
}
