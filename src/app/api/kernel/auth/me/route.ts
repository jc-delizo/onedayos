import type { NextRequest } from 'next/server'
import { apiSuccess } from '@/kernel/api/response'
import { withApiHandler } from '@/kernel/api/route'
import { requireApiAuth } from '@/kernel/auth/api'
import { requireCurrentPlatformUser } from '@/kernel/context/current-user'

export const GET = withApiHandler(async (_request: NextRequest) => {
  const authUser = await requireApiAuth()
  const user = await requireCurrentPlatformUser(authUser.id)

  return apiSuccess({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
    },
    org: {
      id: user.org.id,
      slug: user.org.slug,
      name: user.org.name,
      status: user.org.status,
    },
  })
})
