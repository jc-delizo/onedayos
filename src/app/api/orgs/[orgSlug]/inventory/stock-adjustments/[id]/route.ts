import type { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { toInventoryApiFailure } from '@/modules/inventory/api'
import { inventoryRouteIdSchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'

type RouteContext = {
  params: Promise<{ orgSlug: string; id: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    const { orgSlug, id } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
    const routeParams = sdk.api.parseRouteParams({ id }, inventoryRouteIdSchema)

    try {
      const data = await InventoryService.getStockAdjustment(ctx, routeParams.id)
      return sdk.api.ok(data)
    } catch (error) {
      const failure = toInventoryApiFailure(error, requestId)
      if (failure) return sdk.api.failure(failure.error, failure.status)
      throw error
    }
  })(request)
}
