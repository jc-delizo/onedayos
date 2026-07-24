import { notFound } from 'next/navigation'
import type { PermissionRequirement, PlatformContext } from '@/sdk'
import { sdk } from '@/sdk/server'

export const ORGANIZATION_ADMIN_PERMISSION = {
  module: 'kernel',
  resource: 'organization',
  action: 'manage',
} satisfies PermissionRequirement

export const ORGANIZATION_EXPORT_PERMISSIONS = {
  BRANCH: {
    module: 'kernel',
    resource: 'organization.branch',
    action: 'export',
  },
  DEPARTMENT: {
    module: 'kernel',
    resource: 'organization.department',
    action: 'export',
  },
} as const satisfies Record<string, PermissionRequirement>

export function isOrganizationAdmin(ctx: PlatformContext): boolean {
  return sdk.permissions.can(ctx, ORGANIZATION_ADMIN_PERMISSION)
}

export function requireOrganizationAdmin(ctx: PlatformContext): void {
  if (!isOrganizationAdmin(ctx)) {
    notFound()
  }
}
