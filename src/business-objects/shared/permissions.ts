import type { PermissionRequirement } from '@/sdk'

export function objectPermission(resource: string, action: string): PermissionRequirement {
  return {
    module: 'objects',
    resource,
    action,
  }
}

export function objectPermissionId(requirement: PermissionRequirement): string {
  return `${requirement.module}.${requirement.resource}.${requirement.action}`
}
