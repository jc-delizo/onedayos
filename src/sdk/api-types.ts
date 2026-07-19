export type ApiErrorCode =
  | 'BAD_REQUEST'
  | 'UNAUTHENTICATED'
  | 'FORBIDDEN'
  | 'REGISTRATION_DISABLED'
  | 'ORG_NOT_FOUND'
  | 'ORG_SUSPENDED'
  | 'USER_INACTIVE'
  | 'MODULE_DISABLED'
  | 'MODULE_NOT_FOUND'
  | 'NOT_FOUND'
  | 'VALIDATION_ERROR'
  | 'TENANT_ID_NOT_ALLOWED'
  | 'CONFLICT'
  | 'UNSUPPORTED_MEDIA_TYPE'
  | 'METHOD_NOT_ALLOWED'
  | 'RATE_LIMITED'
  | 'INTERNAL_ERROR'

export type ApiError = {
  code: ApiErrorCode
  message: string
  details?: unknown
  fieldErrors?: Record<string, string[]>
  requestId?: string
}

export type ApiMeta = {
  requestId?: string
  pagination?: {
    cursor?: string | null
    nextCursor?: string | null
    limit: number
    hasMore: boolean
  }
  warnings?: string[]
}

export type ApiSuccess<T> = {
  data: T
  error: null
  meta?: ApiMeta
}

export type ApiFailure = {
  data: null
  error: ApiError
  meta?: ApiMeta
}

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure
