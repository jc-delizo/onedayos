import { existsSync } from 'node:fs'
import { config as loadDotenv } from 'dotenv'
import { defineConfig } from 'prisma/config'

if (existsSync('.env.local')) {
  loadDotenv({ path: '.env.local', override: false, quiet: true })
}

loadDotenv({ override: false, quiet: true })

const LOCAL_PRISMA_DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:54322/onedayos?schema=public'

function getPrismaConfigDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  const lifecycle = process.env.npm_lifecycle_event || ''
  const command = process.argv.join(' ')
  const safeLocalFallback =
    process.env.NODE_ENV !== 'production' ||
    ['build', 'typecheck', 'test', 'test:run', 'check:prisma', 'check:env'].includes(lifecycle) ||
    /\b(validate|generate|diff)\b/.test(command)

  if (!safeLocalFallback) {
    throw new Error('DATABASE_URL is required for Prisma commands that can affect a live database.')
  }

  return LOCAL_PRISMA_DATABASE_URL
}

export default defineConfig({
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
    seed: 'tsx prisma/seed.ts',
  },
  datasource: {
    url: getPrismaConfigDatabaseUrl(),
  },
})
