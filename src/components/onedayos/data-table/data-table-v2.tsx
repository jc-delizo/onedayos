'use client'

import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type PaginationState,
  type RowSelectionState,
  type SortingState,
  type VisibilityState,
} from '@tanstack/react-table'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { TableSkeleton } from '@/components/ui/skeleton'
import { cn } from '@/lib/cn'
import { EmptyState } from '../states'
import { useTableQueryState } from './use-table-query-state'
import type {
  DataTableFilter,
  DataTableExportOptions,
  DataTableMode,
  DataTablePageMeta,
  DataTableQueryState,
  DataTableRowInteraction,
  DataTableV2Column,
} from './types'

const PAGE_SIZES = [10, 25, 50] as const
const EMPTY_FILTERS: DataTableFilter[] = []

export function DataTableV2<T>({
  tableId,
  mode,
  columns,
  rows,
  getRowId,
  query,
  pageMeta,
  filters = EMPTY_FILTERS,
  rowInteraction,
  rowActions,
  loading = false,
  error,
  emptyState,
  filteredEmptyState,
  enableSelection = true,
  exportOptions,
  className,
}: {
  tableId: string
  mode: DataTableMode
  columns: DataTableV2Column<T>[]
  rows: T[]
  getRowId: (row: T) => string
  query?: DataTableQueryState
  pageMeta?: DataTablePageMeta
  filters?: DataTableFilter[]
  rowInteraction?: DataTableRowInteraction<T>
  rowActions?: (row: T) => ReactNode
  loading?: boolean
  error?: string
  emptyState?: ReactNode
  filteredEmptyState?: ReactNode
  enableSelection?: boolean
  exportOptions?: DataTableExportOptions
  className?: string
}) {
  const router = useRouter()
  const { updateTableQuery } = useTableQueryState()
  const [search, setSearch] = useState(query?.q ?? '')
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({})
  const [sorting, setSorting] = useState<SortingState>(
    query?.sort ? [{ id: query.sort, desc: query.direction === 'desc' }] : [],
  )
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: Math.max(0, (query?.page ?? 1) - 1),
    pageSize: Math.min(100, query?.pageSize ?? 25),
  })
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>({})
  const [filterValues, setFilterValues] = useState<Record<string, string>>(
    Object.fromEntries(filters.map((filter) => [filter.id, filter.value ?? ''])),
  )
  const [exporting, setExporting] = useState(false)
  const [exportMessage, setExportMessage] = useState('')
  const preferenceKey = `onedayos.table.${tableId}.columns`

  useEffect(() => {
    setSearch(query?.q ?? '')
    setSorting(query?.sort ? [{ id: query.sort, desc: query.direction === 'desc' }] : [])
    setPagination({
      pageIndex: Math.max(0, (query?.page ?? 1) - 1),
      pageSize: Math.min(100, query?.pageSize ?? 25),
    })
  }, [query?.direction, query?.page, query?.pageSize, query?.q, query?.sort])

  useEffect(() => {
    setFilterValues(Object.fromEntries(filters.map((filter) => [filter.id, filter.value ?? ''])))
  }, [filters])

  useEffect(() => {
    try {
      const stored = localStorage.getItem(preferenceKey)
      if (stored) setColumnVisibility(JSON.parse(stored) as VisibilityState)
    } catch {
      // Storage is an optional progressive enhancement.
    }
  }, [preferenceKey])

  const tableColumns = useMemo<ColumnDef<T>[]>(() => {
    const result: ColumnDef<T>[] = columns.map((column) => ({
      id: column.id,
      accessorFn: column.accessor ?? ((row) => column.cell(row)),
      header: () => column.header,
      cell: ({ row }) => column.cell(row.original),
      enableSorting: column.sortable ?? false,
      enableHiding: (column.hideable ?? true) && !column.required,
      meta: { className: column.className },
    }))
    return result
  }, [columns])

  // TanStack Table intentionally returns a mutable table instance; React Compiler skips this component.
  // eslint-disable-next-line react-hooks/incompatible-library
  const table = useReactTable({
    data: rows,
    columns: tableColumns,
    getRowId,
    state: { sorting, pagination, rowSelection, columnVisibility, globalFilter: search },
    manualSorting: mode === 'server',
    manualFiltering: mode === 'server',
    manualPagination: mode === 'server',
    pageCount: mode === 'server' ? Math.max(1, pageMeta?.totalPages ?? 1) : undefined,
    enableRowSelection: enableSelection,
    onRowSelectionChange: setRowSelection,
    onColumnVisibilityChange: (updater) => {
      setColumnVisibility((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater
        try {
          localStorage.setItem(preferenceKey, JSON.stringify(next))
        } catch {
          // Keep the in-memory preference when storage is unavailable.
        }
        return next
      })
    },
    onSortingChange: (updater) => {
      setSorting((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater
        const first = next[0]
        if (mode === 'server') {
          updateTableQuery({
            page: 1,
            sort: first?.id,
            direction: first ? (first.desc ? 'desc' : 'asc') : undefined,
          })
        }
        return next
      })
    },
    onPaginationChange: (updater) => {
      setPagination((current) => {
        const next = typeof updater === 'function' ? updater(current) : updater
        if (mode === 'server') {
          updateTableQuery({ page: next.pageIndex + 1, pageSize: next.pageSize })
        }
        return next
      })
    },
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  })

  function submitSearch(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (mode === 'server') updateTableQuery({ q: search.trim() || undefined, page: 1 }, true)
    else table.setGlobalFilter(search.trim())
  }

  const hasQuery = Boolean(query?.q || Object.values(filterValues).some(Boolean))
  const visibleRows = table.getRowModel().rows
  const selectedCount = Object.keys(rowSelection).length
  const total = mode === 'server' ? (pageMeta?.total ?? rows.length) : table.getFilteredRowModel().rows.length
  const totalPages = mode === 'server'
    ? Math.max(1, pageMeta?.totalPages ?? 1)
    : Math.max(1, table.getPageCount())
  const currentPage = mode === 'server' ? (pageMeta?.page ?? pagination.pageIndex + 1) : pagination.pageIndex + 1

  async function downloadExport(format: 'csv' | 'xlsx', scope: 'selected' | 'filtered') {
    if (!exportOptions || exporting) return
    setExporting(true)
    setExportMessage('Preparing export…')

    try {
      const {
        page: _page,
        pageSize: _pageSize,
        filters: queryFilters,
        ...queryValues
      } = query ?? { page: 1, pageSize: 25 }
      const safeQuery = Object.fromEntries(
        Object.entries({ ...queryValues, ...queryFilters }).filter(([, value]) => value !== undefined && value !== ''),
      )
      const response = await fetch(exportOptions.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          format,
          scope,
          ...(scope === 'selected' ? { selectedIds: Object.keys(rowSelection) } : {}),
          columns: table.getVisibleLeafColumns().map((column) => column.id),
          query: safeQuery,
        }),
      })

      if (!response.ok) {
        const payload = await response.json().catch(() => null) as {
          error?: { code?: string; message?: string }
        } | null
        throw new Error(payload?.error?.message || 'The export could not be prepared. Try again.')
      }

      const blob = await response.blob()
      const disposition = response.headers.get('content-disposition') ?? ''
      const filename = disposition.match(/filename="([^"]+)"/i)?.[1]
        ?? `onedayos-export.${format}`
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = filename
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      URL.revokeObjectURL(url)
      setExportMessage(`${filename} is ready.`)
    } catch (error) {
      setExportMessage(error instanceof Error ? error.message : 'The export could not be prepared. Try again.')
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return (
      <div data-data-table-v2={tableId} className={cn('rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]', className)}>
        <TableSkeleton rows={5} columns={columns.length + 2} />
      </div>
    )
  }

  if (error) {
    return (
      <div data-data-table-v2={tableId}>
        <EmptyState title="Unable to load records" description={error} />
      </div>
    )
  }

  return (
    <section data-data-table-v2={tableId} aria-label={`${tableId} data table`} className={cn('space-y-3', className)}>
      <div className="flex flex-wrap items-end gap-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface-raised)] p-3">
        <form className="flex min-w-64 flex-1 items-end gap-2" onSubmit={submitSearch}>
          <label className="flex-1 text-xs font-medium text-[var(--color-muted)]">
            Search
            <Input
              aria-label={`Search ${tableId}`}
              className="mt-1"
              value={search}
              onChange={(event) => setSearch(event.target.value.slice(0, 120))}
              placeholder="Search records"
            />
          </label>
          <Button size="sm" variant="secondary" type="submit">Search</Button>
          {search || query?.q ? (
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                setSearch('')
                table.setGlobalFilter('')
                if (mode === 'server') updateTableQuery({ q: undefined, page: 1 }, true)
              }}
            >
              Clear
            </Button>
          ) : null}
        </form>

        {filters.map((filter) => (
          <label key={filter.id} className="text-xs font-medium text-[var(--color-muted)]">
            {filter.label}
            <select
              aria-label={filter.label}
              className="mt-1 block h-9 min-w-36 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2 text-sm text-[var(--color-foreground)]"
              value={filterValues[filter.id] ?? ''}
              onChange={(event) => {
                const value = event.target.value
                setFilterValues((current) => ({ ...current, [filter.id]: value }))
                if (mode === 'client') table.getColumn(filter.id)?.setFilterValue(value || undefined)
                else updateTableQuery({ page: 1, filters: { [filter.id]: value || undefined } }, true)
              }}
            >
              <option value="">All</option>
              {filter.options.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
        ))}

        {Object.values(filterValues).some(Boolean) ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              setFilterValues(Object.fromEntries(filters.map((filter) => [filter.id, ''])))
              if (mode === 'client') table.resetColumnFilters()
              else updateTableQuery({
                page: 1,
                filters: Object.fromEntries(filters.map((filter) => [filter.id, undefined])),
              }, true)
            }}
          >
            Clear filters
          </Button>
        ) : null}

        <details className="relative">
          <summary className="flex h-8 cursor-pointer list-none items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-xs font-medium">
            Columns
          </summary>
          <div className="absolute right-0 z-20 mt-1 min-w-48 space-y-1 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-2 shadow-lg">
            {table.getAllLeafColumns().map((column) => (
              <label key={column.id} className="flex items-center gap-2 p-1 text-sm">
                <input
                  type="checkbox"
                  checked={column.getIsVisible()}
                  disabled={!column.getCanHide()}
                  onChange={column.getToggleVisibilityHandler()}
                />
                {String(columns.find((candidate) => candidate.id === column.id)?.header ?? column.id)}
              </label>
            ))}
          </div>
        </details>

        {exportOptions ? (
          <details className="relative">
            <summary
              aria-label={`Export ${exportOptions.resourceLabel}`}
              className="flex h-8 cursor-pointer list-none items-center rounded-[var(--radius-sm)] border border-[var(--color-border)] px-3 text-xs font-medium"
            >
              {exporting ? 'Preparing export…' : 'Export'}
            </summary>
            <div className="absolute right-0 z-20 mt-1 min-w-64 space-y-2 rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-popover-background)] p-2 text-[var(--color-popover-foreground)] shadow-lg">
              {(exportOptions.formats ?? ['csv', 'xlsx']).map((format) => (
                <div key={format} className="space-y-1">
                  <p className="px-2 text-xs font-semibold">{format === 'csv' ? 'Export CSV' : 'Export Excel'}</p>
                  {selectedCount > 0 ? (
                    <Button
                      aria-label={`${format === 'csv' ? 'CSV' : 'Excel'} selected rows (${selectedCount})`}
                      className="w-full justify-start"
                      size="sm"
                      variant="ghost"
                      disabled={exporting}
                      onClick={() => void downloadExport(format, 'selected')}
                    >
                      Selected rows ({selectedCount})
                    </Button>
                  ) : null}
                  <Button
                    aria-label={`${format === 'csv' ? 'CSV' : 'Excel'} all filtered rows (${exportOptions.totalFilteredRows})`}
                    className="w-full justify-start"
                    size="sm"
                    variant="ghost"
                    disabled={exporting || exportOptions.totalFilteredRows === 0}
                    onClick={() => void downloadExport(format, 'filtered')}
                  >
                    All filtered rows ({exportOptions.totalFilteredRows})
                  </Button>
                </div>
              ))}
            </div>
          </details>
        ) : null}
      </div>

      {exportOptions ? (
        <p
          className={exportMessage ? 'text-sm text-[var(--color-muted)]' : 'sr-only'}
          role="status"
          aria-live="polite"
        >
          {exportMessage}
        </p>
      ) : null}

      {selectedCount > 0 ? (
        <p role="status" className="text-sm text-[var(--color-muted)]">{selectedCount} selected on this page</p>
      ) : null}

      {rows.length === 0 ? (
        hasQuery
          ? <>{filteredEmptyState ?? <EmptyState title="No matching records" description="Clear or change the current search and filters." />}</>
          : <>{emptyState ?? <EmptyState title="No records yet" description="Records will appear here when available." />}</>
      ) : (
        <div className="overflow-x-auto rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)]">
          <table className="min-w-full border-collapse text-left text-sm">
            <thead className="bg-[var(--color-surface-raised)] text-xs font-medium text-[var(--color-muted)]">
              <tr>
                {enableSelection ? (
                  <th scope="col" className="w-10 border-b border-[var(--color-border)] px-3 py-2">
                    <input
                      aria-label="Select all rows on this page"
                      type="checkbox"
                      checked={table.getIsAllPageRowsSelected()}
                      onChange={table.getToggleAllPageRowsSelectedHandler()}
                    />
                  </th>
                ) : null}
                {table.getHeaderGroups()[0]?.headers.map((header) => (
                  <th key={header.id} scope="col" className="border-b border-[var(--color-border)] px-3 py-2">
                    {header.column.getCanSort() ? (
                      <button
                        type="button"
                        className="rounded-sm font-medium focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--color-focus)]"
                        aria-label={`Sort by ${String(columns.find((column) => column.id === header.column.id)?.header ?? header.column.id)}`}
                        onClick={header.column.getToggleSortingHandler()}
                      >
                        {flexRender(header.column.columnDef.header, header.getContext())}
                        {header.column.getIsSorted() === 'asc' ? ' (ascending)' : null}
                        {header.column.getIsSorted() === 'desc' ? ' (descending)' : null}
                      </button>
                    ) : flexRender(header.column.columnDef.header, header.getContext())}
                  </th>
                ))}
                {rowActions ? <th scope="col" className="border-b border-[var(--color-border)] px-3 py-2 text-right">Actions</th> : null}
              </tr>
            </thead>
            <tbody>
              {visibleRows.map((row) => {
                const interaction = rowInteraction
                  ? { href: rowInteraction.href(row.original), label: rowInteraction.label(row.original) }
                  : null
                return (
                  <tr
                    key={row.id}
                    tabIndex={interaction ? 0 : undefined}
                    aria-label={interaction?.label}
                    className={cn(
                      'transition-colors hover:bg-[var(--color-bg-subtle)]',
                      interaction && 'cursor-pointer focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-[var(--color-focus)]',
                    )}
                    onClick={() => interaction && router.push(interaction.href as never)}
                    onKeyDown={(event) => {
                      if (!interaction || (event.key !== 'Enter' && event.key !== ' ')) return
                      event.preventDefault()
                      router.push(interaction.href as never)
                    }}
                  >
                    {enableSelection ? (
                      <td className="border-b border-[var(--color-border)] px-3 py-2" onClick={(event) => event.stopPropagation()} onKeyDown={(event) => event.stopPropagation()}>
                        <input
                          aria-label={`Select ${interaction?.label ?? `row ${row.index + 1}`}`}
                          type="checkbox"
                          checked={row.getIsSelected()}
                          onChange={row.getToggleSelectedHandler()}
                        />
                      </td>
                    ) : null}
                    {row.getVisibleCells().map((cell) => (
                      <td key={cell.id} className="border-b border-[var(--color-border)] px-3 py-2 align-middle text-[var(--color-foreground)]">
                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                      </td>
                    ))}
                    {rowActions ? (
                      <td
                        className="border-b border-[var(--color-border)] px-3 py-2 text-right align-middle"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <div aria-label={`Actions for ${interaction?.label ?? `row ${row.index + 1}`}`} className="flex justify-end gap-1">
                          {rowActions(row.original)}
                        </div>
                      </td>
                    ) : null}
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
        <p className="text-[var(--color-muted)]">
          Page {currentPage} of {totalPages} · {total} rows
        </p>
        <div className="flex items-center gap-2">
          <label className="text-xs text-[var(--color-muted)]">
            Rows per page
            <select
              aria-label="Rows per page"
              className="ml-2 h-8 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface)] px-2"
              value={pagination.pageSize}
              onChange={(event) => table.setPageSize(Math.min(100, Number(event.target.value)))}
            >
              {PAGE_SIZES.map((size) => <option key={size} value={size}>{size}</option>)}
            </select>
          </label>
          <Button size="sm" variant="outline" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>Previous</Button>
          <Button size="sm" variant="outline" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>Next</Button>
        </div>
      </div>
    </section>
  )
}
