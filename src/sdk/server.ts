import 'server-only'
import type { NextRequest } from 'next/server'
import type { z } from 'zod'
import type { PlatformContext, PermissionRequirement, TenantDb } from './types'
import { OneDayOSError } from './errors'
import type { ApiResponse } from './api-types'
import { moduleRegistry } from '@/platform/module-loader'
import { ApiException, apiErrors } from '@/kernel/api/errors'
import { parseStrictJsonBody, parseStrictRouteParams, parseStrictSearchParams } from '@/kernel/api/json'
import { apiSuccess, apiCreated, apiFailure } from '@/kernel/api/response'
import { withApiHandler } from '@/kernel/api/route'
import { getApiAuthUser, requireApiAuth } from '@/kernel/auth/api'
import { requirePageAuth } from '@/kernel/auth/page'
import { createSupabaseServerClient } from '@/kernel/auth/server'
import { getCurrentPlatformUser, requireCurrentPlatformUser } from '@/kernel/context/current-user'
import { requireApiModuleContext, requireApiOrgContext } from '@/kernel/context/api-org-context'
import { isPlatformContext } from '@/kernel/context/platform-context'
import { createTenantDb } from '@/kernel/db/tenant-db'
import { can } from '@/kernel/permissions/match'
import { requireAllPermissions, requireAnyPermission, requirePermission } from '@/kernel/permissions/enforce'
import { isModuleEnabled, requireModuleEnabled } from '@/kernel/modules/enablement'
import { getInventoryV2RuntimeConfig } from '@/kernel/env/server'

function getDb(ctx: PlatformContext): TenantDb {
  if (!isPlatformContext(ctx)) {
    throw new OneDayOSError('sdk.getDb requires a verified PlatformContext.', 'INVALID_PLATFORM_CONTEXT')
  }

  return createTenantDb(ctx)
}

async function getSession() {
  const supabase = await createSupabaseServerClient()
  const { data } = await supabase.auth.getSession()
  return data.session
}

function canAny(ctx: PlatformContext, requirements: PermissionRequirement[]): boolean {
  return requirements.some((requirement) => can(ctx, requirement))
}

function canAll(ctx: PlatformContext, requirements: PermissionRequirement[]): boolean {
  return requirements.every((requirement) => can(ctx, requirement))
}

async function parseJsonBody<T extends z.ZodType>(request: Request, schema: T): Promise<z.infer<T>> {
  return parseStrictJsonBody(request, schema)
}

function parseSearchParams<T extends z.ZodType>(
  searchParams: URLSearchParams | Record<string, string | string[] | undefined>,
  schema: T,
): z.infer<T> {
  return parseStrictSearchParams(searchParams, schema)
}

function parseRouteParams<T extends z.ZodType>(
  params: Record<string, string | string[] | undefined>,
  schema: T,
): z.infer<T> {
  return parseStrictRouteParams(params, schema)
}

function hideDisabledModule(error: unknown): never {
  if (error instanceof ApiException && error.code === 'MODULE_DISABLED') {
    throw apiErrors.moduleNotFound()
  }

  throw error
}

async function requireSdkPageModuleContext(
  orgSlug: string,
  moduleId: string,
  requestId?: string,
): Promise<PlatformContext> {
  try {
    const ctx = await requireSdkPageOrgContext(orgSlug, requestId)
    await requireModuleEnabled(ctx, moduleId)
    return ctx
  } catch (error) {
    hideDisabledModule(error)
  }
}

async function requireSdkPageOrgContext(orgSlug: string, requestId?: string): Promise<PlatformContext> {
  const authUser = await requirePageAuth()
  return requireApiOrgContext(orgSlug, { requestId, authUser })
}

async function requireSdkApiModuleContext(
  _request: NextRequest,
  orgSlug: string,
  moduleId: string,
  requestId?: string,
): Promise<PlatformContext> {
  try {
    return await requireApiModuleContext(orgSlug, moduleId, { requestId })
  } catch (error) {
    hideDisabledModule(error)
  }
}

async function emit(ctx: PlatformContext, eventName: string, payload: unknown) {
  if (!isPlatformContext(ctx)) {
    throw new OneDayOSError('sdk.events.emit requires a verified PlatformContext.', 'INVALID_PLATFORM_CONTEXT')
  }

  if (!/^[a-z][a-z0-9-]*\.[a-z][a-z0-9_]*\.[a-z][a-z0-9_]*$/.test(eventName)) {
    throw new OneDayOSError('Event names must follow namespace.entity.past_tense_verb.', 'VALIDATION_ERROR')
  }

  return {
    eventName,
    payload,
    context: {
      organization: ctx.org.id,
      actor: ctx.user.id,
      requestId: ctx.requestId,
    },
    emittedAt: new Date().toISOString(),
  }
}

export const sdk = {
  runtime: {
    isInventoryV2Enabled: () => getInventoryV2RuntimeConfig().enabled,
    requireInventoryV2: () => {
      if (!getInventoryV2RuntimeConfig().enabled) throw apiErrors.moduleNotFound()
    },
  },
  auth: {
    getSession,
    getAuthUser: getApiAuthUser,
    requirePageAuth,
    requireApiAuth,
    getCurrentUser: getCurrentPlatformUser,
    requireCurrentUser: requireCurrentPlatformUser,
    requirePageOrgContext: requireSdkPageOrgContext,
    requirePageModuleContext: requireSdkPageModuleContext,
    requireApiOrgContext: (_request: NextRequest, orgSlug: string, requestId?: string) =>
      requireApiOrgContext(orgSlug, { requestId }),
    requireApiModuleContext: requireSdkApiModuleContext,
  },
  context: {
    requireApiOrgContext: (_request: NextRequest, params: { orgSlug: string }, requestId?: string) =>
      requireApiOrgContext(params.orgSlug, { requestId }),
    requireApiModuleContext: (
      _request: NextRequest,
      params: { orgSlug: string; moduleId: string },
      requestId?: string,
    ) => requireApiModuleContext(params.orgSlug, params.moduleId, { requestId }),
  },
  permissions: {
    can,
    require: requirePermission,
    canAny,
    requireAny: requireAnyPermission,
    canAll,
    requireAll: requireAllPermissions,
  },
  modules: {
    isEnabled: isModuleEnabled,
    requireEnabled: requireModuleEnabled,
    registry: moduleRegistry,
  },
  api: {
    handle: withApiHandler,
    ok: apiSuccess,
    success: apiSuccess,
    created: apiCreated,
    failure: apiFailure,
    parseJsonBody,
    parseSearchParams,
    parseRouteParams,
  },
  events: {
    emit,
  },
  getDb,
}

export type ServerApiResponse<T> = ApiResponse<T>
