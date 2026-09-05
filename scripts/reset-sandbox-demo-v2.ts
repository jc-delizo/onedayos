import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import { loadDemoEnvFiles } from './demo-ops'
import { provisionCanonicalV2Demo, validateCutoverEnv } from './inventory-v2/cutover-demo'

function normalizedDatabaseUrl(value: string): string {
  const marker = value.indexOf('://')
  const slash = value.indexOf('/', marker + 3)
  const authority = value.slice(marker + 3, slash)
  const at = authority.lastIndexOf('@')
  const colon = authority.indexOf(':')
  if (marker < 0 || slash < 0 || at < 0 || colon < 0) throw new Error('DIRECT_URL has an unsupported shape.')
  return `${value.slice(0, marker + 3)}${encodeURIComponent(decodeURIComponent(authority.slice(0, colon)))}:${encodeURIComponent(decodeURIComponent(authority.slice(colon + 1, at)))}@${authority.slice(at + 1)}${value.slice(slash)}`
}

export async function resetSandboxDemoV2() {
  loadDemoEnvFiles()
  validateCutoverEnv(process.env, 'true-or-false')
  if (process.env.ONEDAYOS_DEMO_MODE !== 'true' || process.env.ONEDAYOS_DEMO_RESET_APPROVED !== 'true') {
    throw new Error('Controlled V2 reset requires demo mode and demo reset approval.')
  }
  const source = process.env.DIRECT_URL ?? process.env.DATABASE_URL
  if (!source) throw new Error('DIRECT_URL or DATABASE_URL is required.')
  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: normalizedDatabaseUrl(source) }) })
  try {
    return await provisionCanonicalV2Demo(prisma, process.env, { reset: true })
  } finally {
    await prisma.$disconnect()
  }
}

async function main() {
  process.stdout.write(`${JSON.stringify(await resetSandboxDemoV2(), null, 2)}\n`)
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main().catch((error: unknown) => {
    process.stderr.write(`Controlled V2 demo reset failed: ${error instanceof Error ? error.message : 'Unknown error'}\n`)
    process.exitCode = 1
  })
}
