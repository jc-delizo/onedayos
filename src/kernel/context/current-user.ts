import 'server-only'
import { prisma } from '@/kernel/db/client'
import { apiErrors } from '@/kernel/api/errors'

export async function getCurrentPlatformUser(authUserId: string) {
  return prisma.user.findUnique({
    where: { id: authUserId },
    select: {
      id: true,
      orgId: true,
      name: true,
      email: true,
      isActive: true,
      org: {
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
        },
      },
    },
  })
}

export async function requireCurrentPlatformUser(authUserId: string) {
  const user = await getCurrentPlatformUser(authUserId)

  if (!user) {
    throw apiErrors.unauthenticated('Platform user record was not found.')
  }

  if (!user.isActive) {
    throw apiErrors.userInactive()
  }

  return user
}
