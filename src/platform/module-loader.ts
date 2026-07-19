import { createModuleRegistry } from '@/kernel/modules/registry'
import { moduleManifests } from '@/modules'

export const moduleRegistry = createModuleRegistry(moduleManifests)
