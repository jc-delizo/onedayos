import type { NextRequest } from 'next/server'
import { z } from 'zod'
import { sdk } from '@/sdk/server'
import { InventoryTransactionService } from '@/modules/inventory/transactions/service'
import { reversalCreateSchema } from '@/modules/inventory/transactions/schemas'
import { requireIdempotencyKey } from '@/modules/inventory/transactions/security'
import { toInventoryTransactionApiFailure } from '@/modules/inventory/transactions/api'

const paramsSchema = z.strictObject({ orgSlug: z.string().min(1), id: z.string().min(1) })
type Context = { params: Promise<{ orgSlug: string; id: string }> }

export async function POST(request: NextRequest, context: Context) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    sdk.runtime.requireInventoryV2()
    const params = sdk.api.parseRouteParams(await context.params, paramsSchema)
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, params.orgSlug, 'inventory', requestId)
    const input = await sdk.api.parseJsonBody(handledRequest, reversalCreateSchema)
    try {
      const key = requireIdempotencyKey(handledRequest.headers.get('Idempotency-Key'))
      return sdk.api.created(await InventoryTransactionService.reverseById(ctx, params.id, input, key))
    } catch (error) {
      const failure = toInventoryTransactionApiFailure(error, requestId)
      if (failure) return sdk.api.failure(failure.error, failure.status)
      throw error
    }
  })(request)
}
