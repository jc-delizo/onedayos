import { existsSync } from 'node:fs'
import { config as loadDotenv } from 'dotenv'
import { PRODUCT_CATEGORY_PERMISSIONS, PRODUCT_PERMISSIONS } from '../src/business-objects/product/permissions'
import { SUPPLIER_PERMISSIONS } from '../src/business-objects/supplier/permissions'
import { CUSTOMER_PERMISSIONS } from '../src/business-objects/customer/permissions'
import { WAREHOUSE_PERMISSIONS } from '../src/business-objects/warehouse/permissions'
import { INVENTORY_PERMISSIONS } from '../src/modules/inventory/permissions'

export const DEMO_ORG_SLUG_ENV = 'ONEDAYOS_DEMO_ORG_SLUG'
export const WAREHOUSE_OPERATOR_ROLE_NAME = 'Warehouse Operator'

export const PLACEHOLDER_PATTERNS = [
  /YOUR-PASSWORD/i,
  /\[YOUR-PASSWORD\]/i,
  /CHOOSE_A_STRONG_PASSWORD/i,
  /^password$/i,
  /^password123$/i,
  /^Password123!?$/i,
  /^admin$/i,
  /^admin123$/i,
  /^warehouse$/i,
  /^warehouse123$/i,
  /^demo$/i,
  /^demo123$/i,
  /^changeme$/i,
  /^USE_A_STRONG_PASSWORD$/i,
  /^your-/i,
  /placeholder/i,
  /<Founder chooses strong password>/i,
] as const

export const CONTROLLED_DEMO_REQUIRED_ENV = [
  'DATABASE_URL',
  'DIRECT_URL',
  'NEXT_PUBLIC_SUPABASE_URL',
  'NEXT_PUBLIC_SUPABASE_ANON_KEY',
  'NEXT_PUBLIC_APP_URL',
  'ONEDAYOS_DEMO_MODE',
  'ONEDAYOS_PUBLIC_REGISTRATION_ENABLED',
  'ONEDAYOS_SANDBOX_DB_APPROVED',
  'ONEDAYOS_DEMO_ADMIN_EMAIL',
  'ONEDAYOS_DEMO_ADMIN_PASSWORD',
  'ONEDAYOS_DEMO_ORG_NAME',
  'ONEDAYOS_DEMO_ORG_SLUG',
  'ONEDAYOS_DEMO_WAREHOUSE_EMAIL',
  'ONEDAYOS_DEMO_WAREHOUSE_PASSWORD',
  'ONEDAYOS_DEMO_WAREHOUSE_NAME',
] as const

export const DEMO_RESET_REQUIRED_ENV = [
  ...CONTROLLED_DEMO_REQUIRED_ENV,
  'ONEDAYOS_DEMO_RESET_APPROVED',
] as const

export const WAREHOUSE_OPERATOR_PERMISSION_PROFILE = [
  INVENTORY_PERMISSIONS.DASHBOARD_READ,
  INVENTORY_PERMISSIONS.PRODUCT_SETTING_READ,
  INVENTORY_PERMISSIONS.STOCK_LEVEL_READ,
  INVENTORY_PERMISSIONS.STOCK_MOVEMENT_READ,
  INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_READ,
  INVENTORY_PERMISSIONS.STOCK_ADJUSTMENT_CREATE,
  PRODUCT_PERMISSIONS.READ,
  PRODUCT_CATEGORY_PERMISSIONS.READ,
  SUPPLIER_PERMISSIONS.READ,
  WAREHOUSE_PERMISSIONS.READ,
] as const

// V2-6D cutover input only. The current controlled demo profile remains unchanged in V2-6C.
export const WAREHOUSE_OPERATOR_V2_PERMISSION_PROFILE = [
  ...WAREHOUSE_OPERATOR_PERMISSION_PROFILE,
  INVENTORY_PERMISSIONS.RECEIPT_READ,
  INVENTORY_PERMISSIONS.RECEIPT_CREATE,
  INVENTORY_PERMISSIONS.ISSUE_READ,
  INVENTORY_PERMISSIONS.ISSUE_CREATE,
  INVENTORY_PERMISSIONS.TRANSFER_READ,
  INVENTORY_PERMISSIONS.TRANSFER_CREATE,
  INVENTORY_PERMISSIONS.ADJUSTMENT_READ,
  INVENTORY_PERMISSIONS.ADJUSTMENT_CREATE,
  CUSTOMER_PERMISSIONS.READ,
] as const

export const WAREHOUSE_OPERATOR_PERMISSION_KEYS = WAREHOUSE_OPERATOR_PERMISSION_PROFILE.map(permissionKey).sort()

export const CANONICAL_DEMO_CATEGORY = {
  name: 'Beverages',
} as const

export const CANONICAL_DEMO_WAREHOUSE = {
  code: 'MAIN',
  name: 'Main Warehouse',
  address: 'Sandbox demo warehouse',
} as const

export const CANONICAL_DEMO_SECONDARY_WAREHOUSE = {
  code: 'SECONDARY',
  name: 'Secondary Warehouse',
  address: 'Sandbox secondary demo warehouse',
} as const

export const CANONICAL_DEMO_SUPPLIER = {
  name: 'Demo Supplier Co.',
  email: 'supplier@example.test',
  phone: '+10000000000',
  address: 'Sandbox supplier address',
} as const

export const CANONICAL_DEMO_CUSTOMER = {
  name: 'Demo Customer',
  email: 'customer@example.test',
  phone: '+10000000001',
  address: 'Sandbox customer address',
} as const

export const CANONICAL_V2_REFERENCE_NUMBERS = {
  receipt: 'DEMO-REC-001',
  transfer: 'DEMO-TRF-001',
  issue: 'DEMO-ISS-001',
  adjustment: 'DEMO-ADJ-001',
} as const

export const CANONICAL_DEMO_PRODUCTS = [
  { code: 'WAT-500', name: 'Bottled Water 500ml', unit: 'bottle', quantity: '120', reorderPoint: '50' },
  { code: 'TEA-1L', name: 'Iced Tea 1L', unit: 'bottle', quantity: '35', reorderPoint: '25' },
  { code: 'COF-1KG', name: 'Coffee Beans 1kg', unit: 'bag', quantity: '8', reorderPoint: '10' },
] as const

export type CanonicalDemoActivityStep = {
  quantityBefore: string
  quantityAfter: string
  reason: string
  occurredAt: Date
}

const CANONICAL_DEMO_ACTIVITY = {
  'WAT-500': [
    { daysAgo: 24, quantityBefore: '0', quantityAfter: '100', reason: 'Sandbox opening balance' },
    { daysAgo: 12, quantityBefore: '100', quantityAfter: '135', reason: 'Sandbox cycle count increase' },
    { daysAgo: 3, quantityBefore: '135', quantityAfter: '120', reason: 'Sandbox cycle count correction' },
  ],
  'TEA-1L': [
    { daysAgo: 23, quantityBefore: '0', quantityAfter: '30', reason: 'Sandbox opening balance' },
    { daysAgo: 11, quantityBefore: '30', quantityAfter: '42', reason: 'Sandbox cycle count increase' },
    { daysAgo: 2, quantityBefore: '42', quantityAfter: '35', reason: 'Sandbox cycle count correction' },
  ],
  'COF-1KG': [
    { daysAgo: 22, quantityBefore: '0', quantityAfter: '10', reason: 'Sandbox opening balance' },
    { daysAgo: 10, quantityBefore: '10', quantityAfter: '14', reason: 'Sandbox cycle count increase' },
    { daysAgo: 1, quantityBefore: '14', quantityAfter: '8', reason: 'Sandbox cycle count correction' },
  ],
} as const

function utcDemoTimestamp(now: Date, daysAgo: number, hour: number): Date {
  return new Date(Date.UTC(
    now.getUTCFullYear(),
    now.getUTCMonth(),
    now.getUTCDate() - daysAgo,
    hour,
  ))
}

export function buildCanonicalDemoActivity(
  now: Date,
): Record<(typeof CANONICAL_DEMO_PRODUCTS)[number]['code'], CanonicalDemoActivityStep[]> {
  return Object.fromEntries(
    CANONICAL_DEMO_PRODUCTS.map((product, productIndex) => [
      product.code,
      CANONICAL_DEMO_ACTIVITY[product.code].map((step) => ({
        quantityBefore: step.quantityBefore,
        quantityAfter: step.quantityAfter,
        reason: step.reason,
        occurredAt: utcDemoTimestamp(now, step.daysAgo, 9 + productIndex),
      })),
    ]),
  ) as Record<(typeof CANONICAL_DEMO_PRODUCTS)[number]['code'], CanonicalDemoActivityStep[]>
}

export function loadDemoEnvFiles(): void {
  if (existsSync('.env.local')) {
    loadDotenv({ path: '.env.local', override: false, quiet: true })
  }

  loadDotenv({ override: false, quiet: true })
}

export function permissionKey(permission: { module: string; resource: string; action: string }): string {
  return `${permission.module}.${permission.resource}.${permission.action}`
}

export function hasPlaceholderValue(value: string | undefined): boolean {
  if (!value) return true
  return PLACEHOLDER_PATTERNS.some((pattern) => pattern.test(value))
}

export function parseBooleanFlag(value: string | undefined, defaultValue: boolean): boolean {
  if (value === undefined || value === '') return defaultValue
  if (value === 'true') return true
  if (value === 'false') return false
  throw new Error('Boolean demo flags must be true or false.')
}

export function usesPort1320(value: string | undefined): boolean {
  return Boolean(value && /:1320\/?$/.test(value))
}

export function quantityDelta(before: string, after: string): string {
  return String(Number(after) - Number(before))
}

export function stockMovementType(before: string, after: string): string {
  const beforeValue = Number(before)
  const afterValue = Number(after)

  if (beforeValue === 0 && afterValue > 0) return 'opening_balance'
  return afterValue > beforeValue ? 'adjustment_in' : 'adjustment_out'
}
