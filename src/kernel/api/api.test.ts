import { describe, expect, it } from 'vitest'
import { z } from 'zod'
import { apiErrors } from './errors'
import { parseStrictJsonBody, parseStrictSearchParams } from './json'
import { withApiHandler } from './route'
import { apiSuccess } from './response'

describe('API contract', () => {
  it('returns unauthenticated API failures as JSON 401 without redirect', async () => {
    const handler = withApiHandler(async () => {
      throw apiErrors.unauthenticated()
    })

    const response = await handler(new Request('http://localhost:1320/api/example') as never)
    const payload = await response.json()

    expect(response.status).toBe(401)
    expect(response.headers.get('location')).toBeNull()
    expect(response.headers.get('content-type')).toContain('application/json')
    expect(payload).toEqual({
      data: null,
      error: expect.objectContaining({
        code: 'UNAUTHENTICATED',
        message: 'Authentication required.',
      }),
    })
  })

  it('keeps the success envelope stable', async () => {
    const response = apiSuccess({ ok: true })
    await expect(response.json()).resolves.toEqual({
      data: { ok: true },
      error: null,
    })
  })

  it('rejects client-supplied tenant identity before service code sees it', async () => {
    const request = new Request('http://localhost:1320/api/example', {
      method: 'POST',
      body: JSON.stringify({ orgId: 'org_a', name: 'unsafe' }),
    })

    await expect(parseStrictJsonBody(request, z.strictObject({ name: z.string() }))).rejects.toMatchObject({
      code: 'TENANT_ID_NOT_ALLOWED',
      status: 400,
    })
  })

  it('maps strict Zod validation failures to VALIDATION_ERROR', async () => {
    const request = new Request('http://localhost:1320/api/example', {
      method: 'POST',
      body: JSON.stringify({ name: 'Acme', unexpected: true }),
    })

    await expect(parseStrictJsonBody(request, z.strictObject({ name: z.string() }))).rejects.toMatchObject({
      code: 'VALIDATION_ERROR',
      status: 400,
    })
  })

  it('maps strict query validation failures to VALIDATION_ERROR', () => {
    try {
      parseStrictSearchParams(
        new URLSearchParams([
          ['page', '1'],
          ['unexpected', 'true'],
        ]),
        z.strictObject({ page: z.coerce.number().int().min(1).default(1) }),
      )
      throw new Error('Expected query validation to fail.')
    } catch (error) {
      expect(error).toMatchObject({ code: 'VALIDATION_ERROR', status: 400 })
    }
  })

  it('rejects tenant identity in query strings', () => {
    try {
      parseStrictSearchParams(
        new URLSearchParams([
          ['orgId', 'org_a'],
          ['page', '1'],
        ]),
        z.strictObject({ page: z.coerce.number().int().min(1).default(1) }),
      )
      throw new Error('Expected tenant query identity to fail.')
    } catch (error) {
      expect(error).toMatchObject({ code: 'TENANT_ID_NOT_ALLOWED', status: 400 })
    }
  })

  it('maps invalid or missing JSON body to BAD_REQUEST, not INTERNAL_ERROR', async () => {
    const request = new Request('http://localhost:1320/api/example', {
      method: 'POST',
      body: '',
    })

    await expect(parseStrictJsonBody(request, z.strictObject({ name: z.string() }))).rejects.toMatchObject({
      code: 'BAD_REQUEST',
      status: 400,
    })
  })
})
