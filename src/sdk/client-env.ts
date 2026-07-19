import { z } from 'zod'

const clientEnvSchema = z.strictObject({
  NEXT_PUBLIC_APP_URL: z
    .string()
    .url()
    .default('http://localhost:1320')
    .refine((value) => value !== 'http://localhost:3000', {
      message: 'OneDayOS local app URL must use port 1320.',
    }),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://your-project.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('your-supabase-anon-key'),
})

export type SdkClientEnv = z.infer<typeof clientEnvSchema>

export function getSdkClientEnv(): SdkClientEnv {
  return clientEnvSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  })
}
