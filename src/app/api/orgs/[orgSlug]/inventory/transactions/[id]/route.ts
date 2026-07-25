import type { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { InventoryTransactionService } from '@/modules/inventory/transactions/service'
import { transactionIdParamsSchema } from '@/modules/inventory/transactions/schemas'
import { toInventoryTransactionApiFailure } from '@/modules/inventory/transactions/api'

type Context = { params: Promise<{ orgSlug: string; id: string }> }

export async function GET(request: NextRequest, context: Context) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    sdk.runtime.requireInventoryV2()
    const params = sdk.api.parseRouteParams(await context.params, transactionIdParamsSchema.extend({ orgSlug: transactionIdParamsSchema.shape.id }))
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, params.orgSlug, 'inventory', requestId)
    try {
      return sdk.api.ok(await InventoryTransactionService.detail(ctx, params.id))
    } catch (error) {
      const failure = toInventoryTransactionApiFailure(error, requestId)
      if (failure) return sdk.api.failure(failure.error, failure.status)
      throw error
    }
  })(request)
}
