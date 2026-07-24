import type { ApiError, ApiErrorCode } from '@/sdk'

export class ApiException extends Error {
  constructor(
    public readonly status: number,
    public readonly code: ApiErrorCode,
    message: string,
    public readonly details?: unknown,
    public readonly fieldErrors?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiException'
  }
}

export function toApiError(error: ApiException, requestId?: string): ApiError {
  return {
    code: error.code,
    message: error.message,
    details: error.details,
    fieldErrors: error.fieldErrors,
    requestId,
  }
}

export const apiErrors = {
  badRequest(message = 'The request could not be processed.', details?: unknown) {
    return new ApiException(400, 'BAD_REQUEST', message, details)
  },
  unauthenticated(message = 'Authentication required.') {
    return new ApiException(401, 'UNAUTHENTICATED', message)
  },
  forbidden(message = 'You do not have permission to perform this action.') {
    return new ApiException(403, 'FORBIDDEN', message)
  },
  registrationDisabled(message = 'Registration is currently invite-only.') {
    return new ApiException(403, 'REGISTRATION_DISABLED', message)
  },
  orgNotFound(message = 'Organization not found.') {
    return new ApiException(404, 'ORG_NOT_FOUND', message)
  },
  orgSuspended(message = 'Organization is not active.') {
    return new ApiException(403, 'ORG_SUSPENDED', message)
  },
  userInactive(message = 'User account is inactive.') {
    return new ApiException(403, 'USER_INACTIVE', message)
  },
  moduleDisabled(message = 'Module is not enabled for this organization.') {
    return new ApiException(403, 'MODULE_DISABLED', message)
  },
  moduleNotFound(message = 'Module not found.') {
    return new ApiException(404, 'MODULE_NOT_FOUND', message)
  },
  notFound(message = 'Not found.') {
    return new ApiException(404, 'NOT_FOUND', message)
  },
  validation(fieldErrors: Record<string, string[]> = {}, details?: unknown) {
    return new ApiException(400, 'VALIDATION_ERROR', 'Validation failed.', details, fieldErrors)
  },
  tenantIdentityRejected() {
    return new ApiException(
      400,
      'TENANT_ID_NOT_ALLOWED',
      'Tenant identity is derived from the authenticated session and route. Do not submit orgId.',
    )
  },
  exportRowLimit() {
    return new ApiException(
      422,
      'EXPORT_ROW_LIMIT_EXCEEDED',
      'This export exceeds 10,000 rows. Narrow the current filters or export selected rows.',
    )
  },
  exportSelectionInvalid() {
    return new ApiException(
      422,
      'EXPORT_SELECTION_INVALID',
      'One or more selected rows are unavailable. Refresh the table and select rows again.',
    )
  },
  exportEmpty() {
    return new ApiException(422, 'EXPORT_EMPTY', 'No matching rows are available to export.')
  },
  internal(message = 'Something went wrong.') {
    return new ApiException(500, 'INTERNAL_ERROR', message)
  },
}
