import { apiErrors } from '@/kernel/api/errors'
import type { ExportColumn } from './types'

export function resolveExportColumns<Row>(
  columns: readonly ExportColumn<Row>[],
  defaults: readonly string[],
  requested?: readonly string[],
): ExportColumn<Row>[] {
  const allowed = new Map(columns.map((column) => [column.id, column]))
  const requestedIds = requested ?? defaults
  const unknown = requestedIds.filter((id) => !allowed.has(id))
  if (unknown.length > 0) throw apiErrors.validation({ columns: ['One or more export columns are not allowed.'] })

  const finalIds = new Set(requestedIds)
  for (const column of columns) {
    if (column.required) finalIds.add(column.id)
  }

  return columns.filter((column) => finalIds.has(column.id))
}
