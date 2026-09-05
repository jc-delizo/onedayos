import 'server-only'
import type { NextRequest } from 'next/server'
import { sdk } from '@/sdk/server'
import { handleExportRoute } from './route-handler'
import {
  inventoryExportResource,
  objectExportResource,
  organizationExportResource,
  type ObjectExportKind,
} from './resources'

type RouteContext = { params: Promise<{ orgSlug: string }> }

export function createInventoryExportPost(
  kind: 'stock-levels' | 'stock-movements' | 'stock-adjustments' | 'receipts' | 'issues' | 'transfers' | 'adjustments',
) {
  return function POST(request: NextRequest, context: RouteContext) {
    return sdk.api.handle(async (handledRequest, requestId) => {
      if (['receipts', 'issues', 'transfers', 'adjustments'].includes(kind)) {
        sdk.runtime.requireInventoryV2()
      }
      const { orgSlug } = await context.params
      const ctx = await sdk.auth.requireApiModuleContext(handledRequest, orgSlug, 'inventory', requestId)
      return handleExportRoute(handledRequest, ctx, inventoryExportResource(ctx, kind))
    })(request)
  }
}

export function createObjectExportPost(kind: ObjectExportKind) {
  return function POST(request: NextRequest, context: RouteContext) {
    return sdk.api.handle(async (handledRequest, requestId) => {
      const { orgSlug } = await context.params
      const ctx = await sdk.auth.requireApiOrgContext(handledRequest, orgSlug, requestId)
      return handleExportRoute(handledRequest, ctx, objectExportResource(ctx, kind))
    })(request)
  }
}

export function createOrganizationExportPost(kind: 'branches' | 'departments') {
  return function POST(request: NextRequest, context: RouteContext) {
    return sdk.api.handle(async (handledRequest, requestId) => {
      const { orgSlug } = await context.params
      const ctx = await sdk.auth.requireApiOrgContext(handledRequest, orgSlug, requestId)
      return handleExportRoute(handledRequest, ctx, organizationExportResource(ctx, kind))
    })(request)
  }
}
