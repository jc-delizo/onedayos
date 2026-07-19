import { describe, expect, it } from 'vitest'
import { CUSTOMER_EVENTS, customerEventPayloadSchema } from '../customer/events'
import { EMPLOYEE_EVENTS, employeeEventPayloadSchema } from '../employee/events'
import { PRODUCT_CATEGORY_EVENTS, PRODUCT_EVENTS, productCategoryEventPayloadSchema, productEventPayloadSchema } from '../product/events'
import { SUPPLIER_EVENTS, supplierEventPayloadSchema } from '../supplier/events'
import { WAREHOUSE_EVENTS, warehouseEventPayloadSchema } from '../warehouse/events'

describe('Business Object events', () => {
  it('uses the objects namespace for all shared record events', () => {
    const eventNames = [
      ...Object.values(EMPLOYEE_EVENTS),
      ...Object.values(PRODUCT_EVENTS),
      ...Object.values(PRODUCT_CATEGORY_EVENTS),
      ...Object.values(CUSTOMER_EVENTS),
      ...Object.values(SUPPLIER_EVENTS),
      ...Object.values(WAREHOUSE_EVENTS),
    ]

    for (const eventName of eventNames) {
      expect(eventName).toMatch(/^objects\.[a-z_]+\.[a-z_]+$/)
    }
  })

  it('allows minimal event payloads and rejects tenant ids or full records', () => {
    const cases = [
      { schema: employeeEventPayloadSchema, payload: { employeeId: 'employee_a', changedFields: ['name'] } },
      { schema: productEventPayloadSchema, payload: { productId: 'product_a', changedFields: ['name'] } },
      { schema: productCategoryEventPayloadSchema, payload: { productCategoryId: 'category_a', changedFields: ['name'] } },
      { schema: customerEventPayloadSchema, payload: { customerId: 'customer_a', changedFields: ['name'] } },
      { schema: supplierEventPayloadSchema, payload: { supplierId: 'supplier_a', changedFields: ['name'] } },
      { schema: warehouseEventPayloadSchema, payload: { warehouseId: 'warehouse_a', changedFields: ['name'] } },
    ]

    for (const { schema, payload } of cases) {
      expect(schema.safeParse(payload).success).toBe(true)
      expect(schema.safeParse({ ...payload, orgId: 'org_a' }).success).toBe(false)
      expect(schema.safeParse({ ...payload, name: 'Full Record' }).success).toBe(false)
    }
  })
})
