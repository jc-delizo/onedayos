import type { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { toInventoryApiFailure } from '@/modules/inventory/api'
import { INVENTORY_PERMISSIONS } from '@/modules/inventory/permissions'
import { productSettingListQuerySchema, upsertProductSettingSchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'
import { apiSuccess } from '@/kernel/api/response'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
    await sdk.permissions.require(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ)
    const query = sdk.api.parseSearchParams(handledRequest.nextUrl.searchParams, productSettingListQuerySchema)
    const result = await InventoryService.listProductSettingsPage(ctx, query)
    return apiSuccess(result.rows, {}, result.meta)
  })(request)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
    await sdk.permissions.require(ctx, INVENTORY_PERMISSIONS.PRODUCT_SETTING_UPDATE)
    const input = await sdk.api.parseJsonBody(handledRequest, upsertProductSettingSchema)

    try {
      const data = await InventoryService.upsertProductSetting(ctx, input)
      return sdk.api.created(data)
    } catch (error) {
      const failure = toInventoryApiFailure(error, requestId)
      if (failure) return sdk.api.failure(failure.error, failure.status)
      throw error
    }
  })(request)
}
