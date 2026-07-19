import 'server-only'
import type { PlatformContext, TenantDb } from '@/sdk'
import { prisma } from './client'

export function createTenantDb(ctx: PlatformContext): TenantDb {
  return {
    orgId: ctx.org.id,
    prisma,
  }
}
