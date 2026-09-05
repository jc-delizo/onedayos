import type { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { handleExportRoute } from '@/platform/table-export/route-handler'
import { inventoryExportResource } from '@/platform/table-export/resources'

export async function POST(request: NextRequest, context: { params: Promise<{ orgSlug: string }> }) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    sdk.runtime.requireInventoryV2()
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
    return handleExportRoute(handledRequest, ctx, inventoryExportResource(ctx, 'issues'))
  })(request)
}
