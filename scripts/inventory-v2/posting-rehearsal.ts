import { randomBytes } from 'node:crypto'
import { spawnSync } from 'node:child_process'
import { assertDisposableDatabaseUrl, redactSecret, REHEARSAL_DATABASE_PREFIX, sandboxDatabaseUrls } from './migration-safety'

const IMAGE = 'postgres:17-alpine'
let container = ''
let password = ''

function run(command: string, args: string[], options: { env?: NodeJS.ProcessEnv; allowFailure?: boolean } = {}) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(), encoding: 'utf8', env: options.env ?? process.env, maxBuffer: 20 * 1024 * 1024,
  })
  if (!options.allowFailure && result.status !== 0) {
    throw new Error(redactSecret(`${result.stdout ?? ''}${result.stderr ?? ''}`.trim(), password))
  }
  return result
}

function cleanup() {
  if (container) spawnSync('docker', ['rm', '-f', container], { encoding: 'utf8' })
  container = ''
}

function waitForDatabase() {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const status = run('docker', ['inspect', '--format', '{{.State.Health.Status}}', container], { allowFailure: true })
    if (status.stdout.trim() === 'healthy') return
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500)
  }
  throw new Error('Disposable PostgreSQL did not become healthy.')
}

function main() {
  if (process.argv.length > 2) throw new Error('This command accepts no URL or CLI arguments.')
  container = `onedayos-v2-6c-${randomBytes(6).toString('hex')}`
  password = randomBytes(32).toString('base64url')
  const started = run('docker', [
    'run', '-d', '--rm', '--name', container, '-e', `POSTGRES_PASSWORD=${password}`,
    '-e', 'POSTGRES_DB=postgres', '-p', '127.0.0.1::5432',
    '--health-cmd', 'pg_isready -U postgres -d postgres',
    '--health-interval', '1s', '--health-timeout', '3s', '--health-retries', '30', IMAGE,
  ])
  if (!started.stdout.trim()) throw new Error('Disposable PostgreSQL container did not start.')
  waitForDatabase()
  const mapping = run('docker', ['port', container, '5432/tcp']).stdout.trim()
  const port = Number(mapping.slice(mapping.lastIndexOf(':') + 1))
  if (!Number.isInteger(port)) throw new Error('Could not resolve the dynamic PostgreSQL port.')
  const database = `${REHEARSAL_DATABASE_PREFIX}posting_${randomBytes(4).toString('hex')}`
  const postgresUrl = `postgresql://postgres:${encodeURIComponent(password)}@127.0.0.1:${port}/postgres`
  const testUrl = `postgresql://postgres:${encodeURIComponent(password)}@127.0.0.1:${port}/${database}`
  assertDisposableDatabaseUrl(testUrl, sandboxDatabaseUrls())
  const create = run('docker', ['exec', container, 'createdb', '-U', 'postgres', database])
  if (create.status !== 0) throw new Error('Could not create the isolated posting database.')
  process.stdout.write('[posting-rehearsal] Safety gate passed: random no-volume container, loopback dynamic port, isolated database, sandbox mismatch.\n')
  const env = { ...process.env, DATABASE_URL: testUrl, DIRECT_URL: testUrl }
  run('npx', ['prisma', 'migrate', 'deploy'], { env })
  const result = run('npx', ['tsx', 'scripts/inventory-v2/posting-rehearsal-runner.ts'], {
    env: {
      ...env,
      INVENTORY_V2_POSTING_TEST_DATABASE_URL: testUrl,
      ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED: 'true',
    },
  })
  process.stdout.write(result.stdout)
  void postgresUrl
}

for (const signal of ['SIGINT', 'SIGTERM'] as const) {
  process.once(signal, () => {
    cleanup()
    process.exit(128 + (signal === 'SIGINT' ? 2 : 15))
  })
}

try {
  main()
} catch (error) {
  process.stderr.write(`[posting-rehearsal] FAILED: ${redactSecret(error instanceof Error ? error.message : 'Unknown failure', password)}\n`)
  process.exitCode = 1
} finally {
  cleanup()
}
