'use client'

export function formatChartValue(value: number | string, unit: string): string {
  const numeric = typeof value === 'number' ? value : Number(value)
  if (!Number.isFinite(numeric)) return `0 ${unit}`
  return `${new Intl.NumberFormat('en-US', { maximumFractionDigits: 4 }).format(numeric)} ${unit}`
}
type TooltipEntry = {
  name?: string
  value?: number | string
  color?: string
}

export function ChartTooltip({
  active,
  label,
  payload,
  unit,
}: {
  active?: boolean
  label?: string | number
  payload?: readonly TooltipEntry[]
  unit: string
}) {
  if (!active || !payload?.length) return null

  return (
    <div className="min-w-36 rounded-[var(--radius-sm)] border border-[var(--color-border-strong)] bg-[var(--color-popover-background)] p-3 text-xs text-[var(--color-popover-foreground)] shadow-[var(--shadow-floating)]">
      {label !== undefined ? <p className="mb-2 font-semibold">{label}</p> : null}
      <ul className="space-y-1">
        {payload.map((entry, index) => (
          <li key={`${entry.name ?? 'value'}-${index}`} className="flex items-center justify-between gap-4">
            <span>{entry.name ?? 'Value'}</span>
            <span className="font-medium">{formatChartValue(entry.value ?? 0, unit)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}
