import type { ChartDataColumn } from './types'

export function ChartDataTable<T>({
  label,
  rows,
  columns,
  getRowKey,
  defaultOpen = false,
}: {
  label: string
  rows: readonly T[]
  columns: readonly ChartDataColumn<T>[]
  getRowKey: (row: T) => string
  defaultOpen?: boolean
}) {
  return (
    <details open={defaultOpen} className="group border-t border-[var(--color-border)] pt-3">
      <summary className="cursor-pointer text-xs font-medium text-[var(--color-muted-foreground)]">
        Accessible data summary
      </summary>
      <div className="mt-3 overflow-x-auto">
        <table className="w-full border-collapse text-left text-xs">
          <caption className="sr-only">{label}</caption>
          <thead>
            <tr className="border-b border-[var(--color-border)] text-[var(--color-muted)]">
              {columns.map((column) => (
                <th key={column.id} scope="col" className="px-2 py-2 font-medium">{column.header}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={getRowKey(row)} className="border-b border-[var(--color-border)] last:border-0">
                {columns.map((column) => (
                  <td key={column.id} className="px-2 py-2 text-[var(--color-foreground)]">{column.cell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </details>
  )
}
