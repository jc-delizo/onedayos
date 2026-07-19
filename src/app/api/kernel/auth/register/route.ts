import type { NextRequest } from 'next/server'
import { apiCreated } from '@/kernel/api/response'
import { withApiHandler } from '@/kernel/api/route'
import { apiErrors } from '@/kernel/api/errors'
import { parseStrictJsonBody } from '@/kernel/api/json'
import { registerFoundationAccount, registerInputSchema } from '@/kernel/auth/registration'
import { getDemoRuntimeConfig } from '@/kernel/env/server'

export const POST = withApiHandler(async (request: NextRequest) => {
  if (!getDemoRuntimeConfig().publicRegistrationEnabled) {
    throw apiErrors.registrationDisabled()
  }

  const input = await parseStrictJsonBody(request, registerInputSchema)
  const result = await registerFoundationAccount(input)

  return apiCreated({
    user: result.user,
    org: result.org,
    role: result.role,
    permission: result.permission,
  })
})
