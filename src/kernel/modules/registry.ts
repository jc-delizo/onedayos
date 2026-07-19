import type { ModuleManifest, ModulePermissionDefinition, PermissionRequirement, PlatformContext } from '@/sdk'
import { can } from '@/kernel/permissions/match'
import { requireModuleEnabled } from './enablement'

export const MODULE_ID_REGEX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/

export const RESERVED_MODULE_IDS = new Set([
  'kernel',
  'objects',
  'settings',
  'admin',
  'api',
  'auth',
  'sdk',
  'platform',
  'components',
  'modules',
  'users',
  'organizations',
])

export type ModuleRegistryValidationError = {
  moduleId: string
  message: string
}

export type ModuleRegistryValidationResult =
  | {
      ok: true
      errors: []
    }
  | {
      ok: false
      errors: ModuleRegistryValidationError[]
    }

export type VisibleModule = {
  manifest: ModuleManifest
  navItems: ModuleManifest['navItems']
}

export type ModuleRegistry = {
  getAll(): ModuleManifest[]
  getById(moduleId: string): ModuleManifest | null
  has(moduleId: string): boolean
  getEnabledForOrg(ctx: PlatformContext): Promise<ModuleManifest[]>
  getVisibleForUser(ctx: PlatformContext): Promise<VisibleModule[]>
  assertRegistered(moduleId: string): ModuleManifest
  assertEnabled(ctx: PlatformContext, moduleId: string): Promise<ModuleManifest>
  validate(): ModuleRegistryValidationResult
}

export class ModuleRegistryError extends Error {
  constructor(readonly errors: ModuleRegistryValidationError[]) {
    super(errors.map((error) => `${error.moduleId}: ${error.message}`).join('\n'))
    this.name = 'ModuleRegistryError'
  }
}

function addError(errors: ModuleRegistryValidationError[], moduleId: string, message: string) {
  errors.push({ moduleId, message })
}

function isFullPermission(value: unknown): value is ModulePermissionDefinition {
  if (!value || typeof value !== 'object') {
    return false
  }

  const permission = value as Partial<ModulePermissionDefinition>
  return (
    typeof permission.module === 'string' &&
    typeof permission.resource === 'string' &&
    typeof permission.action === 'string' &&
    typeof permission.label === 'string' &&
    typeof permission.description === 'string'
  )
}

function isWildcardPermission(permission: PermissionRequirement): boolean {
  return permission.module === '*' || permission.resource === '*' || permission.action === '*'
}

function permissionKey(permission: PermissionRequirement): string {
  return `${permission.module}.${permission.resource}.${permission.action}`
}

function isValidEventName(eventName: string): boolean {
  return /^[a-z][a-z0-9-]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(eventName)
}

function validatePermission(
  errors: ModuleRegistryValidationError[],
  moduleId: string,
  permission: unknown,
  location: string,
): permission is ModulePermissionDefinition {
  if (!isFullPermission(permission)) {
    addError(errors, moduleId, `${location} must use a full permission object.`)
    return false
  }

  if (permission.module !== moduleId) {
    addError(errors, moduleId, `${location} must use the module namespace.`)
  }

  if (isWildcardPermission(permission)) {
    addError(errors, moduleId, `${location} must not declare wildcard permissions.`)
  }

  if (!permission.resource.trim() || !permission.action.trim()) {
    addError(errors, moduleId, `${location} must include non-empty resource and action.`)
  }

  return true
}

function validateManifest(manifest: ModuleManifest, knownIds: Set<string>, seenIds: Set<string>): ModuleRegistryValidationError[] {
  const errors: ModuleRegistryValidationError[] = []
  const moduleId = manifest.id || '<missing>'

  if (!MODULE_ID_REGEX.test(moduleId)) {
    addError(errors, moduleId, 'Module id must be lowercase kebab-case.')
  }

  if (RESERVED_MODULE_IDS.has(moduleId)) {
    addError(errors, moduleId, 'Module id is reserved by the platform.')
  }

  if (seenIds.has(moduleId)) {
    addError(errors, moduleId, 'Module id must be unique.')
  }

  seenIds.add(moduleId)

  if (manifest.schemaVersion !== '1') {
    addError(errors, moduleId, 'Manifest schemaVersion must be 1.')
  }

  for (const field of ['label', 'description', 'version', 'lifecycle', 'icon'] as const) {
    if (!manifest[field]) {
      addError(errors, moduleId, `Manifest ${field} is required.`)
    }
  }

  if (!manifest.compatibility?.platform?.min || !manifest.compatibility?.sdk?.min || !manifest.compatibility?.manifest?.min) {
    addError(errors, moduleId, 'Manifest compatibility windows are required.')
  }

  for (const dependency of manifest.dependencies) {
    if (!knownIds.has(dependency)) {
      addError(errors, moduleId, `Dependency ${dependency} is not registered.`)
    }

    if (dependency === moduleId) {
      addError(errors, moduleId, 'Module must not depend on itself.')
    }
  }

  const declaredPermissions = new Set<string>()

  for (const [index, permission] of manifest.permissions.entries()) {
    if (validatePermission(errors, moduleId, permission, `permissions[${index}]`)) {
      declaredPermissions.add(permissionKey(permission))
    }
  }

  for (const [index, item] of manifest.navItems.entries()) {
    if (!item.href.startsWith('/')) {
      addError(errors, moduleId, `navItems[${index}] href must be org-shell-relative.`)
    }

    if (item.href.startsWith('/api/')) {
      addError(errors, moduleId, `navItems[${index}] href must not point to an API route.`)
    }

    if (!declaredPermissions.has(permissionKey(item.requiredPermission))) {
      addError(errors, moduleId, `navItems[${index}] requiredPermission must be declared by the manifest.`)
    }
  }

  for (const [index, route] of manifest.routes.entries()) {
    if (!route.path.startsWith(`/${moduleId}`)) {
      addError(errors, moduleId, `routes[${index}] must stay inside the module route namespace.`)
    }

    if (!declaredPermissions.has(permissionKey(route.requiredPermission))) {
      addError(errors, moduleId, `routes[${index}] requiredPermission must be declared by the manifest.`)
    }
  }

  for (const [index, api] of manifest.apis.entries()) {
    if (!api.path.startsWith(`/api/orgs/[orgSlug]/${moduleId}`)) {
      addError(errors, moduleId, `apis[${index}] must use the tenant-scoped module API route.`)
    }

    if (!declaredPermissions.has(permissionKey(api.requiredPermission))) {
      addError(errors, moduleId, `apis[${index}] requiredPermission must be declared by the manifest.`)
    }
  }

  for (const event of manifest.events.emits) {
    if (!event.name.startsWith(`${moduleId}.`)) {
      addError(errors, moduleId, `Event ${event.name} must use the module namespace.`)
    }

    if (!isValidEventName(event.name)) {
      addError(errors, moduleId, `Event ${event.name} must follow namespace.entity.past_tense_verb.`)
    }
  }

  for (const event of manifest.events.listens) {
    if (!isValidEventName(event.name)) {
      addError(errors, moduleId, `Listened event ${event.name} must follow namespace.entity.past_tense_verb.`)
    }
  }

  return errors
}

export function validateModuleManifests(manifests: readonly ModuleManifest[]): ModuleRegistryValidationResult {
  const knownIds = new Set(manifests.map((manifest) => manifest.id))
  const seenIds = new Set<string>()
  const errors = manifests.flatMap((manifest) => validateManifest(manifest, knownIds, seenIds))

  return errors.length === 0 ? { ok: true, errors: [] } : { ok: false, errors }
}

export function createModuleRegistry(manifests: readonly ModuleManifest[]): ModuleRegistry {
  const validation = validateModuleManifests(manifests)

  if (!validation.ok) {
    throw new ModuleRegistryError(validation.errors)
  }

  const byId = new Map(manifests.map((manifest) => [manifest.id, manifest] as const))

  return Object.freeze({
    getAll: () => [...byId.values()],
    getById: (moduleId: string) => byId.get(moduleId) ?? null,
    has: (moduleId: string) => byId.has(moduleId),
    getEnabledForOrg: async (ctx: PlatformContext) =>
      [...byId.values()].filter((manifest) => ctx.enabledModules.includes(manifest.id)),
    getVisibleForUser: async (ctx: PlatformContext) =>
      [...byId.values()]
        .filter((manifest) => ctx.enabledModules.includes(manifest.id))
        .map((manifest) => ({
          manifest,
          navItems: manifest.navItems.filter((item) => can(ctx, item.requiredPermission)),
        }))
        .filter((entry) => entry.navItems.length > 0),
    assertRegistered(moduleId: string) {
      const manifest = byId.get(moduleId)

      if (!manifest) {
        throw new ModuleRegistryError([{ moduleId, message: 'Module is not registered.' }])
      }

      return manifest
    },
    async assertEnabled(ctx: PlatformContext, moduleId: string) {
      const manifest = this.assertRegistered(moduleId)
      await requireModuleEnabled(ctx, moduleId)
      return manifest
    },
    validate: () => validation,
  })
}
