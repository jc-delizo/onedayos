import { notFound } from 'next/navigation'
import type { PermissionRequirement, PlatformContext } from '@/sdk'
import { sdk } from '@/sdk/server'

export const ORGANIZATION_ADMIN_PERMISSION = {
  module: 'kernel',
  resource: 'organization',
  action: 'manage',
} satisfies PermissionRequirement

export function isOrganizationAdmin(ctx: PlatformContext): boolean {
  return sdk.permissions.can(ctx, ORGANIZATION_ADMIN_PERMISSION)
}

export function requireOrganizationAdmin(ctx: PlatformContext): void {
  if (!isOrganizationAdmin(ctx)) {
    notFound()
  }
}
