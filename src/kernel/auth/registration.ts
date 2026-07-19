import 'server-only'
import { z } from 'zod'
import { apiErrors } from '@/kernel/api/errors'
import { createSupabaseAdminClient } from './admin'
import { prisma } from '@/kernel/db/client'

export const registerInputSchema = z.strictObject({
  orgName: z.string().trim().min(2).max(120),
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(254).transform((value) => value.toLowerCase()),
  password: z.string().min(8).max(128),
})

export type RegisterInput = z.infer<typeof registerInputSchema>

type CreatedAuthUser = {
  id: string
  email?: string | null
}

type SupabaseAdminRegistrationClient = {
  auth: {
    admin: {
      createUser(input: {
        email: string
        password: string
        email_confirm: boolean
        user_metadata: { name: string; organizationName: string }
      }): Promise<{ data: { user: CreatedAuthUser | null }; error: Error | null }>
      deleteUser(userId: string): Promise<{ error: Error | null }>
    }
  }
}

type RegistrationTx = {
  organization: {
    create(args: {
      data: {
        name: string
        slug: string
        subscription: { create: { plan: string; status: 'TRIAL' } }
      }
    }): Promise<{ id: string; slug: string; name: string }>
  }
  user: {
    create(args: {
      data: {
        id: string
        orgId: string
        name: string
        email: string
      }
    }): Promise<{ id: string; name: string; email: string }>
  }
  role: {
    create(args: {
      data: {
        orgId: string
        name: string
        description: string
        isSystem: boolean
      }
    }): Promise<{ id: string; name: string }>
  }
  permission: {
    create(args: {
      data: {
        orgId: string
        roleId: string
        module: string
        resource: string
        action: string
        conditions: null
      }
    }): Promise<{ id: string; module: string; resource: string; action: string }>
  }
  userRole: {
    create(args: {
      data: {
        orgId: string
        userId: string
        roleId: string
        createdBy: string
      }
    }): Promise<unknown>
  }
}

type RegistrationDb = {
  $transaction<T>(callback: (tx: RegistrationTx) => Promise<T>): Promise<T>
}

export type RegistrationDeps = {
  admin: SupabaseAdminRegistrationClient
  db: RegistrationDb
  slugSuffix?: () => string
}

export type RegistrationResult = {
  user: {
    id: string
    name: string
    email: string
  }
  org: {
    id: string
    slug: string
    name: string
  }
  role: {
    id: string
    name: string
  }
  permission: {
    module: string
    resource: string
    action: string
  }
}

function slugify(value: string): string {
  const slug = value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64)

  return slug || 'organization'
}

function defaultDeps(): RegistrationDeps {
  return {
    admin: createSupabaseAdminClient(),
    db: prisma as unknown as RegistrationDb,
    slugSuffix: () => Math.random().toString(36).slice(2, 8),
  }
}

export async function registerFoundationAccount(
  input: RegisterInput,
  deps: RegistrationDeps = defaultDeps(),
): Promise<RegistrationResult> {
  const authResult = await deps.admin.auth.admin.createUser({
    email: input.email,
    password: input.password,
    email_confirm: true,
    user_metadata: {
      name: input.name,
      organizationName: input.orgName,
    },
  })

  const authUser = authResult.data.user

  if (authResult.error || !authUser) {
    throw apiErrors.badRequest('Registration could not be completed.')
  }

  const slug = `${slugify(input.orgName)}-${deps.slugSuffix?.()}`

  try {
    return await deps.db.$transaction(async (tx) => {
      const org = await tx.organization.create({
        data: {
          name: input.orgName,
          slug,
          subscription: {
            create: {
              plan: 'foundation',
              status: 'TRIAL',
            },
          },
        },
      })

      const user = await tx.user.create({
        data: {
          id: authUser.id,
          orgId: org.id,
          name: input.name,
          email: input.email,
        },
      })

      const role = await tx.role.create({
        data: {
          orgId: org.id,
          name: 'Admin',
          description: 'Full administrative access within this organization.',
          isSystem: true,
        },
      })

      const permission = await tx.permission.create({
        data: {
          orgId: org.id,
          roleId: role.id,
          module: '*',
          resource: '*',
          action: '*',
          conditions: null,
        },
      })

      await tx.userRole.create({
        data: {
          orgId: org.id,
          userId: user.id,
          roleId: role.id,
          createdBy: user.id,
        },
      })

      return {
        user,
        org,
        role,
        permission: {
          module: permission.module,
          resource: permission.resource,
          action: permission.action,
        },
      }
    })
  } catch (error) {
    const rollback = await deps.admin.auth.admin.deleteUser(authUser.id)

    if (rollback.error) {
      console.error('Failed to roll back Supabase Auth user after registration failure', {
        authUserId: authUser.id,
        error: rollback.error,
      })
    }

    console.error('Registration transaction failed', { error })
    throw apiErrors.internal('Registration could not be completed. Please try again.')
  }
}
