// @vitest-environment jsdom

import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { RegisterForm } from './register/register-form'
import { getPostLoginHref, LoginForm } from './login/login-form'

const { mockCreateClient, mockGetCurrentUser, mockSignInWithPassword } = vi.hoisted(() => ({
  mockCreateClient: vi.fn(),
  mockGetCurrentUser: vi.fn(),
  mockSignInWithPassword: vi.fn(),
}))

vi.mock('@/sdk/client', () => ({
  sdkClient: {
    auth: {
      createClient: mockCreateClient,
      getCurrentUser: mockGetCurrentUser,
    },
  },
}))

describe('auth forms', () => {
  afterEach(() => {
    vi.restoreAllMocks()
    mockCreateClient.mockReset()
    mockGetCurrentUser.mockReset()
    mockSignInWithPassword.mockReset()
  })

  it('register form does not render hidden orgId', () => {
    const { container } = render(<RegisterForm />)

    expect(container.querySelector('input[name="orgId"]')).toBeNull()
    expect(container.querySelector('input[type="hidden"]')).toBeNull()
  })

  it('register form posts to the Kernel registration route without orgId', async () => {
    const user = userEvent.setup()
    const fetchMock = vi.spyOn(globalThis, 'fetch').mockResolvedValue({
      json: async () => ({ data: { ok: true }, error: null }),
    } as Response)

    render(<RegisterForm />)

    await user.type(screen.getByLabelText(/Organization/i), 'Acme Trading')
    await user.type(screen.getByLabelText(/^Name/i), 'Admin User')
    await user.type(screen.getByLabelText(/Email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/Password/i), 'password-123')
    await user.click(screen.getByRole('button', { name: /Create organization account/i }))

    await waitFor(() => expect(fetchMock).toHaveBeenCalled())
    const [url, init] = fetchMock.mock.calls[0]
    const body = JSON.parse(String((init as RequestInit).body))

    expect(url).toBe('/api/kernel/auth/register')
    expect(body).toEqual({
      orgName: 'Acme Trading',
      name: 'Admin User',
      email: 'admin@example.com',
      password: 'password-123',
    })
    expect(body).not.toHaveProperty('orgId')
  })

  it('register form does not call Supabase signUp directly', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/register/register-form.tsx'), 'utf8')

    expect(source).not.toContain('signUp')
  })

  it('register page has an invite-only demo state without exposing credentials', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/register/page.tsx'), 'utf8')

    expect(source).toContain('Registration is currently invite-only.')
    expect(source).toContain('Use the demo credentials provided by your OneDayOS guide.')
    expect(source).toContain('publicRegistrationEnabled')
    expect(source).not.toContain('ONEDAYOS_DEMO_ADMIN_PASSWORD')
    expect(source).not.toContain('password123')
  })

  it('login page hides the create-account link when public registration is disabled', () => {
    const source = readFileSync(join(process.cwd(), 'src/app/login/page.tsx'), 'utf8')

    expect(source).toContain('publicRegistrationEnabled')
    expect(source).toContain('href="/register"')
    expect(source).toContain('publicRegistrationEnabled ?')
  })

  it('login form uses browser-safe auth and current-user lookup after sign in', async () => {
    const user = userEvent.setup()
    mockSignInWithPassword.mockResolvedValue({ error: null })
    mockCreateClient.mockReturnValue({ auth: { signInWithPassword: mockSignInWithPassword } })
    mockGetCurrentUser.mockResolvedValue({ data: { ok: true }, error: null })

    render(<LoginForm />)

    await user.type(screen.getByLabelText(/Email/i), 'admin@example.com')
    await user.type(screen.getByLabelText(/Password/i), 'password-123')
    await user.click(screen.getByRole('button', { name: /Sign in/i }))

    await waitFor(() => expect(mockGetCurrentUser).toHaveBeenCalled())
    expect(mockSignInWithPassword).toHaveBeenCalledWith({
      email: 'admin@example.com',
      password: 'password-123',
    })
  })

  it('login redirects to the app launcher after current-user lookup', () => {
    expect(getPostLoginHref('acme')).toBe('/acme/apps')
  })

  it('login/current-user code uses auth/me and not arbitrary user id lookup', () => {
    const loginSource = readFileSync(join(process.cwd(), 'src/app/login/login-form.tsx'), 'utf8')
    const sdkClientSource = readFileSync(join(process.cwd(), 'src/sdk/client.ts'), 'utf8')

    expect(loginSource).not.toContain('/api/kernel/users/[id]')
    expect(sdkClientSource).toContain('/api/kernel/auth/me')
    expect(sdkClientSource).not.toContain('/api/kernel/users/[id]')
  })
})
