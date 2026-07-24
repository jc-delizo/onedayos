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

type BusinessObjectListQueryInput = Partial<BusinessObjectListQuery>

type Delegate<TRecord> = {
  findMany(args: any): Promise<TRecord[]>
  findFirst(args: any): Promise<TRecord | null>
  count(args: any): Promise<number>
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
  listArgs?: Record<string, unknown>
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

function activeWhere(ctx: PlatformContext, id?: string) {
  const where: Record<string, unknown> = {
    orgId: ctx.org.id,
    deletedAt: null,
  }

  if (id) {
    where.id = id
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
  function listWhere(ctx: PlatformContext, query: BusinessObjectListQueryInput) {
    const extended = query as BusinessObjectListQueryInput & {
      categoryId?: string
      isActive?: boolean
      branchId?: string
      departmentId?: string
      employmentStatus?: string
    }
    const where = activeWhere(ctx)
    const search = containsSearch(query.q ?? query.search, config.searchFields)
    if (search?.length) where.OR = search
    if (extended.categoryId) where.categoryId = extended.categoryId
    if (extended.isActive !== undefined) where.isActive = extended.isActive
    if (extended.branchId) where.branchId = extended.branchId
    if (extended.departmentId) where.departmentId = extended.departmentId
    if (extended.employmentStatus) where.employmentStatus = extended.employmentStatus
    return where
  }

  function listOrderBy(query: BusinessObjectListQueryInput) {
    const safeSort = ['name', 'code', 'employeeNo', 'updatedAt'].includes(query.sort ?? '')
      ? query.sort
      : undefined
    return [
      safeSort ? { [safeSort]: query.direction ?? 'asc' } : (config.orderBy ?? { name: 'asc' }),
      { id: 'asc' },
    ]
  }

  return {
    async list(ctx: PlatformContext, query: BusinessObjectListQueryInput = {}): Promise<TRecord[]> {
      await requireBusinessObjectPermission(ctx, config.permissions.READ)
      const prisma = getBusinessObjectPrisma(ctx)
      const where = listWhere(ctx, query)

      return config.delegate(prisma).findMany({
        ...config.listArgs,
        where,
        orderBy: listOrderBy(query),
        ...(query.page && query.pageSize
          ? { skip: (query.page - 1) * query.pageSize, take: query.pageSize }
          : {}),
      })
    },

    async listPage(ctx: PlatformContext, query: BusinessObjectListQuery) {
      await requireBusinessObjectPermission(ctx, config.permissions.READ)
      const delegate = config.delegate(getBusinessObjectPrisma(ctx))
      const where = listWhere(ctx, query)
      const [rows, total] = await Promise.all([
        delegate.findMany({
          ...config.listArgs,
          where,
          orderBy: listOrderBy(query),
          skip: (query.page - 1) * query.pageSize,
          take: query.pageSize,
        }),
        delegate.count({ where }),
      ])
      return {
        rows,
        meta: {
          page: query.page,
          pageSize: query.pageSize,
          total,
          totalPages: Math.ceil(total / query.pageSize),
        },
      }
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
