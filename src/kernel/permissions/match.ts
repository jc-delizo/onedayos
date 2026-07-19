import type { PermissionGrant, PermissionRequirement, PlatformContext } from '@/sdk'

function matchesValue(grantValue: string, requiredValue: string): boolean {
  return grantValue === '*' || grantValue === requiredValue
}

export function matchesPermission(grant: PermissionGrant, requirement: PermissionRequirement): boolean {
  if (grant.conditions !== null) {
    return false
  }

  return (
    matchesValue(grant.module, requirement.module) &&
    matchesValue(grant.resource, requirement.resource) &&
    matchesValue(grant.action, requirement.action)
  )
}

export function can(ctx: PlatformContext, requirement: PermissionRequirement): boolean {
  return ctx.permissions
    .filter((permission) => permission.orgId === ctx.org.id)
    .some((permission) => matchesPermission(permission, requirement))
}
