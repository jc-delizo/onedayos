import { afterEach, describe, expect, it, vi } from 'vitest'
import { getServerEnv } from './server'

describe('server env validation', () => {
  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('does not allow placeholder production runtime secrets', () => {
    vi.stubEnv('NODE_ENV', 'production')
    vi.stubEnv('NEXT_PHASE', '')
    vi.stubEnv('npm_lifecycle_event', '')
    vi.stubEnv('DATABASE_URL', 'postgresql://postgres:postgres@127.0.0.1:54322/onedayos?schema=public')
    vi.stubEnv('SUPABASE_SECRET_KEY', '')
    vi.stubEnv('SUPABASE_SERVICE_ROLE_KEY', 'your-supabase-service-role-key')

    expect(() => getServerEnv({ allowPlaceholders: false })).toThrow('Production server environment')
  })

  it('parses demo runtime flags as booleans with safe defaults', () => {
    const previousDemoMode = process.env.ONEDAYOS_DEMO_MODE
    const previousRegistration = process.env.ONEDAYOS_PUBLIC_REGISTRATION_ENABLED
    const previousReset = process.env.ONEDAYOS_DEMO_RESET_APPROVED
    const previousInventoryV2 = process.env.ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED

    delete process.env.ONEDAYOS_DEMO_MODE
    delete process.env.ONEDAYOS_PUBLIC_REGISTRATION_ENABLED
    delete process.env.ONEDAYOS_DEMO_RESET_APPROVED
    delete process.env.ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED

    const defaultEnv = getServerEnv()

    expect(defaultEnv.ONEDAYOS_DEMO_MODE).toBe(false)
    expect(defaultEnv.ONEDAYOS_PUBLIC_REGISTRATION_ENABLED).toBe(true)
    expect(defaultEnv.ONEDAYOS_DEMO_RESET_APPROVED).toBe(false)
    expect(defaultEnv.ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED).toBe(false)

    if (previousDemoMode === undefined) delete process.env.ONEDAYOS_DEMO_MODE
    else process.env.ONEDAYOS_DEMO_MODE = previousDemoMode
    if (previousRegistration === undefined) delete process.env.ONEDAYOS_PUBLIC_REGISTRATION_ENABLED
    else process.env.ONEDAYOS_PUBLIC_REGISTRATION_ENABLED = previousRegistration
    if (previousReset === undefined) delete process.env.ONEDAYOS_DEMO_RESET_APPROVED
    else process.env.ONEDAYOS_DEMO_RESET_APPROVED = previousReset
    if (previousInventoryV2 === undefined) delete process.env.ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED
    else process.env.ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED = previousInventoryV2

    vi.stubEnv('ONEDAYOS_DEMO_MODE', 'true')
    vi.stubEnv('ONEDAYOS_PUBLIC_REGISTRATION_ENABLED', 'false')
    vi.stubEnv('ONEDAYOS_DEMO_RESET_APPROVED', 'true')
    vi.stubEnv('ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED', 'true')

    const demoEnv = getServerEnv()

    expect(demoEnv.ONEDAYOS_DEMO_MODE).toBe(true)
    expect(demoEnv.ONEDAYOS_PUBLIC_REGISTRATION_ENABLED).toBe(false)
    expect(demoEnv.ONEDAYOS_DEMO_RESET_APPROVED).toBe(true)
    expect(demoEnv.ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED).toBe(true)
  })
})
