import { parse } from 'dotenv'
import { existsSync, readFileSync } from 'node:fs'

export const REHEARSAL_DATABASE_PREFIX = 'onedayos_v2_6b_'

export interface DatabaseIdentity {
  host: string
  database: string
}

export function databaseIdentity(value: string): DatabaseIdentity {
  const url = new URL(value)
  return {
    host: url.hostname.toLowerCase(),
    database: decodeURIComponent(url.pathname.replace(/^\/+/, '')).toLowerCase(),
  }
}

export function sandboxDatabaseUrls(
  environment: NodeJS.ProcessEnv = process.env,
  envPath = '.env.local',
): string[] {
  const fileValues = existsSync(envPath) ? parse(readFileSync(envPath)) : {}
  return [
    environment.DATABASE_URL,
    environment.DIRECT_URL,
    fileValues.DATABASE_URL,
    fileValues.DIRECT_URL,
  ].filter((value): value is string => Boolean(value))
}

export function assertDisposableDatabaseUrl(candidate: string, sandboxUrls: string[]): void {
  const identity = databaseIdentity(candidate)
  if (!['127.0.0.1', 'localhost'].includes(identity.host)) {
    throw new Error('Migration rehearsal database must use a loopback host.')
  }
  if (!identity.database.startsWith(REHEARSAL_DATABASE_PREFIX)) {
    throw new Error('Migration rehearsal database name is outside the disposable namespace.')
  }
  for (const sandboxUrl of sandboxUrls) {
    try {
      const sandbox = databaseIdentity(sandboxUrl)
      if (sandbox.host === identity.host && sandbox.database === identity.database) {
        throw new Error('Migration rehearsal database matches a configured sandbox database.')
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('matches a configured')) throw error
      // Malformed unrelated environment values are not rehearsal targets.
    }
  }
}

export function redactSecret(value: string, secret: string): string {
  return secret ? value.replaceAll(secret, '[REDACTED]') : value
}
