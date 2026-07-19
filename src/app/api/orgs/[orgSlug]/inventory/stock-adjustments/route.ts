import type { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { toInventoryApiFailure } from '@/modules/inventory/api'
import { createStockAdjustmentSchema, stockAdjustmentQuerySchema } from '@/modules/inventory/schema'
import { InventoryService } from '@/modules/inventory/service'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
    const query = sdk.api.parseSearchParams(handledRequest.nextUrl.searchParams, stockAdjustmentQuerySchema)
    const data = await InventoryService.listStockAdjustments(ctx, query)
    return sdk.api.ok(data)
  })(request)
}

export async function POST(request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
    const input = await sdk.api.parseJsonBody(handledRequest, createStockAdjustmentSchema)

    try {
      const data = await InventoryService.createStockAdjustment(ctx, input)
      return sdk.api.created(data)
    } catch (error) {
      const failure = toInventoryApiFailure(error, requestId)
      if (failure) return sdk.api.failure(failure.error, failure.status)
      throw error
    }
  })(request)
}
