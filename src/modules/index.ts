import { inventoryManifest } from './inventory/manifest'
import type { ModuleManifest } from '@/sdk'

// Module manifest imports are maintained by scripts/create-module.ts.
export const moduleManifests = [
  inventoryManifest,
] as const satisfies readonly ModuleManifest[]
