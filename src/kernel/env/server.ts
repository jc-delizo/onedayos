import 'server-only'
import { z } from 'zod'
import { appUrlSchema, createBooleanEnvSchema, isPlaceholderValue, LOCAL_APP_URL, LOCAL_PRISMA_DATABASE_URL } from './shared'
import { resolveSupabaseAdminApiKey } from './supabase-admin-key'

const serverEnvSchema = z.strictObject({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  NEXT_PHASE: z.string().optional(),
  NEXT_PUBLIC_APP_URL: appUrlSchema.default(LOCAL_APP_URL),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().default('https://your-project.supabase.co'),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1).default('your-supabase-anon-key'),
  DATABASE_URL: z.string().url().default(LOCAL_PRISMA_DATABASE_URL),
  DIRECT_URL: z.string().url().optional(),
  SUPABASE_SECRET_KEY: z.preprocess((value) => value === '' ? undefined : value, z.string().min(1).optional()),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).default('your-supabase-service-role-key'),
  ONEDAYOS_DEMO_MODE: createBooleanEnvSchema(false),
  ONEDAYOS_PUBLIC_REGISTRATION_ENABLED: createBooleanEnvSchema(true),
  ONEDAYOS_DEMO_RESET_APPROVED: createBooleanEnvSchema(false),
  ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED: createBooleanEnvSchema(false),
})

export type ServerEnv = z.infer<typeof serverEnvSchema>

function readServerEnvInput() {
  return {
    NODE_ENV: process.env.NODE_ENV,
    NEXT_PHASE: process.env.NEXT_PHASE,
    NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL,
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    DATABASE_URL: process.env.DATABASE_URL,
    DIRECT_URL: process.env.DIRECT_URL,
    SUPABASE_SECRET_KEY: process.env.SUPABASE_SECRET_KEY,
    SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
    ONEDAYOS_DEMO_MODE: process.env.ONEDAYOS_DEMO_MODE,
    ONEDAYOS_PUBLIC_REGISTRATION_ENABLED: process.env.ONEDAYOS_PUBLIC_REGISTRATION_ENABLED,
    ONEDAYOS_DEMO_RESET_APPROVED: process.env.ONEDAYOS_DEMO_RESET_APPROVED,
    ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED: process.env.ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED,
  }
}

function isBuildOrLocalTooling(): boolean {
  return (
    process.env.NODE_ENV !== 'production' ||
    process.env.NEXT_PHASE === 'phase-production-build' ||
    ['build', 'check:prisma', 'check:env', 'test', 'test:run', 'typecheck', 'lint'].includes(
      process.env.npm_lifecycle_event || '',
    )
  )
}

export function getServerEnv(options: { allowPlaceholders?: boolean } = {}): ServerEnv {
  const parsed = serverEnvSchema.parse(readServerEnvInput())
  const allowPlaceholders = options.allowPlaceholders ?? isBuildOrLocalTooling()

  const serverSecretValues = [
    parsed.DATABASE_URL,
    parsed.DIRECT_URL,
    parsed.SUPABASE_SECRET_KEY ?? parsed.SUPABASE_SERVICE_ROLE_KEY,
  ]

  if (!allowPlaceholders && serverSecretValues.some((value) => isPlaceholderValue(value))) {
    throw new Error('Production server environment is missing real server-only secrets.')
  }

  if (!allowPlaceholders) {
    resolveSupabaseAdminApiKey(parsed)
  }

  if (!allowPlaceholders && isPlaceholderValue(parsed.NEXT_PUBLIC_SUPABASE_URL)) {
    throw new Error('Production server environment is missing a real Supabase URL.')
  }

  return parsed
}

export function getDatabaseUrlForPrismaRuntime(): string {
  return getServerEnv().DATABASE_URL
}

export function getDemoRuntimeConfig() {
  const env = getServerEnv()

  return {
    demoMode: env.ONEDAYOS_DEMO_MODE,
    publicRegistrationEnabled: env.ONEDAYOS_PUBLIC_REGISTRATION_ENABLED,
  }
}

export function getInventoryV2RuntimeConfig() {
  return {
    enabled: getServerEnv().ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED,
  }
}
