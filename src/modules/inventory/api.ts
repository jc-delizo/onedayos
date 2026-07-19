import 'server-only'
import type { ApiError } from '@/sdk'
import { isInventoryServiceError } from './service'

export function toInventoryApiFailure(error: unknown, requestId: string): { error: ApiError; status: number } | null {
  if (!isInventoryServiceError(error)) {
    return null
  }

  return {
    error: {
      code: error.code,
      message: error.message,
      details: error.details,
      requestId,
    },
    status: error.status,
  }
}
