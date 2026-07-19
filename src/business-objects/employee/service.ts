import 'server-only'
import type { Employee, PrismaClient } from '@prisma/client'
import type { PlatformContext } from '@/sdk'
import { createBusinessObjectService } from '../shared/service-factory'
import { requireSameOrgReference } from '../shared/service-utils'
import { EMPLOYEE_EVENTS } from './events'
import { EMPLOYEE_PERMISSIONS } from './permissions'
import type { CreateEmployeeInput, UpdateEmployeeInput } from './schema'

async function validateEmployeeReferences(
  ctx: PlatformContext,
  prisma: PrismaClient,
  input: Pick<CreateEmployeeInput, 'branchId' | 'departmentId'>,
) {
  if (input.branchId) {
    await requireSameOrgReference(
      prisma.branch.findFirst({
        where: {
          id: input.branchId,
          orgId: ctx.org.id,
          deletedAt: null,
        },
      }),
      'Branch was not found for this organization.',
    )
  }

  if (input.departmentId) {
    await requireSameOrgReference(
      prisma.department.findFirst({
        where: {
          id: input.departmentId,
          orgId: ctx.org.id,
          deletedAt: null,
        },
      }),
      'Department was not found for this organization.',
    )
  }
}

export const EmployeeService = createBusinessObjectService<CreateEmployeeInput, UpdateEmployeeInput, Employee>({
  delegate: (prisma) => prisma.employee,
  permissions: EMPLOYEE_PERMISSIONS,
  events: EMPLOYEE_EVENTS,
  eventIdField: 'employeeId',
  searchFields: ['employeeNo', 'name', 'email', 'phone', 'position'],
  orderBy: { name: 'asc' },
  async createData(input, ctx, prisma) {
    await validateEmployeeReferences(ctx, prisma, input)

    return {
      employeeNo: input.employeeNo,
      name: input.name,
      email: input.email,
      phone: input.phone,
      branchId: input.branchId,
      departmentId: input.departmentId,
      position: input.position,
      employmentType: input.employmentType,
      employmentStatus: input.employmentStatus ?? 'active',
      hiredAt: input.hiredAt,
      endedAt: input.endedAt,
    }
  },
  async updateData(input, ctx, prisma) {
    await validateEmployeeReferences(ctx, prisma, input)

    return {
      employeeNo: input.employeeNo,
      name: input.name,
      email: input.email,
      phone: input.phone,
      branchId: input.branchId,
      departmentId: input.departmentId,
      position: input.position,
      employmentType: input.employmentType,
      employmentStatus: input.employmentStatus,
      hiredAt: input.hiredAt,
      endedAt: input.endedAt,
    }
  },
  deactivateData: {
    employmentStatus: 'inactive',
  },
  reactivateData: {
    employmentStatus: 'active',
  },
})
