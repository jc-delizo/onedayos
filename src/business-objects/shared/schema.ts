import { z } from 'zod'

const emptyToUndefined = (value: unknown) => (value === '' ? undefined : value)

export const requiredText = (max = 160) => z.string().trim().min(1).max(max)

export const optionalText = (max = 500) =>
  z.preprocess(emptyToUndefined, z.string().trim().max(max).optional())

export const optionalEmail = z.preprocess(emptyToUndefined, z.email().optional())

export const optionalDate = z.preprocess(emptyToUndefined, z.coerce.date().optional())

export const idParamSchema = z.strictObject({
  id: requiredText(128),
})

export const listQuerySchema = z.strictObject({
  search: optionalText(120),
})

export type BusinessObjectListQuery = z.infer<typeof listQuerySchema>

export function requireUpdateInput<T extends Record<string, unknown>>(input: T): T {
  if (!Object.values(input).some((value) => value !== undefined)) {
    throw new Error('At least one field is required.')
  }

  return input
}
