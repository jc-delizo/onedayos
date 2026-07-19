import 'server-only'
import type { PrismaClient } from '@prisma/client'
import type { PermissionRequirement, PlatformContext } from '@/sdk'
import type { BusinessObjectListQuery } from './schema'
import {
  changedFields,
  containsSearch,
  emitBusinessObjectEvent,
  getBusinessObjectPrisma,
  omitUndefined,
  requireBusinessObjectPermission,
  requireRecord,
} from './service-utils'

type Delegate<TRecord> = {
  findMany(args: any): Promise<TRecord[]>
  findFirst(args: any): Promise<TRecord | null>
  create(args: any): Promise<TRecord>
  update(args: any): Promise<TRecord>
}

type CrudPermissions = {
  READ: PermissionRequirement
  CREATE: PermissionRequirement
  UPDATE: PermissionRequirement
  DELETE: PermissionRequirement
  RESTORE: PermissionRequirement
  DEACTIVATE?: PermissionRequirement
  REACTIVATE?: PermissionRequirement
}

type CrudEvents = {
  CREATED: string
  UPDATED: string
  DELETED: string
  RESTORED: string
  DEACTIVATED?: string
  REACTIVATED?: string
}

type ServiceConfig<TCreate extends Record<string, unknown>, TUpdate extends Record<string, unknown>, TRecord extends { id: string }> = {
  delegate: (prisma: PrismaClient) => Delegate<TRecord>
  permissions: CrudPermissions
  events: CrudEvents
  eventIdField: string
  searchFields: string[]
  orderBy?: Record<string, string>
  createData: (input: TCreate, ctx: PlatformContext, prisma: PrismaClient) => Promise<Record<string, unknown>> | Record<string, unknown>
  updateData: (input: TUpdate, ctx: PlatformContext, prisma: PrismaClient, id: string) => Promise<Record<string, unknown>> | Record<string, unknown>
  deactivateData?: Record<string, unknown>
  reactivateData?: Record<string, unknown>
}

function eventIdentity(config: { eventIdField: string }, record: { id: string }) {
  return {
    [config.eventIdField]: record.id,
  }
}

function activeWhere(ctx: PlatformContext, id?: string, query?: BusinessObjectListQuery) {
  const search = containsSearch(query?.search, [])
  const where: Record<string, unknown> = {
    orgId: ctx.org.id,
    deletedAt: null,
  }

  if (id) {
    where.id = id
  }

  if (search && search.length > 0) {
    where.OR = search
  }

  return where
}

function tenantUnique(ctx: PlatformContext, id: string) {
  return {
    id_orgId: {
      id,
      orgId: ctx.org.id,
    },
  }
}

export function createBusinessObjectService<
  TCreate extends Record<string, unknown>,
  TUpdate extends Record<string, unknown>,
  TRecord extends { id: string },
>(config: ServiceConfig<TCreate, TUpdate, TRecord>) {
  return {
    async list(ctx: PlatformContext, query: BusinessObjectListQuery = {}): Promise<TRecord[]> {
      await requireBusinessObjectPermission(ctx, config.permissions.READ)
      const prisma = getBusinessObjectPrisma(ctx)
      const search = containsSearch(query.search, config.searchFields)
      const where = activeWhere(ctx, undefined, query)

      if (search && search.length > 0) {
        where.OR = search
      }

      return config.delegate(prisma).findMany({
        where,
        orderBy: config.orderBy ?? { name: 'asc' },
      })
    },

    async getById(ctx: PlatformContext, id: string): Promise<TRecord> {
      await requireBusinessObjectPermission(ctx, config.permissions.READ)
      const prisma = getBusinessObjectPrisma(ctx)

      return requireRecord(
        await config.delegate(prisma).findFirst({
          where: activeWhere(ctx, id),
        }),
      )
    },

    async create(ctx: PlatformContext, input: TCreate): Promise<TRecord> {
      await requireBusinessObjectPermission(ctx, config.permissions.CREATE)
      const prisma = getBusinessObjectPrisma(ctx)
      const data = await config.createData(input, ctx, prisma)
      const record = await config.delegate(prisma).create({
        data: {
          orgId: ctx.org.id,
          ...omitUndefined(data),
        },
      })

      await emitBusinessObjectEvent(ctx, config.events.CREATED, eventIdentity(config, record))
      return record
    },

    async update(ctx: PlatformContext, id: string, input: TUpdate): Promise<TRecord> {
      await requireBusinessObjectPermission(ctx, config.permissions.UPDATE)
      const prisma = getBusinessObjectPrisma(ctx)
      const delegate = config.delegate(prisma)
      const existing = requireRecord(
        await delegate.findFirst({
          where: activeWhere(ctx, id),
        }),
      )
      const data = omitUndefined(await config.updateData(input, ctx, prisma, id))
      const fields = changedFields(data)

      if (fields.length === 0) {
        return existing
      }

      const record = await delegate.update({
        where: tenantUnique(ctx, id),
        data,
      })

      await emitBusinessObjectEvent(ctx, config.events.UPDATED, {
        ...eventIdentity(config, record),
        changedFields: fields,
      })
      return record
    },

    async softDelete(ctx: PlatformContext, id: string): Promise<TRecord> {
      await requireBusinessObjectPermission(ctx, config.permissions.DELETE)
      const prisma = getBusinessObjectPrisma(ctx)
      const delegate = config.delegate(prisma)

      requireRecord(
        await delegate.findFirst({
          where: activeWhere(ctx, id),
        }),
      )

      const record = await delegate.update({
        where: tenantUnique(ctx, id),
        data: {
          deletedAt: new Date(),
          deletedBy: ctx.user.id,
        },
      })

      await emitBusinessObjectEvent(ctx, config.events.DELETED, eventIdentity(config, record))
      return record
    },

    async restore(ctx: PlatformContext, id: string): Promise<TRecord> {
      await requireBusinessObjectPermission(ctx, config.permissions.RESTORE)
      const prisma = getBusinessObjectPrisma(ctx)
      const delegate = config.delegate(prisma)

      requireRecord(
        await delegate.findFirst({
          where: {
            id,
            orgId: ctx.org.id,
            deletedAt: {
              not: null,
            },
          },
        }),
      )

      const record = await delegate.update({
        where: tenantUnique(ctx, id),
        data: {
          deletedAt: null,
          deletedBy: null,
        },
      })

      await emitBusinessObjectEvent(ctx, config.events.RESTORED, eventIdentity(config, record))
      return record
    },

    async deactivate(ctx: PlatformContext, id: string): Promise<TRecord> {
      if (!config.permissions.DEACTIVATE || !config.events.DEACTIVATED || !config.deactivateData) {
        throw new Error('Deactivate is not available for this Business Object.')
      }

      await requireBusinessObjectPermission(ctx, config.permissions.DEACTIVATE)
      const prisma = getBusinessObjectPrisma(ctx)
      const delegate = config.delegate(prisma)

      requireRecord(
        await delegate.findFirst({
          where: activeWhere(ctx, id),
        }),
      )

      const record = await delegate.update({
        where: tenantUnique(ctx, id),
        data: config.deactivateData,
      })

      await emitBusinessObjectEvent(ctx, config.events.DEACTIVATED, eventIdentity(config, record))
      return record
    },

    async reactivate(ctx: PlatformContext, id: string): Promise<TRecord> {
      if (!config.permissions.REACTIVATE || !config.events.REACTIVATED || !config.reactivateData) {
        throw new Error('Reactivate is not available for this Business Object.')
      }

      await requireBusinessObjectPermission(ctx, config.permissions.REACTIVATE)
      const prisma = getBusinessObjectPrisma(ctx)
      const delegate = config.delegate(prisma)

      requireRecord(
        await delegate.findFirst({
          where: activeWhere(ctx, id),
        }),
      )

      const record = await delegate.update({
        where: tenantUnique(ctx, id),
        data: config.reactivateData,
      })

      await emitBusinessObjectEvent(ctx, config.events.REACTIVATED, eventIdentity(config, record))
      return record
    },
  }
}
