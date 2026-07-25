import 'server-only'
import type { ApiError } from '@/sdk'
import { isInventoryTransactionError } from './security'

export function toInventoryTransactionApiFailure(error: unknown, requestId: string): { error: ApiError; status: number } | null {
  if (!isInventoryTransactionError(error)) return null
  return {
    error: { code: error.code, message: error.message, details: error.details, requestId },
    status: error.status,
  }
}
