import type { ModuleSettingDefinition } from '@/sdk'

// Inventory settings such as negative-stock allowance are intentionally deferred.
export const inventorySettings = [] satisfies ModuleSettingDefinition[]
