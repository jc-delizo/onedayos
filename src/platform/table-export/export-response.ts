import type { ExportFormat } from './types'

export function exportResponse(body: Uint8Array, format: ExportFormat, filename: string): Response {
  return new Response(body as BodyInit, {
    status: 200,
    headers: {
      'Content-Type': format === 'csv'
        ? 'text/csv; charset=utf-8'
        : 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': `attachment; filename="${filename}"`,
      'Cache-Control': 'no-store',
      'X-Content-Type-Options': 'nosniff',
    },
  })
}
