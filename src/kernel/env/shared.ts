import { z } from 'zod'

export const LOCAL_PRISMA_DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:54322/onedayos?schema=public'

export const LOCAL_APP_URL = 'http://localhost:1320'

export function isPlaceholderValue(value: string | undefined): boolean {
  if (!value) return true

  return [
    'your-project',
    'your-supabase-anon-key',
    'your-supabase-service-role-key',
    'postgres:postgres@127.0.0.1:54322',
  ].some((placeholder) => value.includes(placeholder))
}

export const appUrlSchema = z
  .string()
  .url()
  .refine((value) => value !== 'http://localhost:3000', {
    message: 'OneDayOS local app URL must use port 1320.',
  })

export function createBooleanEnvSchema(defaultValue: boolean) {
  return z
    .preprocess((value) => (value === undefined ? String(defaultValue) : value), z.enum(['true', 'false']))
    .transform((value) => value === 'true')
}

export const booleanEnvSchema = createBooleanEnvSchema(false)
