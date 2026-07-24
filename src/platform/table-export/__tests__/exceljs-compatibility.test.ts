import { createRequire } from 'node:module'
import { describe, expect, it } from 'vitest'
import ExcelJS from 'exceljs'

const require = createRequire(import.meta.url)

function safeWorksheetName(value: string): string {
  const sanitized = value.replace(/[\u0000-\u001f\\/*?:[\]]/g, ' ').replace(/\s+/g, ' ').trim()
  return (sanitized || 'Export').slice(0, 31)
}

describe('ExcelJS 4.4.0 with the scoped uuid 11.1.1 override', () => {
  it('supports CommonJS and dynamic-import server interop', async () => {
    const commonJsExcel = require('exceljs') as typeof ExcelJS
    const commonJsUuid = require('uuid') as { v4: () => string }
    const imported = await import('exceljs')
    const dynamicExcel = imported.default ?? imported

    expect(commonJsExcel.Workbook).toBeTypeOf('function')
    expect(dynamicExcel.Workbook).toBeTypeOf('function')
    expect(commonJsUuid.v4).toBeTypeOf('function')
    expect(commonJsUuid.v4()).toMatch(/^[0-9a-f-]{36}$/i)
  })

  it('writes and reads typed, formula-safe in-memory workbooks repeatedly', async () => {
    for (let workbookIndex = 0; workbookIndex < 3; workbookIndex += 1) {
      const workbook = new ExcelJS.Workbook()
      workbook.creator = 'OneDayOS'
      workbook.title = 'Compatibility Gate'
      const worksheet = workbook.addWorksheet(
        safeWorksheetName(`Unsafe []:*?/\\ worksheet ${workbookIndex} with a very long suffix`),
      )
      worksheet.views = [{ state: 'frozen', ySplit: 1 }]
      worksheet.autoFilter = 'A1:F1'
      worksheet.columns = [
        { header: 'Text', key: 'text', width: 24 },
        { header: 'Number', key: 'number', width: 14 },
        { header: 'Boolean', key: 'boolean', width: 12 },
        { header: 'Date', key: 'date', width: 20 },
        { header: 'Empty', key: 'empty', width: 12 },
        { header: 'Formula-like text', key: 'formulaLike', width: 28 },
      ]

      const expectedDate = new Date(Date.UTC(2026, 6, 24, 2, 30))
      for (let rowIndex = 0; rowIndex < 350; rowIndex += 1) {
        worksheet.addRow({
          text: `Record ${rowIndex}`,
          number: rowIndex + 0.5,
          boolean: rowIndex % 2 === 0,
          date: expectedDate,
          empty: null,
          formulaLike: "'=HYPERLINK(\"https://invalid.example\")",
        })
      }
      // A non-gradient data bar uses ExcelJS's x14 extension path, which invokes
      // both reviewed zero-argument UUID v4 call sites during workbook writing.
      worksheet.addConditionalFormatting({
        ref: 'B2:B351',
        rules: [{
          type: 'dataBar',
          priority: 1,
          gradient: false,
          cfvo: [{ type: 'min' }, { type: 'max' }],
        }],
      })

      const buffer = Buffer.from(await workbook.xlsx.writeBuffer())
      expect(buffer.subarray(0, 4).toString('hex')).toBe('504b0304')

      const readback = new ExcelJS.Workbook()
      await readback.xlsx.load(buffer as unknown as Parameters<typeof readback.xlsx.load>[0])
      const loaded = readback.worksheets[0]

      expect(loaded).toBeDefined()
      expect(loaded?.name.length).toBeLessThanOrEqual(31)
      expect(loaded?.getRow(1).values).toEqual([
        undefined,
        'Text',
        'Number',
        'Boolean',
        'Date',
        'Empty',
        'Formula-like text',
      ])
      expect(loaded?.rowCount).toBe(351)
      expect(loaded?.getCell('A2').value).toBe('Record 0')
      expect(loaded?.getCell('B2').value).toBe(0.5)
      expect(loaded?.getCell('C2').value).toBe(true)
      expect(loaded?.getCell('D2').value).toBeInstanceOf(Date)
      expect((loaded?.getCell('D2').value as Date).toISOString()).toBe(expectedDate.toISOString())
      expect(loaded?.getCell('E2').value).toBeNull()
      expect(loaded?.getCell('F2').type).toBe(ExcelJS.ValueType.String)
      expect(loaded?.getCell('F2').formula).toBeUndefined()
      expect(loaded?.getCell('F2').value).toBe("'=HYPERLINK(\"https://invalid.example\")")
      expect(loaded?.views[0]).toMatchObject({ state: 'frozen', ySplit: 1 })
      expect(loaded?.autoFilter).toBe('A1:F1')
    }
  })

  it('sanitizes empty, invalid, and maximum worksheet names', () => {
    expect(safeWorksheetName('')).toBe('Export')
    expect(safeWorksheetName('a/b:c*d?e[f]g\\h')).toBe('a b c d e f g h')
    expect(safeWorksheetName('x'.repeat(80))).toHaveLength(31)
  })
})
