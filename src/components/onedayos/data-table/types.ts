import type { ReactNode } from 'react'

export type DataTableMode = 'client' | 'server'

export type DataTableQueryState = {
  q?: string
  page: number
  pageSize: number
  sort?: string
  direction?: 'asc' | 'desc'
  filters?: Record<string, string | undefined>
}

export type DataTablePageMeta = {
  page: number
  pageSize: number
  total: number
  totalPages: number
}

export type DataTableFilter = {
  id: string
  label: string
  value?: string
  options: Array<{ value: string; label: string }>
}

export type DataTableRowInteraction<T> = {
  href: (row: T) => string
  label: (row: T) => string
}

export type DataTableV2Column<T> = {
  id: string
  header: ReactNode
  cell: (row: T) => ReactNode
  accessor?: (row: T) => unknown
  sortable?: boolean
  hideable?: boolean
  required?: boolean
  className?: string
}

export type DataTableExportOptions = {
  endpoint: string
  resourceLabel: string
  totalFilteredRows: number
  formats?: readonly ('csv' | 'xlsx')[]
}
