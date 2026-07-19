import type { PermissionRequirement, PlatformContext } from '@/sdk'
import { apiErrors } from '@/kernel/api/errors'
import { can } from './match'

export async function requirePermission(ctx: PlatformContext, requirement: PermissionRequirement): Promise<void> {
  if (!can(ctx, requirement)) {
    throw apiErrors.forbidden()
  }
}

export async function requireAnyPermission(
  ctx: PlatformContext,
  requirements: PermissionRequirement[],
): Promise<void> {
  if (!requirements.some((requirement) => can(ctx, requirement))) {
    throw apiErrors.forbidden()
  }
}

export async function requireAllPermissions(
  ctx: PlatformContext,
  requirements: PermissionRequirement[],
): Promise<void> {
  if (!requirements.every((requirement) => can(ctx, requirement))) {
    throw apiErrors.forbidden()
  }
}
