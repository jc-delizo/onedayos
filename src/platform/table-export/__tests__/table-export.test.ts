import { describe, expect, it, vi } from 'vitest'
import { z } from 'zod'
import ExcelJS from 'exceljs'
import { createCsv } from '../csv-exporter'
import { safeExportFilename, safeWorksheetName } from '../filename'
import { generateTableExport } from '../export-service'
import {
  createTableExportRequestSchema,
  MAX_SELECTED_EXPORT_IDS,
} from '../schema'
import { spreadsheetSafeString } from '../spreadsheet-safety'
import { createXlsx } from '../xlsx-exporter'
import type { ExportColumn } from '../types'

type Row = {
  id: string
  name: string
  amount: number
  active: boolean
  occurredAt: Date
  empty: null
}

const columns: readonly ExportColumn<Row>[] = [
  { id: 'name', header: 'Name', getValue: (row) => row.name, required: true },
  { id: 'amount', header: 'Amount', getValue: (row) => row.amount },
  { id: 'active', header: 'Active', getValue: (row) => row.active },
  { id: 'occurredAt', header: 'Occurred At', getValue: (row) => row.occurredAt },
  { id: 'empty', header: 'Empty', getValue: (row) => row.empty },
]

const baseRow: Row = {
  id: 'one',
  name: 'Coffee',
  amount: 12.5,
  active: true,
  occurredAt: new Date('2026-07-24T02:30:00.000Z'),
  empty: null,
}

describe('bounded table export', () => {
  it.each(['=SUM(A1:A2)', '+1', '-1', '@cmd', '\tcmd', '\rcmd'])(
    'protects formula-like string %j',
    (value) => expect(spreadsheetSafeString(value)).toBe(`'${value}`),
  )

  it('serializes UTF-8 RFC-style CSV with BOM, CRLF, escaping, and typed values', () => {
    const bytes = createCsv([
      { ...baseRow, name: '=danger,"quoted"\nnext' },
    ], columns)
    const csv = new TextDecoder().decode(bytes)

    expect([...bytes.slice(0, 3)]).toEqual([0xef, 0xbb, 0xbf])
    expect(csv).toContain('"\'=danger,""quoted""\nnext"')
    expect(csv).toContain(',12.5,true,2026-07-24T02:30:00.000Z,')
    expect(csv.endsWith('\r\n')).toBe(true)
  })

  it('writes typed XLSX cells without formulas or excessive widths', async () => {
    const buffer = await createXlsx([{ ...baseRow, name: '=danger' }], columns, 'Unsafe / Export [Name]')
    const workbook = new ExcelJS.Workbook()
    await workbook.xlsx.load(Buffer.from(buffer) as unknown as Parameters<typeof workbook.xlsx.load>[0])
    const worksheet = workbook.worksheets[0]

    expect(worksheet?.name).toBe('Unsafe Export Name')
    expect(worksheet?.rowCount).toBe(2)
    expect(worksheet?.getCell('A2').value).toBe("'=danger")
    expect(worksheet?.getCell('A2').formula).toBeUndefined()
    expect(worksheet?.getCell('B2').value).toBe(12.5)
    expect(worksheet?.getCell('C2').value).toBe(true)
    expect(worksheet?.getCell('D2').value).toBeInstanceOf(Date)
    expect(Math.max(...(worksheet?.columns.map((column) => column.width ?? 0) ?? []))).toBeLessThanOrEqual(40)
  })

  it('strictly validates scope, columns, filters, tenant identity, and selected limits', () => {
    const schema = createTableExportRequestSchema(
      z.strictObject({ q: z.string().optional(), direction: z.enum(['asc', 'desc']).optional() }),
      ['name', 'amount'],
    )
    expect(schema.parse({
      format: 'csv',
      scope: 'selected',
      selectedIds: ['one', 'one', 'two'],
      columns: ['name'],
      query: { q: 'coffee' },
    }).selectedIds).toEqual(['one', 'two'])

    expect(() => schema.parse({ format: 'pdf', scope: 'filtered', query: {} })).toThrow()
    expect(() => schema.parse({ format: 'csv', scope: 'selected', query: {} })).toThrow()
    expect(() => schema.parse({ format: 'csv', scope: 'filtered', columns: ['internalId'], query: {} })).toThrow()
    expect(() => schema.parse({ format: 'csv', scope: 'filtered', query: { status: 'hidden' } })).toThrow()
    expect(() => schema.parse({ format: 'csv', scope: 'filtered', query: {}, orgId: 'other' })).toThrow()
    expect(() => schema.parse({
      format: 'csv',
      scope: 'selected',
      selectedIds: Array.from({ length: MAX_SELECTED_EXPORT_IDS + 1 }, (_, index) => String(index)),
      query: {},
    })).toThrow()
  })

  it('loads deterministic bounded pages and returns only selected authorized rows', async () => {
    const rows = Array.from({ length: 205 }, (_, index) => ({
      ...baseRow,
      id: `row-${index}`,
      name: `Row ${index}`,
    }))
    const loadPage = vi.fn(async ({ page, pageSize }: { page: number; pageSize: number }) => ({
      rows: rows.slice((page - 1) * pageSize, page * pageSize),
      total: rows.length,
    }))
    const config = {
      resource: 'records',
      worksheetName: 'Records',
      defaultColumns: ['name'],
      columns,
      loadPage,
      getRowId: (row: Row) => row.id,
    }

    const result = await generateTableExport(config, {
      format: 'csv',
      scope: 'selected',
      selectedIds: ['row-1', 'row-204'],
      columns: ['name'],
      query: {},
    })
    expect(loadPage).toHaveBeenCalledTimes(3)
    expect(new TextDecoder().decode(result.body)).toContain('Row 204')
    expect(new TextDecoder().decode(result.body)).not.toContain('Row 203')

    await expect(generateTableExport(config, {
      format: 'csv',
      scope: 'selected',
      selectedIds: ['row-1', 'other-tenant-row'],
      query: {},
    })).rejects.toMatchObject({ code: 'EXPORT_SELECTION_INVALID', status: 422 })
  })

  it('rejects the exact row limit before serialization and creates safe names', async () => {
    await expect(generateTableExport({
      resource: 'records',
      worksheetName: 'Records',
      defaultColumns: ['name'],
      columns,
      loadPage: async () => ({ rows: [], total: 10_001 }),
      getRowId: (row: Row) => row.id,
    }, {
      format: 'xlsx',
      scope: 'filtered',
      query: {},
    })).rejects.toMatchObject({ code: 'EXPORT_ROW_LIMIT_EXCEEDED', status: 422 })

    expect(safeExportFilename('../Café Records', 'xlsx', new Date('2026-07-24T00:00:00Z')))
      .toBe('onedayos-cafe-records-2026-07-24.xlsx')
    expect(safeWorksheetName('x'.repeat(80))).toHaveLength(31)
  })
})
