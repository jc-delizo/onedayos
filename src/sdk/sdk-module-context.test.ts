import { describe, expect, it, vi } from 'vitest'
import { apiErrors } from '@/kernel/api/errors'

const { mockRequireApiModuleContext } = vi.hoisted(() => ({
  mockRequireApiModuleContext: vi.fn(),
}))

vi.mock('@/kernel/context/api-org-context', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/kernel/context/api-org-context')>()

  return {
    ...actual,
    requireApiModuleContext: mockRequireApiModuleContext,
  }
})

describe('SDK module context helpers', () => {
  it('hide disabled modules as safe module not found responses for generated APIs', async () => {
    const { sdk } = await import('./server')
    mockRequireApiModuleContext.mockRejectedValueOnce(apiErrors.moduleDisabled())

    await expect(sdk.auth.requireApiModuleContext({} as never, 'acme', 'sample-module')).rejects.toMatchObject({
      code: 'MODULE_NOT_FOUND',
      status: 404,
    })
  }, 30000)
})
