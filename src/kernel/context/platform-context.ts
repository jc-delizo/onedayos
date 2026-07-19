import type { PlatformContext } from '@/sdk'

const platformContextBrand = Symbol.for('onedayos.platform-context')

export type VerifiedPlatformContext = PlatformContext & {
  readonly [platformContextBrand]: true
}

export function markPlatformContext(ctx: PlatformContext): VerifiedPlatformContext {
  Object.defineProperty(ctx, platformContextBrand, {
    value: true,
    enumerable: false,
  })

  return ctx as VerifiedPlatformContext
}

export function isPlatformContext(value: unknown): value is VerifiedPlatformContext {
  return Boolean(
    value &&
      typeof value === 'object' &&
      (value as Record<PropertyKey, unknown>)[platformContextBrand] === true,
  )
}
