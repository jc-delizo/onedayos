import { z } from 'zod'
import { apiErrors } from './errors'

const tenantIdentityKeys = new Set(['orgId', 'organizationId', 'tenantId'])

function containsTenantIdentity(value: unknown): boolean {
  if (!value || typeof value !== 'object') return false
  if (Array.isArray(value)) return value.some(containsTenantIdentity)
  return Object.entries(value).some(([key, nested]) =>
    tenantIdentityKeys.has(key) || containsTenantIdentity(nested),
  )
}

export async function parseStrictJsonBody<T extends z.ZodType>(
  request: Request,
  schema: T,
): Promise<z.infer<T>> {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    throw apiErrors.badRequest('Request body must be valid JSON.')
  }

  if (containsTenantIdentity(payload)) throw apiErrors.tenantIdentityRejected()

  const parsed = schema.safeParse(payload)

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error)
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened.fieldErrors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1])),
    )

    throw apiErrors.validation(fieldErrors, flattened.formErrors)
  }

  return parsed.data
}

export function parseStrictSearchParams<T extends z.ZodType>(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  schema: T,
): z.infer<T> {
  const payload = searchParams instanceof URLSearchParams ? Object.fromEntries(searchParams) : searchParams

  for (const key of tenantIdentityKeys) {
    if (Object.prototype.hasOwnProperty.call(payload, key)) {
      throw apiErrors.tenantIdentityRejected()
    }
  }

  const parsed = schema.safeParse(payload)

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error)
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened.fieldErrors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1])),
    )

    throw apiErrors.validation(fieldErrors, flattened.formErrors)
  }

  return parsed.data
}

export function parseStrictRouteParams<T extends z.ZodType>(
  params: Record<string, string | string[] | undefined>,
  schema: T,
): z.infer<T> {
  for (const key of tenantIdentityKeys) {
    if (Object.prototype.hasOwnProperty.call(params, key)) {
      throw apiErrors.tenantIdentityRejected()
    }
  }

  const parsed = schema.safeParse(params)

  if (!parsed.success) {
    const flattened = z.flattenError(parsed.error)
    const fieldErrors = Object.fromEntries(
      Object.entries(flattened.fieldErrors).filter((entry): entry is [string, string[]] => Array.isArray(entry[1])),
    )

    throw apiErrors.validation(fieldErrors, flattened.formErrors)
  }

  return parsed.data
}
