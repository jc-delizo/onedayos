import type { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { toInventoryApiFailure } from '@/modules/inventory/api'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import { inventoryRouteIdSchema, updateProductSettingSchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'

type RouteContext = {
  params: Promise<{ orgSlug: string; id: string }>
}

export async function PATCH(request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    const { orgSlug, id } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
    const routeParams = sdk.api.parseRouteParams({ id }, inventoryRouteIdSchema)
    await sdk.permissions.require(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_UPDATE)
    const input = await sdk.api.parseJsonBody(handledRequest, updateProductSettingSchema)

    try {
      const data = await InventoryService.upsertProductSetting(ctx, { ...input, productId: routeParams.id })
      return sdk.api.ok(data)
    } catch (error) {
      const failure = toInventoryApiFailure(error, requestId)
      if (failure) return sdk.api.failure(failure.error, failure.status)
      throw error
    }
  })(request)
}
