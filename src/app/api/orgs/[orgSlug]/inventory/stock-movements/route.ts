import type { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { stockMovementQuerySchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import { apiSuccess } from '@/kernel/api/response'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
    const query = sdk.api.parseSearchParams(handledRequest.nextUrl.searchParams, stockMovementQuerySchema)
    const result = await InventoryService.listStockMovementsPage(ctx, query)
    return apiSuccess(result.rows, {}, result.meta)
  })(request)
}
