import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { z } from 'zod'
import { appUrlSchema, createBooleanEnvSchema, LOCAL_APP_URL, LOCAL_PRISMA_DATABASE_URL } from '../src/kernel/env/shared'

const envSchema = z.strictObject({
  NEXT_PUBLIC_APP_URL: appUrlSchema.default(LOCAL_APP_URL),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://your-project.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('your-supabase-anon-key'),
  DATABASE_URL: z.string().url().default(LOCAL_PRISMA_DATABASE_URL),
  DIRECT_URL: z.string().url().optional(),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('your-supabase-service-role-key'),
  ONEDAYOS_DEMO_MODE: createBooleanEnvSchema(false),
  ONEDAYOS_PUBLIC_REGISTRATION_ENABLED: createBooleanEnvSchema(true),
  ONEDAYOS_DEMO_RESET_APPROVED: createBooleanEnvSchema(false),
})

function assertNoPublicServerSecrets(): void {
  const envExample = readFileSync(join(process.cwd(), '.env.example'), 'utf8')
  const unsafePublicSecret = /^NEXT_PUBLIC_.*(?:DATABASE|DIRECT|SERVICE_ROLE|SECRET|PRIVATE|TOKEN|KEY)=/m

  if (unsafePublicSecret.test(envExample.replace(/^NEXT_PUBLIC_SUPABASE_ANON_KEY=.*$/m, ''))) {
    throw new Error('Server secrets must not be prefixed with NEXT_PUBLIC_.')
  }
}

function main() {
  envSchema.parse({
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ONEDAYOS_DEMO_MODE: process.env.ONEDAYOS_DEMO_MODE,
    ONEDAYOS_PUBLIC_REGISTRATION_ENABLED: process.env.ONEDAYOS_PUBLIC_REGISTRATION_ENABLED,
    ONEDAYOS_DEMO_RESET_APPROVED: process.env.ONEDAYOS_DEMO_RESET_APPROVED,
  })
  assertNoPublicServerSecrets()
  console.log('Environment contract passed for local Foundation Package 1 verification.')
}

main()
