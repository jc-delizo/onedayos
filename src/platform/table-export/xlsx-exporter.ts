import 'server-only'
import ExcelJS from 'exceljs'
import { safeWorksheetName } from './filename'
import { spreadsheetSafeCell } from './spreadsheet-safety'
import type { ExportColumn } from './types'

export async function createXlsx<Row>(
  rows: readonly Row[],
  columns: readonly ExportColumn<Row>[],
  worksheetName: string,
): Promise<Uint8Array> {
  const workbook = new ExcelJS.Workbook()
  workbook.creator = 'OneDayOS'
  workbook.title = 'OneDayOS table export'
  workbook.created = new Date(0)
  workbook.modified = new Date(0)

  const worksheet = workbook.addWorksheet(safeWorksheetName(worksheetName))
  worksheet.views = [{ state: 'frozen', ySplit: 1 }]
  worksheet.columns = columns.map((column) => ({
    header: column.header,
    key: column.id,
    width: Math.min(40, Math.max(12, column.header.length + 2)),
  }))
  worksheet.autoFilter = `A1:${worksheet.getColumn(columns.length).letter}1`

  const header = worksheet.getRow(1)
  header.font = { bold: true, color: { argb: 'FFFFFFFF' } }
  header.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF334155' } }

  for (const row of rows) {
    const values = Object.fromEntries(columns.map((column) => [
      column.id,
      spreadsheetSafeCell(column.getValue(row)),
    ]))
    worksheet.addRow(values)
  }

  for (const column of worksheet.columns) {
    let width = column.width ?? 12
    column.eachCell?.({ includeEmpty: false }, (cell) => {
      width = Math.min(40, Math.max(width, String(cell.value ?? '').length + 2))
      if (cell.value instanceof Date) cell.numFmt = 'yyyy-mm-dd hh:mm'
    })
    column.width = width
  }

  return new Uint8Array(await workbook.xlsx.writeBuffer())
}
