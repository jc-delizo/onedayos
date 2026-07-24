import { spreadsheetSafeCell } from './spreadsheet-safety'
import type { ExportColumn } from './types'

function serializeValue(value: unknown): string {
  if (value == null) return ''
  if (value instanceof Date) return value.toISOString()
  return String(spreadsheetSafeCell(value))
}

function quote(value: string): string {
  return /[",\r\n]/.test(value) ? `"${value.replace(/"/g, '""')}"` : value
}

export function createCsv<Row>(rows: readonly Row[], columns: readonly ExportColumn<Row>[]): Uint8Array {
  const lines = [
    columns.map((column) => quote(column.header)).join(','),
    ...rows.map((row) => columns.map((column) => quote(serializeValue(column.getValue(row)))).join(',')),
  ]
  return new TextEncoder().encode(`\uFEFF${lines.join('\r\n')}\r\n`)
}
