import type { ReactNode } from 'react'
import { EmptyState } from './states'
import { TableSkeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'

export type DataTableColumn<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  className?: string
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  rowActions,
  loading = false,
  emptyState,
  className,
}: {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowId: (row: T) => string
  rowActions?: (row: T) => ReactNode
  loading?: boolean
  emptyState?: ReactNode
  className?: string
}) {
  if (loading) {
    return (
      <div className={cn('rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]', className)}>
        <TableSkeleton rows={5} columns={columns.length + (rowActions ? 1 : 0)} />
      </div>
    )
  }

  if (rows.length === 0) {
    return <>{emptyState ?? <EmptyState title="No records yet" description="Records will appear here when they are available." />}</>
  }

  return (
    <div className={cn('overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]', className)}>
      <table className="w-full border-collapse text-left text-sm">
        <thead className="bg-[var(--color-surface-raised)] text-xs font-medium text-[var(--color-muted)]">
          <tr>
            {columns.map((column) => (
              <th key={column.id} scope="col" className={cn('border-b border-[var(--color-border)] px-3 py-2', column.className)}>
                {column.header}
              </th>
            ))}
            {rowActions ? <th scope="col" className="border-b border-[var(--color-border)] px-3 py-2 text-right">Actions</th> : null}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={getRowId(row)} className="transition-colors hover:bg-[var(--color-bg-subtle)]">
              {columns.map((column) => (
                <td key={column.id} className={cn('border-b border-[var(--color-border)] px-3 py-2 align-middle text-[var(--color-foreground)]', column.className)}>
                  {column.cell(row)}
                </td>
              ))}
              {rowActions ? (
                <td className="border-b border-[var(--color-border)] px-3 py-2 text-right align-middle">{rowActions(row)}</td>
              ) : null}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
