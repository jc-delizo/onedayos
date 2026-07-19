import type { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { toInventoryApiFailure } from '@/modules/inventory/api'
import { InventoryService } from '@/modules/inventory/service'

type RouteContext = {
  params: Promise<{ orgSlug: string }>
}

export async function GET(request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)

    try {
      const data = await InventoryService.getDashboard(ctx)
      return sdk.api.ok(data)
    } catch (error) {
      const failure = toInventoryApiFailure(error, requestId)
      if (failure) return sdk.api.failure(failure.error, failure.status)
      throw error
    }
  })(request)
}
