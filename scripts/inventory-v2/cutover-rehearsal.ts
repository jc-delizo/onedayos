import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { assertDisposableDatabaseUrl, redactSecret, REHEARSAL_DATABASE_PREFIX, sandboxDatabaseUrls } from './migration-safety'

const IMAGE = 'postgres:17-alpine'
let container = ''
let password = ''

function run(command: string, args: string[], options: { env?: NodeJS.ProcessEnv; allowFailure?: boolean } = {}) {
  const result = spawnSync(command, args, { cwd: process.cwd(), encoding: 'utf8', env: options.env ?? process.env, maxBuffer: 30 * 1024 * 1024 })
  if (!options.allowFailure && result.status !== 0) throw new Error(redactSecret(`${result.stdout ?? ''}${result.stderr ?? ''}`.trim(), password))
  return result
}

function cleanup() {
  if (container) spawnSync('docker', ['rm', '-f', container], { encoding: 'utf8' })
  container = ''
}

function waitForDatabase() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    if (run('docker', ['inspect', '--format', '{{.State.Health.Status}}', container], { allowFailure: true }).stdout.trim() === 'healthy') return
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500)
  }
  throw new Error('Disposable PostgreSQL did not become healthy.')
}

function main() {
  if (process.argv.length > 2) throw new Error('This command accepts no URL or CLI arguments.')
  container = `onedayos-v2-6d-${randomBytes(6).toString('hex')}`
  password = randomBytes(32).toString('base64url')
  run('docker', ['run', '-d', '--rm', '--name', container, '-e', `POSTGRES_PASSWORD=${password}`, '-e', 'POSTGRES_DB=postgres', '-p', '127.0.0.1::5432', '--health-cmd', 'pg_isready -U postgres -d postgres', '--health-interval', '1s', '--health-timeout', '3s', '--health-retries', '30', IMAGE])
  waitForDatabase()
  const mapping = run('docker', ['port', container, '5432/tcp']).stdout.trim()
  const port = Number(mapping.slice(mapping.lastIndexOf(':') + 1))
  const database = `${REHEARSAL_DATABASE_PREFIX}cutover_${randomBytes(4).toString('hex')}`
  const url = `postgresql://postgres:${encodeURIComponent(password)}@127.0.0.1:${port}/${database}`
  assertDisposableDatabaseUrl(url, sandboxDatabaseUrls())
  run('docker', ['exec', container, 'createdb', '-U', 'postgres', database])
  process.stdout.write('[cutover-rehearsal] Safety gate passed: random no-volume container, loopback dynamic port, isolated database, sandbox mismatch.\n')
  const env = {
    ...process.env,
    DATABASE_URL: url,
    DIRECT_URL: url,
    INVENTORY_V2_CUTOVER_TEST_DATABASE_URL: url,
    ONEDAYOS_SANDBOX_DB_APPROVED: 'true',
    ONEDAYOS_INVENTORY_V2_MIGRATION_APPROVED: 'true',
    ONEDAYOS_INVENTORY_V2_BACKFILL_APPROVED: 'true',
    ONEDAYOS_INVENTORY_V2_CUTOVER_APPROVED: 'true',
    ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED: 'false',
  }
  run('npx', ['prisma', 'migrate', 'deploy'], { env })
  const result = run('npx', ['tsx', 'scripts/inventory-v2/cutover-rehearsal-runner.ts'], { env })
  process.stdout.write(result.stdout)
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => { cleanup(); process.exit(128 + (signal === 'SIGINT' ? 2 : 15)) })
}

try {
  main()
} catch (error) {
  process.stderr.write(`[cutover-rehearsal] FAILED: ${redactSecret(error instanceof Error ? error.message : 'Unknown failure', password)}\n`)
  process.exitCode = 1
} finally {
  cleanup()
}
