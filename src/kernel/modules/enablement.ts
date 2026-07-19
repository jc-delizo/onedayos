import type { PlatformContext } from '@/sdk'
import { apiErrors } from '@/kernel/api/errors'

export function isModuleEnabled(ctx: PlatformContext, moduleId: string): boolean {
  return moduleId === 'kernel' || ctx.enabledModules.includes(moduleId)
}

export async function requireModuleEnabled(ctx: PlatformContext, moduleId: string): Promise<void> {
  if (!isModuleEnabled(ctx, moduleId)) {
    throw apiErrors.moduleDisabled()
  }
}
