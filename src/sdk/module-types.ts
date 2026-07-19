import type { PermissionRequirement } from './types'

export const MODULE_MANIFEST_SCHEMA_VERSION = '1' as const

export type ModuleLifecycle = 'draft' | 'beta' | 'stable' | 'deprecated'

export type ModuleCompatibilityRange = {
  min: string
  max: string | null
}

export type ModuleCompatibility = {
  platform: ModuleCompatibilityRange
  sdk: ModuleCompatibilityRange
  manifest: ModuleCompatibilityRange
}

export type ModulePermissionDefinition = PermissionRequirement & {
  label: string
  description: string
}

export type ModuleNavigationItem = {
  key: string
  label: string
  href: string
  icon: string
  requiredPermission: PermissionRequirement
}

export type ModuleRouteDefinition = {
  kind: 'page'
  path: string
  label: string
  requiredPermission: PermissionRequirement
}

export type ModuleApiDefinition = {
  method: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  path: string
  requiredPermission: PermissionRequirement
}

export type ModuleEventDefinition = {
  name: string
  description: string
}

export type ModuleEventContract = {
  emits: ModuleEventDefinition[]
  listens: ModuleEventDefinition[]
}

export type ModuleSettingDefinition = {
  key: string
  label: string
  type: 'boolean' | 'number' | 'string' | 'json'
  description: string
  defaultValue?: unknown
}

export type ModuleAiContext = {
  description: string
  businessPurpose: string
  commonQuestions: string[]
  supportedActions: string[]
  forbiddenActions: string[]
}

export type ModuleDocsDefinition = {
  readme: string
  manual: string
}

export type ModuleOwnedEntityDefinition = {
  key: string
  label: string
  description: string
}

export type ModuleManifest = {
  schemaVersion: typeof MODULE_MANIFEST_SCHEMA_VERSION
  id: string
  label: string
  description: string
  version: string
  lifecycle: ModuleLifecycle
  compatibility: ModuleCompatibility
  icon: string
  dependencies: string[]
  businessObjectsUsed: string[]
  ownedEntities: ModuleOwnedEntityDefinition[]
  permissions: ModulePermissionDefinition[]
  navItems: ModuleNavigationItem[]
  routes: ModuleRouteDefinition[]
  apis: ModuleApiDefinition[]
  events: ModuleEventContract
  settings: ModuleSettingDefinition[]
  aiContext: ModuleAiContext
  docs: ModuleDocsDefinition
}

export function defineModuleManifest<const T extends ModuleManifest>(manifest: T): T {
  return manifest
}
