import { readFileSync, readdirSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const schema = readFileSync(join(root, 'prisma/schema.prisma'), 'utf8')
const migrationRoot = join(root, 'prisma/migrations')
const foundationDirectories = readdirSync(migrationRoot).filter((name) =>
  name.endsWith('_inventory_v2_transaction_foundation'),
)
const failures: string[] = []

function requireText(source: string, text: string, description: string): void {
  if (!source.includes(text)) failures.push(description)
}

if (foundationDirectories.length !== 1) {
  failures.push('exactly one Inventory V2 transaction foundation migration must exist')
} else {
  const sql = readFileSync(join(migrationRoot, foundationDirectories[0], 'migration.sql'), 'utf8')
  for (const [text, description] of [
    ['CREATE TABLE "inventory_transactions"', 'inventory_transactions table is missing'],
    ['CREATE TABLE "inventory_transaction_lines"', 'inventory_transaction_lines table is missing'],
    ['stock_movements_inventory_link_pair_check', 'nullable stock movement link-pair check is missing'],
    ['inventory_transactions_warehouse_party_shape_check', 'transaction type/warehouse shape check is missing'],
    ['inventory_transactions_number_format_check', 'transaction-number format check is missing'],
  ] as const) {
    requireText(sql, text, description)
  }
  if (/\b(?:DROP\s+(?:TABLE|COLUMN)|DELETE\s+FROM|INSERT\s+INTO|UPDATE\s+\S+\s+SET|TRUNCATE)\b/i.test(sql)) {
    failures.push('foundation migration must remain expand-only and data-neutral')
  }
}

for (const [text, description] of [
  ['enum InventoryTransactionType', 'InventoryTransactionType enum is missing'],
  ['enum InventoryTransactionStatus', 'InventoryTransactionStatus enum is missing'],
  ['model InventoryTransaction {', 'InventoryTransaction model is missing'],
  ['model InventoryTransactionLine {', 'InventoryTransactionLine model is missing'],
  ['model StockAdjustment {', 'legacy StockAdjustment model must be retained'],
  ['sourceType                 String?', 'legacy StockMovement.sourceType must be retained'],
  ['sourceId                   String?', 'legacy StockMovement.sourceId must be retained'],
  ['inventoryTransactionId     String?', 'new stock movement transaction link must be nullable'],
  ['inventoryTransactionLineId String?', 'new stock movement line link must be nullable'],
] as const) {
  requireText(schema, text, description)
}

const preflight = readFileSync(join(root, 'scripts/inventory-v2/backfill-preflight.ts'), 'utf8')
if (/\.(?:create|createMany|update|updateMany|upsert|delete|deleteMany)\s*\(/.test(preflight)) {
  failures.push('Inventory V2 preflight must not contain Prisma mutation calls')
}
requireText(preflight, 'prisma.stockMovement.findMany', 'preflight must read legacy movement chains')
requireText(preflight, 'prisma.stockBalance.findMany', 'preflight must reconcile final stock balances')
requireText(preflight, 'findMany', 'preflight must use read-only queries')

const serverEnv = readFileSync(join(root, 'src/kernel/env/server.ts'), 'utf8')
requireText(
  serverEnv,
  'ONEDAYOS_INVENTORY_V2_RUNTIME_ENABLED: createBooleanEnvSchema(false)',
  'V2-6C runtime flag must remain server-only and default false',
)
const v2Routes = readFileSync(join(root, 'src/modules/inventory/transactions/routes.ts'), 'utf8')
if (v2Routes.indexOf('sdk.runtime.requireInventoryV2()') > v2Routes.indexOf('requireApiModuleContext')) {
  failures.push('V2-6C API runtime gate must execute before organization/module context and database access')
}
const inventoryNavigation = readFileSync(join(root, 'src/modules/inventory/navigation.ts'), 'utf8')
if (inventoryNavigation.includes('/inventory/transactions')) {
  failures.push('V2-6C must not expose V2 transaction navigation before V2-6D')
}

if (failures.length) {
  process.stderr.write(`Prisma foundation checks failed:\n${failures.map((failure) => `- ${failure}`).join('\n')}\n`)
  process.exitCode = 1
} else {
  process.stdout.write('Prisma foundation checks passed.\n')
}
