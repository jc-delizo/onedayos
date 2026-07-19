import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'

const LOCAL_PRISMA_DATABASE_URL =
  'postgresql://postgres:postgres@127.0.0.1:54322/onedayos?schema=public'

function getSeedDatabaseUrl(): string {
  if (process.env.DATABASE_URL) {
    return process.env.DATABASE_URL
  }

  if (process.env.NODE_ENV === 'production') {
    throw new Error('DATABASE_URL is required before running production seed scripts.')
  }

  return LOCAL_PRISMA_DATABASE_URL
}

const adapter = new PrismaPg({
  connectionString: getSeedDatabaseUrl(),
})

const prisma = new PrismaClient({ adapter })

async function main() {
  console.log('No baseline seed is required for Foundation Package 1.')
}

main()
  .finally(async () => {
    await prisma.$disconnect()
  })
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
