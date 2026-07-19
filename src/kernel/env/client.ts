import { z } from 'zod'
import { appUrlSchema, LOCAL_APP_URL } from './shared'

const clientEnvSchema = z.strictObject({
  NEXT_PUBLIC_APP_URL: appUrlSchema.default(LOCAL_APP_URL),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://your-project.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('your-supabase-anon-key'),
})

export type ClientEnv = z.infer<typeof clientEnvSchema>

export function getClientEnv(): ClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}
