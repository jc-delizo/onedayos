import type { NextRequest } from 'next/server'
import type { z } from 'zod'
import type { PermissionRequirement, PlatformContext } from '@/sdk'
import { apiErrors } from '@/kernel/api/errors'
import { apiSuccess } from '@/kernel/api/response'
import { sdk } from '@/sdk/server'
import { idParamSchema } from './schema'

type CollectionContext = {
  params: Promise<{ orgSlug: string }>
}

type ItemContext = {
  params: Promise<{ orgSlug: string; id: string }>
}

type CollectionService<TQuery, TCreate> = {
  list(ctx: PlatformContext, query: TQuery): Promise<unknown>
  listPage?(ctx: PlatformContext, query: TQuery): Promise<{
    rows: unknown
    meta: { page: number; pageSize: number; total: number; totalPages: number }
  }>
  create(ctx: PlatformContext, input: TCreate): Promise<unknown>
}

type ItemService<TUpdate> = {
  getById(ctx: PlatformContext, id: string): Promise<unknown>
  update(ctx: PlatformContext, id: string, input: TUpdate): Promise<unknown>
  softDelete(ctx: PlatformContext, id: string): Promise<unknown>
}

type RestoreService = {
  restore(ctx: PlatformContext, id: string): Promise<unknown>
}

type ActionService = {
  deactivate?(ctx: PlatformContext, id: string): Promise<unknown>
  reactivate?(ctx: PlatformContext, id: string): Promise<unknown>
}

async function requireOrgContext(request: NextRequest, orgSlug: string, requestId: string) {
  return sdk.auth.requireApiOrgContext(request, orgSlug, requestId)
}

function parseIdParam(id: string): string {
  const parsed = idParamSchema.safeParse({ id })

  if (!parsed.success) {
    throw apiErrors.validation({ id: ['Invalid record id.'] })
  }

  return parsed.data.id
}

export function createBusinessObjectCollectionHandlers<TQuerySchema extends z.ZodType, TCreateSchema extends z.ZodType>({
  listSchema,
  createSchema,
  service,
  permissions,
}: {
  listSchema: TQuerySchema
  createSchema: TCreateSchema
  service: CollectionService<z.infer<TQuerySchema>, z.infer<TCreateSchema>>
  permissions: {
    READ: PermissionRequirement
    CREATE: PermissionRequirement
  }
}) {
  return {
    GET(request: NextRequest, context: CollectionContext) {
      return sdk.api.handle(async (handledRequest, requestId) => {
        const { orgSlug } = await context.params
        const ctx = await requireOrgContext(handledRequest, orgSlug, requestId)
        await sdk.permissions.require(ctx, permissions.READ)
        const query = sdk.api.parseSearchParams(handledRequest.nextUrl.searchParams, listSchema)
        if (service.listPage) {
          const result = await service.listPage(ctx, query)
          return apiSuccess(result.rows, {}, result.meta)
        }
        const data = await service.list(ctx, query)
        return sdk.api.ok(data)
      })(request)
    },

    POST(request: NextRequest, context: CollectionContext) {
      return sdk.api.handle(async (handledRequest, requestId) => {
        const { orgSlug } = await context.params
        const ctx = await requireOrgContext(handledRequest, orgSlug, requestId)
        await sdk.permissions.require(ctx, permissions.CREATE)
        const input = await sdk.api.parseJsonBody(handledRequest, createSchema)
        const data = await service.create(ctx, input)
        return sdk.api.created(data)
      })(request)
    },
  }
}

export function createBusinessObjectItemHandlers<TUpdateSchema extends z.ZodType>({
  updateSchema,
  service,
  permissions,
}: {
  updateSchema: TUpdateSchema
  service: ItemService<z.infer<TUpdateSchema>>
  permissions: {
    READ: PermissionRequirement
    UPDATE: PermissionRequirement
    DELETE: PermissionRequirement
  }
}) {
  return {
    GET(request: NextRequest, context: ItemContext) {
      return sdk.api.handle(async (handledRequest, requestId) => {
        const { orgSlug, id } = await context.params
        const parsedId = parseIdParam(id)
        const ctx = await requireOrgContext(handledRequest, orgSlug, requestId)
        await sdk.permissions.require(ctx, permissions.READ)
        const data = await service.getById(ctx, parsedId)
        return sdk.api.ok(data)
      })(request)
    },

    PATCH(request: NextRequest, context: ItemContext) {
      return sdk.api.handle(async (handledRequest, requestId) => {
        const { orgSlug, id } = await context.params
        const parsedId = parseIdParam(id)
        const ctx = await requireOrgContext(handledRequest, orgSlug, requestId)
        await sdk.permissions.require(ctx, permissions.UPDATE)
        const input = await sdk.api.parseJsonBody(handledRequest, updateSchema)
        const data = await service.update(ctx, parsedId, input)
        return sdk.api.ok(data)
      })(request)
    },

    DELETE(request: NextRequest, context: ItemContext) {
      return sdk.api.handle(async (handledRequest, requestId) => {
        const { orgSlug, id } = await context.params
        const parsedId = parseIdParam(id)
        const ctx = await requireOrgContext(handledRequest, orgSlug, requestId)
        await sdk.permissions.require(ctx, permissions.DELETE)
        const data = await service.softDelete(ctx, parsedId)
        return sdk.api.ok(data)
      })(request)
    },
  }
}

export function createBusinessObjectRestoreHandler({
  service,
  permission,
}: {
  service: RestoreService
  permission: PermissionRequirement
}) {
  return function POST(request: NextRequest, context: ItemContext) {
    return sdk.api.handle(async (handledRequest, requestId) => {
      const { orgSlug, id } = await context.params
      const parsedId = parseIdParam(id)
      const ctx = await requireOrgContext(handledRequest, orgSlug, requestId)
      await sdk.permissions.require(ctx, permission)
      const data = await service.restore(ctx, parsedId)
      return sdk.api.ok(data)
    })(request)
  }
}

export function createBusinessObjectStatusActionHandler({
  service,
  permission,
  action,
}: {
  service: ActionService
  permission: PermissionRequirement
  action: 'deactivate' | 'reactivate'
}) {
  return function POST(request: NextRequest, context: ItemContext) {
    return sdk.api.handle(async (handledRequest, requestId) => {
      const { orgSlug, id } = await context.params
      const parsedId = parseIdParam(id)
      const ctx = await requireOrgContext(handledRequest, orgSlug, requestId)
      await sdk.permissions.require(ctx, permission)
      const handler = service[action]

      if (!handler) {
        throw new Error(`Business Object ${action} is not available.`)
      }

      const data = await handler(ctx, parsedId)
      return sdk.api.ok(data)
    })(request)
  }
}
