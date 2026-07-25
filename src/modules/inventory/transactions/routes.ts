import 'server-only'
import type { NextRequest } from 'next/server'
import type { z } from 'zod'
import { sdk } from '@/sdk/server'
import { InventoryTransactionService } from './service'
import { requireIdempotencyKey } from './security'
import { toInventoryTransactionApiFailure } from './api'
import { transactionQuerySchema, type InventoryTransactionType, type PostInput } from './schemas'

type RouteContext = { params: Promise<{ orgSlug: string }> }

export function listTransactions(type: InventoryTransactionType, request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    sdk.runtime.requireInventoryV2()
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
    const query = sdk.api.parseSearchParams(handledRequest.nextUrl.searchParams, transactionQuerySchema)
    const result = await InventoryTransactionService.list(ctx, type, query)
    return sdk.api.success(result.rows, {}, result.meta)
  })(request)
}

export function postTransaction(type: InventoryTransactionType, schema: z.ZodType<PostInput>, request: NextRequest, context: RouteContext) {
  return sdk.api.handle(async (handledRequest, requestId) => {
    sdk.runtime.requireInventoryV2()
    const { orgSlug } = await context.params
    const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
    const input = await sdk.api.parseJsonBody(handledRequest, schema)
    try {
      const key = requireIdempotencyKey(handledRequest.headers.get('Idempotency-Key'))
      return sdk.api.created(await InventoryTransactionService.post(ctx, type, input, key))
    } catch (error) {
      const failure = toInventoryTransactionApiFailure(error, requestId)
      if (failure) return sdk.api.failure(failure.error, failure.status)
      throw error
    }
  })(request)
}
