export type PermissionRequirement = {
  module: string
  resource: string
  action: string
}

export type PermissionGrant = {
  id: string
  roleId: string
  orgId: string
  module: string
  resource: string
  action: string
  conditions: unknown | null
}

export type PlatformContext = {
  requestId: string
  auth: {
    provider: 'supabase'
    userId: string
    email: string | null
  }
  user: {
    id: string
    orgId: string
    name: string
    email: string
    isActive: boolean
  }
  org: {
    id: string
    slug: string
    name: string
    isActive: boolean
    status: 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
    subscriptionStatus: 'TRIAL' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'
    plan: string
  }
  roles: Array<{
    id: string
    name: string
    isSystem: boolean
  }>
  permissions: PermissionGrant[]
  enabledModules: string[]
}

export type AuthenticatedUser = {
  id: string
  email: string | null
}

export type TenantDb = {
  orgId: string
  prisma: unknown
}
