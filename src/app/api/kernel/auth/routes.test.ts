import { existsSync } from 'node:fs'
import { join } from 'node:path'
import { afterEach, describe, expect, it, vi } from 'vitest'

const { mockGetDemoRuntimeConfig, mockRegisterFoundationAccount } = vi.hoisted(() => ({
  mockGetDemoRuntimeConfig: vi.fn(),
  mockRegisterFoundationAccount: vi.fn(),
}))

vi.mock('@/kernel/env/server', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/kernel/env/server')>()),
  getDemoRuntimeConfig: mockGetDemoRuntimeConfig,
}))

vi.mock('@/kernel/auth/registration', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/kernel/auth/registration')>()

  return {
    ...actual,
    registerFoundationAccount: mockRegisterFoundationAccount,
  }
})

describe('Kernel auth route structure', () => {
  afterEach(() => {
    mockGetDemoRuntimeConfig.mockReset()
    mockRegisterFoundationAccount.mockReset()
  })

  it('does not implement arbitrary current-user lookup by id', () => {
    expect(existsSync(join(process.cwd(), 'src/app/api/kernel/users/[id]/route.ts'))).toBe(false)
    expect(existsSync(join(process.cwd(), 'src/app/api/kernel/users'))).toBe(false)
  })

  it('returns JSON 403 and does not create accounts when public registration is disabled', async () => {
    mockGetDemoRuntimeConfig.mockReturnValue({ demoMode: true, publicRegistrationEnabled: false })
    mockRegisterFoundationAccount.mockResolvedValue({})
    const { POST } = await import('./register/route')

    const response = await POST(
      new Request('http://localhost:1320/api/kernel/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          orgName: 'Acme Trading',
          name: 'Admin User',
          email: 'admin@example.test',
          password: 'not-a-secret-for-test',
        }),
      }) as never,
    )
    const payload = await response.json()

    expect(response.status).toBe(403)
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(payload.error.code).toBe('REGISTRATION_DISABLED')
    expect(mockRegisterFoundationAccount).not.toHaveBeenCalled()
  })
})
