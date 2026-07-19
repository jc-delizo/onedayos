import { randomUUID } from 'node:crypto'
import type { NextRequest } from 'next/server'
import { ApiException, apiErrors, toApiError } from './errors'
import { apiFailure } from './response'

type ApiHandler<T> = (request: NextRequest, requestId: string) => Promise<Response> | Response

export function withApiHandler<T = unknown>(handler: ApiHandler<T>) {
  return async (request: NextRequest): Promise<Response> => {
    const requestId = randomUUID()

    try {
      return await handler(request, requestId)
    } catch (error) {
      if (error instanceof ApiException) {
        return apiFailure(toApiError(error, requestId), error.status)
      }

      console.error('Unexpected API error', { requestId, error })
      return apiFailure(toApiError(apiErrors.internal(), requestId), 500)
    }
  }
}
