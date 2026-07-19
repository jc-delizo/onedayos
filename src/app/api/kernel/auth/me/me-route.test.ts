import { describe, expect, it, vi } from 'vitest'
import { apiErrors } from '@/kernel/api/errors'

vi.mock('@/kernel/auth/api', () => ({
  requireApiAuth: vi.fn(),
}))

vi.mock('@/kernel/context/current-user', () => ({
  requireCurrentPlatformUser: vi.fn(),
}))

describe('/api/kernel/auth/me', () => {
  it('returns JSON 401 without redirect when unauthenticated', async () => {
    const { requireApiAuth } = await import('@/kernel/auth/api')
    vi.mocked(requireApiAuth).mockRejectedValueOnce(apiErrors.unauthenticated())

    const { GET } = await import('./route')
    const response = await GET(new Request('http://localhost:1320/api/kernel/auth/me') as never)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(response.headers.get('location')).toBeNull()
    expect(payload.error.code).toBe('UNAUTHENTICATED')
  })

  it('derives current user from session auth user, not from a route parameter', async () => {
    const { requireApiAuth } = await import('@/kernel/auth/api')
    const { requireCurrentPlatformUser } = await import('@/kernel/context/current-user')
    vi.mocked(requireApiAuth).mockResolvedValueOnce({ id: 'auth_a', email: 'admin@example.com' } as never)
    vi.mocked(requireCurrentPlatformUser).mockResolvedValueOnce({
      id: 'auth_a',
      name: 'Admin User',
      email: 'admin@example.com',
      org: {
        id: 'org_a',
        slug: 'acme',
        name: 'Acme',
        status: 'ACTIVE',
      },
    } as never)

    const { GET } = await import('./route')
    const response = await GET(new Request('http://localhost:1320/api/kernel/auth/me?userId=other') as never)
    const payload = await response.json()

    expect(requireCurrentPlatformUser).toHaveBeenCalledWith('auth_a')
    expect(response.status).toBe(200)
    expect(payload).toEqual({
      data: {
        user: {
          id: 'auth_a',
          name: 'Admin User',
          email: 'admin@example.com',
        },
        org: {
          id: 'org_a',
          slug: 'acme',
          name: 'Acme',
          status: 'ACTIVE',
        },
      },
      error: null,
    })
  })
})
