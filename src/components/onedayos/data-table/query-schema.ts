import { z } from 'zod'

const emptyToUndefined = (value: unknown) => value === '' ? undefined : value

export const tableSearchSchema = z.preprocess(
  emptyToUndefined,
  z.string().trim().max(120).transform((value) => value.replace(/\s+/g, ' ')).optional(),
)

export function createTableQuerySchema<
  TSort extends readonly [string, ...string[]],
  TFilters extends z.ZodRawShape,
>(sortFields: TSort, filters: TFilters) {
  return z.strictObject({
    q: tableSearchSchema,
    search: tableSearchSchema,
    page: z.coerce.number().int().min(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(100).default(25),
    sort: z.enum(sortFields).optional(),
    direction: z.enum(['asc', 'desc']).default('asc'),
    ...filters,
  })
}
