import 'server-only'
import type { PrismaClient } from '@prisma/client'
import { createTableQuerySchema } from '@/components/onedayos/data-table/query-schema'
import type { DataTablePageMeta } from '@/components/onedayos'
import { requireOrganizationAdmin } from '@/platform/organization-admin'
import type { PlatformContext } from '@/sdk'
import { sdk } from '@/sdk/server'

export const organizationTableQuerySchema = createTableQuerySchema(
  ['name', 'code', 'employeeNo'],
  {},
)

export type OrganizationTableQuery = ReturnType<typeof organizationTableQuerySchema.parse>

export type OrganizationUserRow = {
  id: string
  name: string
  email: string
  isActive: boolean
  roleNames: string[]
}

export type OrganizationEmployeeRow = {
  id: string
  employeeNo: string
  name: string
  email: string | null
  employmentStatus: string
  userId: string | null
  branchName: string | null
  departmentName: string | null
}

export type OrganizationStructureRow = {
  id: string
  code: string | null
  name: string
  isActive: boolean
  branchName?: string | null
}

type Page<T> = { rows: T[]; meta: DataTablePageMeta }

function meta(query: OrganizationTableQuery, total: number): DataTablePageMeta {
  return {
    page: query.page,
    pageSize: query.pageSize,
    total,
    totalPages: Math.ceil(total / query.pageSize),
  }
}

function pagination(query: OrganizationTableQuery) {
  return {
    skip: (query.page - 1) * query.pageSize,
    take: query.pageSize,
  }
}

function search(value: string | undefined, fields: string[]) {
  return value
    ? fields.map((field) => ({ [field]: { contains: value, mode: 'insensitive' } }))
    : undefined
}

function orderBy(query: OrganizationTableQuery, allowed: string[]) {
  const field = query.sort && allowed.includes(query.sort) ? query.sort : 'name'
  const direction = query.sort ? query.direction : 'asc'
  return [{ [field]: direction }, { id: 'asc' }]
}

export class OrganizationTableService {
  static async listPeople(
    ctx: PlatformContext,
    query: OrganizationTableQuery,
  ): Promise<{ users: Page<OrganizationUserRow>; employees: Page<OrganizationEmployeeRow> }> {
    requireOrganizationAdmin(ctx)
    const prisma = sdk.getDb(ctx).prisma as PrismaClient
    const term = query.q ?? query.search
    const userWhere = {
      orgId: ctx.org.id,
      deletedAt: null,
      ...(term ? { OR: search(term, ['name', 'email']) } : {}),
    }
    const employeeWhere = {
      orgId: ctx.org.id,
      deletedAt: null,
      ...(term ? { OR: search(term, ['employeeNo', 'name', 'email', 'position']) } : {}),
    }
    const [users, userTotal, employees, employeeTotal] = await Promise.all([
      prisma.user.findMany({
        where: userWhere,
        orderBy: orderBy(query, ['name']) as never,
        ...pagination(query),
        select: {
          id: true,
          name: true,
          email: true,
          isActive: true,
          roles: { select: { role: { select: { name: true } } } },
        },
      }),
      prisma.user.count({ where: userWhere }),
      prisma.employee.findMany({
        where: employeeWhere,
        orderBy: orderBy(query, ['name', 'employeeNo']) as never,
        ...pagination(query),
        select: {
          id: true,
          employeeNo: true,
          name: true,
          email: true,
          employmentStatus: true,
          userId: true,
          branch: { select: { name: true } },
          department: { select: { name: true } },
        },
      }),
      prisma.employee.count({ where: employeeWhere }),
    ])

    return {
      users: {
        rows: users.map((row) => ({
          id: row.id,
          name: row.name,
          email: row.email,
          isActive: row.isActive,
          roleNames: row.roles.map((assignment) => assignment.role.name),
        })),
        meta: meta(query, userTotal),
      },
      employees: {
        rows: employees.map((row) => ({
          id: row.id,
          employeeNo: row.employeeNo,
          name: row.name,
          email: row.email,
          employmentStatus: row.employmentStatus,
          userId: row.userId,
          branchName: row.branch?.name ?? null,
          departmentName: row.department?.name ?? null,
        })),
        meta: meta(query, employeeTotal),
      },
    }
  }

  static async listStructure(
    ctx: PlatformContext,
    query: OrganizationTableQuery,
  ): Promise<{ branches: Page<OrganizationStructureRow>; departments: Page<OrganizationStructureRow> }> {
    requireOrganizationAdmin(ctx)
    const prisma = sdk.getDb(ctx).prisma as PrismaClient
    const term = query.q ?? query.search
    const branchWhere = {
      orgId: ctx.org.id,
      deletedAt: null,
      ...(term ? { OR: search(term, ['code', 'name']) } : {}),
    }
    const departmentWhere = {
      orgId: ctx.org.id,
      deletedAt: null,
      ...(term ? { OR: search(term, ['code', 'name']) } : {}),
    }
    const [branches, branchTotal, departments, departmentTotal] = await Promise.all([
      prisma.branch.findMany({
        where: branchWhere,
        orderBy: orderBy(query, ['name', 'code']) as never,
        ...pagination(query),
        select: { id: true, code: true, name: true, isActive: true },
      }),
      prisma.branch.count({ where: branchWhere }),
      prisma.department.findMany({
        where: departmentWhere,
        orderBy: orderBy(query, ['name', 'code']) as never,
        ...pagination(query),
        select: {
          id: true,
          code: true,
          name: true,
          isActive: true,
          branch: { select: { name: true } },
        },
      }),
      prisma.department.count({ where: departmentWhere }),
    ])

    return {
      branches: { rows: branches, meta: meta(query, branchTotal) },
      departments: {
        rows: departments.map((row) => ({ ...row, branchName: row.branch?.name ?? null })),
        meta: meta(query, departmentTotal),
      },
    }
  }
}
