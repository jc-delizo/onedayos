import 'server-only'
import type { User as SupabaseUser } from '@supabase/supabase-js'
import type { PermissionGrant, PlatformContext } from '@/sdk'
import { apiErrors } from '@/kernel/api/errors'
import { prisma } from '@/kernel/db/client'
import { requireApiAuth } from '@/kernel/auth/api'
import { markPlatformContext } from './platform-context'

type ContextOptions = {
  requestId?: string
  moduleId?: string
  authUser?: SupabaseUser
}

function toSubscriptionStatus(status: string | undefined): PlatformContext['org']['subscriptionStatus'] {
  if (status === 'ACTIVE' || status === 'SUSPENDED' || status === 'CANCELLED' || status === 'TRIAL') {
    return status
  }

  return 'TRIAL'
}

export async function requireApiOrgContext(
  orgSlug: string,
  options: ContextOptions = {},
): Promise<PlatformContext> {
  const authUser = options.authUser ?? (await requireApiAuth())

  const user = await prisma.user.findUnique({
    where: { id: authUser.id },
    select: {
      id: true,
      orgId: true,
      name: true,
      email: true,
      isActive: true,
    },
  })

  if (!user) {
    throw apiErrors.unauthenticated('Platform user record was not found.')
  }

  if (!user.isActive) {
    throw apiErrors.userInactive()
  }

  const org = await prisma.organization.findUnique({
    where: { slug: orgSlug },
    select: {
      id: true,
      slug: true,
      name: true,
      status: true,
      isActive: true,
      subscription: {
        select: {
          status: true,
          plan: true,
        },
      },
      modules: {
        where: {
          isEnabled: true,
        },
        select: {
          moduleId: true,
        },
      },
    },
  })

  if (!org || user.orgId !== org.id) {
    throw apiErrors.orgNotFound()
  }

  if (!org.isActive || org.status === 'SUSPENDED' || org.status === 'CANCELLED') {
    throw apiErrors.orgSuspended()
  }

  const enabledModules = org.modules.map((module) => module.moduleId)

  if (options.moduleId && options.moduleId !== 'kernel' && !enabledModules.includes(options.moduleId)) {
    throw apiErrors.moduleDisabled()
  }

  const userRoles = await prisma.userRole.findMany({
    where: {
      orgId: org.id,
      userId: user.id,
    },
    select: {
      role: {
        select: {
          id: true,
          name: true,
          isSystem: true,
          isActive: true,
          permissions: {
            where: {
              orgId: org.id,
            },
            select: {
              id: true,
              roleId: true,
              orgId: true,
              module: true,
              resource: true,
              action: true,
              conditions: true,
            },
          },
        },
      },
    },
  })

  const activeRoles = userRoles.map((assignment) => assignment.role).filter((role) => role.isActive)
  const permissions: PermissionGrant[] = activeRoles.flatMap((role) => role.permissions)

  return markPlatformContext({
    requestId: options.requestId ?? crypto.randomUUID(),
    auth: {
      provider: 'supabase',
      userId: authUser.id,
      email: authUser.email ?? null,
    },
    user: {
      id: user.id,
      orgId: user.orgId,
      name: user.name,
      email: user.email,
      isActive: user.isActive,
    },
    org: {
      id: org.id,
      slug: org.slug,
      name: org.name,
      isActive: org.isActive,
      status: org.status,
      subscriptionStatus: toSubscriptionStatus(org.subscription?.status),
      plan: org.subscription?.plan ?? 'foundation',
    },
    roles: activeRoles.map((role) => ({
      id: role.id,
      name: role.name,
      isSystem: role.isSystem,
    })),
    permissions,
    enabledModules,
  })
}

export async function requireApiModuleContext(
  orgSlug: string,
  moduleId: string,
  options: Omit<ContextOptions, 'moduleId'> = {},
): Promise<PlatformContext> {
  return requireApiOrgContext(orgSlug, {
    ...options,
    moduleId,
  })
}
