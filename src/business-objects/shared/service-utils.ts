import 'server-only'
import type { PrismaClient } from '@prisma/client'
import type { PermissionRequirement, PlatformContext } from '@/sdk'
import { apiErrors } from '@/kernel/api/errors'
import { sdk } from '@/sdk/server'

export function getBusinessObjectPrisma(ctx: PlatformContext): PrismaClient {
  const db = sdk.getDb(ctx)
  return db.prisma as PrismaClient
}

export async function requireBusinessObjectPermission(
  ctx: PlatformContext,
  requirement: PermissionRequirement,
): Promise<void> {
  await sdk.permissions.require(ctx, requirement)
}

export function requireRecord<T>(record: T | null): T {
  if (!record) {
    throw apiErrors.notFound('Record not found.')
  }

  return record
}

export function omitUndefined<T extends Record<string, unknown>>(input: T): Partial<T> {
  return Object.fromEntries(Object.entries(input).filter(([, value]) => value !== undefined)) as Partial<T>
}

export function changedFields(input: Record<string, unknown>): string[] {
  return Object.keys(omitUndefined(input)).sort()
}

export async function emitBusinessObjectEvent(
  ctx: PlatformContext,
  eventName: string,
  payload: Record<string, unknown>,
): Promise<void> {
  if ('orgId' in payload) {
    throw apiErrors.internal('Business Object event payloads must not expose tenant identity.')
  }

  await sdk.events.emit(ctx, eventName, payload)
}

export function containsSearch(search: string | undefined, fields: string[]) {
  if (!search) return undefined

  return fields.map((field) => ({
    [field]: {
      contains: search,
      mode: 'insensitive',
    },
  }))
}

export async function requireSameOrgReference<T>(
  record: Promise<T | null>,
  message = 'Referenced record was not found.',
): Promise<T> {
  const resolved = await record

  if (!resolved) {
    throw apiErrors.validation({}, [message])
  }

  return resolved
}
