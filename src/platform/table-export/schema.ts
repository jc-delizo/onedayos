import { z } from 'zod'

export const MAX_FILTERED_EXPORT_ROWS = 10_000
export const MAX_SELECTED_EXPORT_IDS = 1_000
export const EXPORT_BATCH_SIZE = 100

const idSchema = z.string().trim().min(1).max(128)

export function createTableExportRequestSchema<TQuery extends z.ZodType>(
  querySchema: TQuery,
  allowedColumns: readonly [string, ...string[]],
) {
  return z.strictObject({
    format: z.enum(['csv', 'xlsx']),
    scope: z.enum(['selected', 'filtered']),
    selectedIds: z.array(idSchema).max(MAX_SELECTED_EXPORT_IDS).optional(),
    columns: z.array(z.enum(allowedColumns)).min(1).optional(),
    query: querySchema,
  }).superRefine((input, ctx) => {
    if (input.scope === 'selected' && (!input.selectedIds || input.selectedIds.length === 0)) {
      ctx.addIssue({
        code: 'custom',
        path: ['selectedIds'],
        message: 'Select at least one row to export.',
      })
    }
    if (input.scope === 'filtered' && input.selectedIds !== undefined) {
      ctx.addIssue({
        code: 'custom',
        path: ['selectedIds'],
        message: 'Filtered exports must not include selected IDs.',
      })
    }
  }).transform((input) => ({
    ...input,
    selectedIds: input.selectedIds ? [...new Set(input.selectedIds)] : undefined,
  }))
}
