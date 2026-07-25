import { randomBytes } from 'node:crypto'
import { mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { spawnSync } from 'node:child_process'
import { LEGACY_COUNTS_SQL, LEGACY_FIXTURE_SQL, VALID_FOUNDATION_SQL } from './migration-fixtures'
import {
  assertDisposableDatabaseUrl,
  redactSecret,
  REHEARSAL_DATABASE_PREFIX,
  sandboxDatabaseUrls,
} from './migration-safety'

const POSTGRES_IMAGE = 'postgres:17-alpine'
const V2_MIGRATION = 'prisma/migrations/20260725000000_inventory_v2_transaction_foundation/migration.sql'
const CHECKPOINT = 'inventory-demo-v2-v2.5-checkpoint'
const PRE_V2_MIGRATIONS = [
  'prisma/migrations/20260708000000_foundation_kernel/migration.sql',
  'prisma/migrations/20260708010000_business_objects/migration.sql',
  'prisma/migrations/20260708020000_inventory_module/migration.sql',
]

let containerName = ''
let password = ''
let temporaryDirectory = ''

function safe(message: string): void {
  process.stdout.write(`[migration-rehearsal] ${message}\n`)
}

function run(
  command: string,
  args: string[],
  options: { env?: NodeJS.ProcessEnv; input?: string; allowFailure?: boolean } = {},
) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    encoding: 'utf8',
    env: options.env ?? process.env,
    input: options.input,
    maxBuffer: 20 * 1024 * 1024,
  })
  if (!options.allowFailure && result.status !== 0) {
    const detail = redactSecret(`${result.stdout ?? ''}${result.stderr ?? ''}`.trim(), password)
    throw new Error(`${command} failed${detail ? `: ${detail}` : ''}`)
  }
  return result
}

function cleanup(): void {
  if (containerName) {
    spawnSync('docker', ['rm', '-f', containerName], { encoding: 'utf8' })
    containerName = ''
  }
  if (temporaryDirectory) {
    rmSync(temporaryDirectory, { recursive: true, force: true })
    temporaryDirectory = ''
  }
}

function waitForPostgres(): void {
  for (let attempt = 0; attempt < 60; attempt += 1) {
    const result = run(
      'docker',
      ['inspect', '--format', '{{.State.Health.Status}}', containerName],
      { allowFailure: true },
    )
    if (result.stdout.trim() === 'healthy') return
    Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500)
  }
  throw new Error('Disposable PostgreSQL did not become healthy.')
}

function databaseUrl(port: number, database: string): string {
  const url = `postgresql://postgres:${encodeURIComponent(password)}@127.0.0.1:${port}/${database}`
  assertDisposableDatabaseUrl(url, sandboxDatabaseUrls())
  return url
}

function psql(url: string, sql: string, allowFailure = false) {
  const parsed = new URL(url)
  parsed.password = ''
  parsed.username = 'postgres'
  return run(
    'psql',
    ['-X', '-v', 'ON_ERROR_STOP=1', '-At', parsed.toString()],
    { input: sql, allowFailure, env: { ...process.env, PGPASSWORD: password } },
  )
}

function assertScalar(url: string, sql: string, expected: string, label: string): void {
  const actual = psql(url, sql).stdout.trim()
  if (actual !== expected) throw new Error(`${label}: expected ${expected}, received ${actual}`)
}

function expectSqlRejected(url: string, label: string, sql: string): void {
  const result = psql(url, sql, true)
  if (result.status === 0) throw new Error(`Constraint did not reject ${label}.`)
}

function runConstraintChecks(url: string): void {
  psql(url, VALID_FOUNDATION_SQL)
  const base = (id: string, type: string, number: string, warehouseShape: string, tail = '') =>
    `INSERT INTO "inventory_transactions" ("id","orgId","type","transactionNumber","warehouseId","sourceWarehouseId","destinationWarehouseId","postedByUserId","updatedAt"${tail ? `,${tail.split('|')[0]}` : ''})
     VALUES ('${id}','org-a','${type}','${number}',${warehouseShape},'user-a',CURRENT_TIMESTAMP${tail ? `,${tail.split('|')[1]}` : ''});`

  const rejected: Array<[string, string]> = [
    ['bad transaction number', base('bad-number', 'RECEIPT', 'BAD', "'warehouse-a',NULL,NULL")],
    ['self reversal', base('self-reversal', 'ADJUSTMENT', 'REV-2026-0000000000000001', "'warehouse-a',NULL,NULL", `"reversalOfTransactionId","reason"|'self-reversal','reason'`)],
    ['invalid reversal shape', base('bad-reversal', 'ADJUSTMENT', 'REV-2026-0000000000000002', "'warehouse-a',NULL,NULL", `"reversalOfTransactionId","reason"|'tx-adjustment',''`)],
    ['same transfer warehouses', base('same-transfer', 'TRANSFER', 'TRF-2026-0000000000000002', "NULL,'warehouse-a','warehouse-a'")],
    ['invalid Receipt warehouse shape', base('bad-receipt', 'RECEIPT', 'REC-2026-0000000000000002', "NULL,'warehouse-a',NULL")],
    ['invalid Issue warehouse shape', base('bad-issue', 'ISSUE', 'ISS-2026-0000000000000002', "NULL,NULL,'warehouse-a'")],
    ['invalid Adjustment warehouse shape', base('bad-adjust', 'ADJUSTMENT', 'ADJ-2026-0000000000000002', "NULL,NULL,NULL")],
    ['invalid Transfer warehouse shape', base('bad-transfer', 'TRANSFER', 'TRF-2026-0000000000000003', "'warehouse-a',NULL,NULL")],
    ['partial idempotency pair', base('partial-idem', 'ADJUSTMENT', 'ADJ-2026-0000000000000003', "'warehouse-a',NULL,NULL", `"idempotencyKeyHash"|'hash-only'`)],
    ['empty unit', `INSERT INTO "inventory_transaction_lines" ("id","orgId","transactionId","productId","quantity","unit","lineNumber","updatedAt") VALUES ('bad-unit','org-a','tx-receipt','product-a',1,' ',2,CURRENT_TIMESTAMP);`],
    ['nonpositive line number', `INSERT INTO "inventory_transaction_lines" ("id","orgId","transactionId","productId","quantity","unit","lineNumber","updatedAt") VALUES ('bad-line','org-a','tx-receipt','product-a',1,'pcs',0,CURRENT_TIMESTAMP);`],
    ['negative line quantity', `INSERT INTO "inventory_transaction_lines" ("id","orgId","transactionId","productId","quantity","unit","lineNumber","updatedAt") VALUES ('bad-quantity','org-a','tx-receipt','product-a',-1,'pcs',2,CURRENT_TIMESTAMP);`],
    ['partial movement link pair', `UPDATE "stock_movements" SET "inventoryTransactionId"='tx-receipt' WHERE "id"='movement-a-1';`],
    ['movement transaction/line/org mismatch', `UPDATE "stock_movements" SET "inventoryTransactionId"='tx-issue',"inventoryTransactionLineId"='line-receipt' WHERE "id"='movement-a-1';`],
    ['duplicate org transaction number', base('duplicate-number', 'RECEIPT', 'REC-2026-0000000000000001', "'warehouse-a',NULL,NULL")],
  ]
  for (const [label, sql] of rejected) expectSqlRejected(url, label, sql)

  psql(url, base('idem-original', 'ADJUSTMENT', 'ADJ-2026-0000000000000010', "'warehouse-a',NULL,NULL", `"idempotencyKeyHash","requestHash"|'idem','request'`))
  expectSqlRejected(url, 'duplicate org idempotency key', base('idem-duplicate', 'ADJUSTMENT', 'ADJ-2026-0000000000000011', "'warehouse-a',NULL,NULL", `"idempotencyKeyHash","requestHash"|'idem','request-2'`))
  psql(url, base('reversal-original', 'ADJUSTMENT', 'ADJ-2026-0000000000000012', "'warehouse-a',NULL,NULL"))
  psql(url, base('reversal-one', 'ADJUSTMENT', 'REV-2026-0000000000000012', "'warehouse-a',NULL,NULL", `"reversalOfTransactionId","reason"|'reversal-original','reason'`))
  expectSqlRejected(url, 'duplicate reversal', base('reversal-two', 'ADJUSTMENT', 'REV-2026-0000000000000013', "'warehouse-a',NULL,NULL", `"reversalOfTransactionId","reason"|'reversal-original','reason'`))
  safe('Executable constraints: 4 transaction types accepted; 17 invalid/duplicate shapes rejected.')
}

function runPreflight(url: string) {
  return run('npm', ['run', '--silent', 'inventory:v2:backfill:preflight'], {
    env: { ...process.env, DATABASE_URL: url, DIRECT_URL: url },
    allowFailure: true,
  })
}

function runInvalidPreflightScenario(
  url: string,
  label: string,
  mutationSql: string,
  restoreSql: string,
  expectedCode: string,
): void {
  psql(url, mutationSql)
  const result = runPreflight(url)
  psql(url, restoreSql)
  if (result.status === 0 || !result.stdout.includes(`"${expectedCode}"`)) {
    throw new Error(`Invalid preflight scenario ${label} did not fail with ${expectedCode}.`)
  }
}

function main(): void {
  if (process.argv.length > 2) throw new Error('This harness accepts no database URL or CLI arguments.')
  temporaryDirectory = mkdtempSync(join(tmpdir(), 'onedayos-v2-6b-rehearsal-'))
  containerName = `onedayos-v2-6b-${randomBytes(6).toString('hex')}`
  password = randomBytes(32).toString('base64url')
  const started = run('docker', [
    'run', '-d', '--rm', '--name', containerName,
    '-e', `POSTGRES_PASSWORD=${password}`,
    '-e', 'POSTGRES_DB=postgres',
    '-p', '127.0.0.1::5432',
    '--health-cmd', 'pg_isready -U postgres -d postgres',
    '--health-interval', '1s', '--health-timeout', '3s', '--health-retries', '30',
    POSTGRES_IMAGE,
  ])
  if (!started.stdout.trim()) throw new Error('Disposable PostgreSQL container did not start.')
  waitForPostgres()
  const portOutput = run('docker', ['port', containerName, '5432/tcp']).stdout.trim()
  const port = Number(portOutput.slice(portOutput.lastIndexOf(':') + 1))
  if (!Number.isInteger(port)) throw new Error('Could not resolve disposable PostgreSQL port.')
  const adminUrl = databaseUrl(port, `${REHEARSAL_DATABASE_PREFIX}admin`)
  const freshName = `${REHEARSAL_DATABASE_PREFIX}fresh`
  const upgradeName = `${REHEARSAL_DATABASE_PREFIX}upgrade`
  const postgresUrl = adminUrl.replace(`/${REHEARSAL_DATABASE_PREFIX}admin`, '/postgres')
  psql(postgresUrl, `CREATE DATABASE "${freshName}";`)
  psql(postgresUrl, `CREATE DATABASE "${upgradeName}";`)
  const freshUrl = databaseUrl(port, freshName)
  const upgradeUrl = databaseUrl(port, upgradeName)
  safe('Safety gate passed: random no-volume container, loopback-only dynamic port, namespaced databases, sandbox identity mismatch.')

  run('npx', ['prisma', 'migrate', 'deploy'], { env: { ...process.env, DATABASE_URL: freshUrl, DIRECT_URL: freshUrl } })
  assertScalar(freshUrl, 'SELECT count(*) FROM "_prisma_migrations" WHERE finished_at IS NOT NULL;', '4', 'migration history')
  assertScalar(freshUrl, `SELECT count(*) FROM pg_tables WHERE schemaname='public' AND tablename IN ('inventory_transactions','inventory_transaction_lines');`, '2', 'new tables')
  assertScalar(freshUrl, `SELECT (SELECT count(*) FROM "organizations") || ':' || (SELECT count(*) FROM "inventory_transactions") || ':' || (SELECT count(*) FROM "inventory_transaction_lines");`, '0:0:0', 'fresh data')
  assertScalar(freshUrl, `SELECT count(*) FROM pg_constraint WHERE conname IN ('inventory_transactions_number_format_check','inventory_transactions_warehouse_party_shape_check','inventory_transactions_distinct_transfer_warehouses_check','inventory_transactions_not_self_reversal_check','inventory_transactions_reversal_contract_check','inventory_transactions_idempotency_pair_check','inventory_transaction_lines_unit_nonempty_check','inventory_transaction_lines_line_number_positive_check','inventory_transaction_lines_quantity_nonnegative_check','stock_movements_inventory_link_pair_check');`, '10', 'frozen checks')
  safe('Fresh database: all 4 migrations applied; frozen objects present; no data created.')

  for (const migration of PRE_V2_MIGRATIONS) {
    const result = run('git', ['show', `${CHECKPOINT}:${migration}`])
    const target = join(temporaryDirectory, migration.replaceAll('/', '_'))
    writeFileSync(target, result.stdout, { mode: 0o600 })
    psql(upgradeUrl, readFileSync(target, 'utf8'))
  }
  psql(upgradeUrl, LEGACY_FIXTURE_SQL)
  const countsBefore = psql(upgradeUrl, LEGACY_COUNTS_SQL).stdout.trim()
  assertScalar(upgradeUrl, `SELECT count(*) FROM "stock_adjustments" a JOIN "products" p ON p.id=a."productId" AND p."orgId"=a."orgId" JOIN "warehouses" w ON w.id=a."warehouseId" AND w."orgId"=a."orgId";`, '4', 'legacy query')
  psql(upgradeUrl, readFileSync(V2_MIGRATION, 'utf8'))
  const countsAfter = psql(upgradeUrl, LEGACY_COUNTS_SQL).stdout.trim()
  if (countsBefore !== '2:2:4:4:4:2' || countsAfter !== countsBefore) throw new Error('Legacy row preservation failed.')
  assertScalar(upgradeUrl, `SELECT (SELECT count(*) FROM "inventory_transactions") || ':' || (SELECT count(*) FROM "inventory_transaction_lines") || ':' || (SELECT count(*) FROM "stock_movements" WHERE "inventoryTransactionId" IS NOT NULL OR "inventoryTransactionLineId" IS NOT NULL);`, '0:0:0', 'expand-only state')
  assertScalar(upgradeUrl, `SELECT count(*) FROM "stock_adjustments" a JOIN "products" p ON p.id=a."productId" AND p."orgId"=a."orgId" WHERE a."orgId" <> p."orgId";`, '0', 'tenant isolation')
  safe(`Checkpoint upgrade: legacy counts preserved (${countsAfter}); new tables empty and links null.`)

  const first = runPreflight(upgradeUrl)
  const second = runPreflight(upgradeUrl)
  if (first.status !== 0 || second.status !== 0 || first.stdout !== second.stdout) {
    throw new Error('Valid read-only preflight failed or was nondeterministic.')
  }
  const report = JSON.parse(first.stdout) as { validCount: number; invalidCount: number; warningCount: number }
  if (report.validCount !== 4 || report.invalidCount !== 0 || report.warningCount !== 0) {
    throw new Error('Valid preflight returned unexpected totals.')
  }
  assertScalar(upgradeUrl, LEGACY_COUNTS_SQL, countsAfter, 'preflight write check')
  const invalidScenarios: Array<[string, string, string, string]> = [
    [
      'missing Product',
      `SET session_replication_role=replica; DELETE FROM "products" WHERE "id"='product-a'; SET session_replication_role=origin;`,
      `INSERT INTO "products" ("id","orgId","code","name","unit","updatedAt") VALUES ('product-a','org-a','A-1','Product A','pcs',CURRENT_TIMESTAMP);`,
      'PRODUCT_MISSING',
    ],
    [
      'wrong-org Product',
      `SET session_replication_role=replica; UPDATE "products" SET "orgId"='org-b' WHERE "id"='product-a'; SET session_replication_role=origin;`,
      `SET session_replication_role=replica; UPDATE "products" SET "orgId"='org-a' WHERE "id"='product-a'; SET session_replication_role=origin;`,
      'PRODUCT_TENANT_MISMATCH',
    ],
    [
      'missing Warehouse',
      `SET session_replication_role=replica; DELETE FROM "warehouses" WHERE "id"='warehouse-a'; SET session_replication_role=origin;`,
      `INSERT INTO "warehouses" ("id","orgId","code","name","updatedAt") VALUES ('warehouse-a','org-a','A-1','Warehouse A',CURRENT_TIMESTAMP);`,
      'WAREHOUSE_MISSING',
    ],
    [
      'wrong-org Warehouse',
      `SET session_replication_role=replica; UPDATE "warehouses" SET "orgId"='org-b' WHERE "id"='warehouse-a'; SET session_replication_role=origin;`,
      `SET session_replication_role=replica; UPDATE "warehouses" SET "orgId"='org-a' WHERE "id"='warehouse-a'; SET session_replication_role=origin;`,
      'WAREHOUSE_TENANT_MISMATCH',
    ],
    [
      'missing User',
      `SET session_replication_role=replica; DELETE FROM "users" WHERE "id"='user-a'; SET session_replication_role=origin;`,
      `INSERT INTO "users" ("id","orgId","name","email","updatedAt") VALUES ('user-a','org-a','Actor A','actor-a@example.invalid',CURRENT_TIMESTAMP);`,
      'ACTOR_MISSING',
    ],
    [
      'inconsistent before/after/delta',
      `UPDATE "stock_adjustments" SET "quantityDelta"=-2 WHERE "id"='adjust-a-2';`,
      `UPDATE "stock_adjustments" SET "quantityDelta"=-3 WHERE "id"='adjust-a-2';`,
      'ADJUSTMENT_ARITHMETIC_MISMATCH',
    ],
    [
      'missing movement',
      `DELETE FROM "stock_movements" WHERE "id"='movement-a-2';`,
      `INSERT INTO "stock_movements" ("id","orgId","productId","warehouseId","type","quantityDelta","resultingQuantity","sourceType","sourceId","occurredAt","createdBy","createdAt") VALUES ('movement-a-2','org-a','product-a','warehouse-a','adjustment_out',-3,7,'stock_adjustment','adjust-a-2','2026-01-02T00:00:01Z','user-a','2026-01-02T00:00:01Z');`,
      'MOVEMENT_MISSING',
    ],
    [
      'duplicate movement',
      `INSERT INTO "stock_movements" ("id","orgId","productId","warehouseId","type","quantityDelta","resultingQuantity","sourceType","sourceId","occurredAt","createdBy","createdAt") VALUES ('movement-a-duplicate','org-a','product-a','warehouse-a','adjustment_out',-3,7,'stock_adjustment','adjust-a-2','2026-01-02T00:00:02Z','user-a','2026-01-02T00:00:02Z');`,
      `DELETE FROM "stock_movements" WHERE "id"='movement-a-duplicate';`,
      'MOVEMENT_DUPLICATE',
    ],
    [
      'wrong movement delta',
      `UPDATE "stock_movements" SET "quantityDelta"=-2 WHERE "id"='movement-a-2';`,
      `UPDATE "stock_movements" SET "quantityDelta"=-3 WHERE "id"='movement-a-2';`,
      'MOVEMENT_DELTA_MISMATCH',
    ],
    [
      'wrong quantity-after',
      `UPDATE "stock_movements" SET "resultingQuantity"=6 WHERE "id"='movement-a-2';`,
      `UPDATE "stock_movements" SET "resultingQuantity"=7 WHERE "id"='movement-a-2';`,
      'MOVEMENT_RESULT_MISMATCH',
    ],
    [
      'invalid Product unit',
      `UPDATE "products" SET "unit"=' ' WHERE "id"='product-a';`,
      `UPDATE "products" SET "unit"='pcs' WHERE "id"='product-a';`,
      'PRODUCT_UNIT_EMPTY',
    ],
    [
      'orphan movement',
      `INSERT INTO "stock_movements" ("id","orgId","productId","warehouseId","type","quantityDelta","resultingQuantity","sourceType","sourceId","occurredAt","createdBy","createdAt") VALUES ('movement-orphan','org-a','product-a','warehouse-a','adjustment_in',1,8,'stock_adjustment','missing-adjustment','2026-01-03T00:00:00Z','user-a','2026-01-03T00:00:00Z');`,
      `DELETE FROM "stock_movements" WHERE "id"='movement-orphan';`,
      'ORPHAN_ADJUSTMENT_MOVEMENT',
    ],
  ]
  for (const [label, mutation, restore, code] of invalidScenarios) {
    runInvalidPreflightScenario(upgradeUrl, label, mutation, restore, code)
  }
  safe('Backfill preflight: 2 organizations, 4 valid, 0 invalid, 0 warnings; repeat identical/read-only; 12 database invalid scenarios rejected. Collision rejection covered by deterministic validator test.')
  runConstraintChecks(upgradeUrl)
  const version = psql(upgradeUrl, `SHOW server_version;`).stdout.trim()
  safe(`Recovery compatibility: V2-5 legacy reads still pass on expanded PostgreSQL ${version}; additive schema may remain unused during application rollback.`)
  safe('Disposable migration rehearsal complete.')
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
  const message = error instanceof Error ? error.message : 'Unknown rehearsal failure'
  process.stderr.write(`[migration-rehearsal] FAILED: ${redactSecret(message, password)}\n`)
  process.exitCode = 1
} finally {
  cleanup()
}
