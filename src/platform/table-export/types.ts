export type ExportFormat = 'csv' | 'xlsx'
export type ExportScope = 'selected' | 'filtered'
export type ExportCell = string | number | boolean | Date | null

export type ExportColumn<Row> = {
  id: string
  header: string
  getValue: (row: Row) => ExportCell
  required?: boolean
}

export type TableExportRequest<Query extends Record<string, unknown> = Record<string, unknown>> = {
  format: ExportFormat
  scope: ExportScope
  selectedIds?: string[]
  columns?: string[]
  query: Query
}

export type TableExportConfig<Row, Query extends Record<string, unknown>> = {
  resource: string
  worksheetName: string
  defaultColumns: readonly string[]
  columns: readonly ExportColumn<Row>[]
  loadPage: (query: Query & { page: number; pageSize: number }) => Promise<{
    rows: Row[]
    total: number
  }>
  getRowId: (row: Row) => string
}
