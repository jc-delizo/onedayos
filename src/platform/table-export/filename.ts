import type { ExportFormat } from './types'

export function safeExportFilename(resource: string, format: ExportFormat, date = new Date()): string {
  const safeResource = resource
    .normalize('NFKD')
    .replace(/[^\x00-\x7F]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64) || 'records'
  return `onedayos-${safeResource}-${date.toISOString().slice(0, 10)}.${format}`
}

export function safeWorksheetName(value: string): string {
  const sanitized = value.replace(/[\u0000-\u001f\\/*?:[\]]/g, ' ').replace(/\s+/g, ' ').trim()
  return (sanitized || 'Export').slice(0, 31)
}
