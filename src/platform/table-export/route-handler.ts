import 'server-only'
import type { NextRequest } from 'next/server'
import type { PlatformContext } from '@/sdk'
import { sdk } from '@/sdk/server'
import { exportResponse } from './export-response'
import { generateTableExport } from './export-service'
import type { ExportResource } from './resources'

export async function handleExportRoute(
  request: NextRequest,
  ctx: PlatformContext,
  definition: ExportResource,
): Promise<Response> {
  await sdk.permissions.requireAll(ctx, [definition.readPermission, definition.exportPermission])
  const parsed = await sdk.api.parseJsonBody(request, definition.requestSchema)
  const result = await generateTableExport(definition.config, parsed as never)
  return exportResponse(result.body, result.format, result.filename)
}
