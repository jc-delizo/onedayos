import 'server-only'
import { apiErrors } from '@/kernel/api/errors'
import { createCsv } from './csv-exporter'
import { resolveExportColumns } from './columns'
import { safeExportFilename } from './filename'
import { EXPORT_BATCH_SIZE, MAX_FILTERED_EXPORT_ROWS } from './schema'
import type { TableExportConfig, TableExportRequest } from './types'
import { createXlsx } from './xlsx-exporter'

export async function generateTableExport<Row, Query extends Record<string, unknown>>(
  config: TableExportConfig<Row, Query>,
  request: TableExportRequest<Query>,
) {
  const columns = resolveExportColumns(config.columns, config.defaultColumns, request.columns)
  const selected = request.scope === 'selected' ? new Set(request.selectedIds) : null
  const first = await config.loadPage({ ...request.query, page: 1, pageSize: EXPORT_BATCH_SIZE })

  if (first.total === 0) throw apiErrors.exportEmpty()
  if (first.total > MAX_FILTERED_EXPORT_ROWS) throw apiErrors.exportRowLimit()

  const allRows = [...first.rows]
  for (let page = 2; allRows.length < first.total; page += 1) {
    const batch = await config.loadPage({ ...request.query, page, pageSize: EXPORT_BATCH_SIZE })
    if (batch.total > MAX_FILTERED_EXPORT_ROWS) throw apiErrors.exportRowLimit()
    allRows.push(...batch.rows)
    if (batch.rows.length === 0) break
  }

  const rows = selected
    ? allRows.filter((row) => selected.has(config.getRowId(row)))
    : allRows

  if (selected && rows.length !== selected.size) throw apiErrors.exportSelectionInvalid()
  if (rows.length === 0) throw apiErrors.exportEmpty()

  const body = request.format === 'csv'
    ? createCsv(rows, columns)
    : await createXlsx(rows, columns, config.worksheetName)

  return {
    body,
    filename: safeExportFilename(config.resource, request.format),
    format: request.format,
    rowCount: rows.length,
  }
}
