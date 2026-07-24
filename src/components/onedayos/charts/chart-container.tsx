import type { ReactNode } from 'react'
import { Surface } from '@/components/ui/surface'
import type { ChartLegendItem } from './types'

export function ChartLegend({ items }: { items: readonly ChartLegendItem[] }) {
  return (
    <ul aria-label="Chart legend" className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-[var(--color-muted)]">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2">
          <span
            aria-hidden="true"
            className="size-2.5 shrink-0 rounded-[2px] border border-[var(--color-border-strong)]"
            style={{
              backgroundColor: item.marker === 'dashed' ? 'transparent' : item.color,
              backgroundImage: item.marker === 'striped'
                ? `repeating-linear-gradient(135deg, transparent 0 2px, ${item.color} 2px 4px)`
                : undefined,
              borderColor: item.marker === 'dashed' ? item.color : undefined,
              borderStyle: item.marker === 'dashed' ? 'dashed' : undefined,
            }}
          />
          <span>{item.label}</span>
        </li>
      ))}
    </ul>
  )
}

export function ChartContainer({
  id,
  title,
  description,
  legend,
  children,
  dataSummary,
}: {
  id: string
  title: string
  description: string
  legend?: readonly ChartLegendItem[]
  children: ReactNode
  dataSummary: ReactNode
}) {
  const titleId = `${id}-title`
  const descriptionId = `${id}-description`

  return (
    <Surface
      aria-labelledby={titleId}
      aria-describedby={descriptionId}
      className="min-w-0 space-y-4 p-4"
      data-chart-container={id}
    >
      <header className="space-y-1">
        <h2 id={titleId} className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
        <p id={descriptionId} className="text-sm leading-5 text-[var(--color-muted)]">{description}</p>
      </header>
      {legend?.length ? <ChartLegend items={legend} /> : null}
      <div aria-hidden="true" className="h-64 min-w-0" data-chart-graphic>
        {children}
      </div>
      {dataSummary}
    </Surface>
  )
}
