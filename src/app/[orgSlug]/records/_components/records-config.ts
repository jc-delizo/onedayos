import type { RecordFormField } from './record-form'

export type RecordAreaId =
  | 'employees'
  | 'products'
  | 'product-categories'
  | 'customers'
  | 'suppliers'
  | 'warehouses'

export type RecordAreaConfig = {
  id: RecordAreaId
  label: string
  singular: string
  description: string
  inventoryOwnership?: string
  endpoint: string
  fields: RecordFormField[]
}

export const recordAreas: RecordAreaConfig[] = [
  {
    id: 'employees',
    label: 'Employees',
    singular: 'Employee',
    endpoint: 'employees',
    description: 'Shared employee identity. People administration lives in Organization / People, and login access remains separate from employee records.',
    fields: [
      { name: 'employeeNo', label: 'Employee no.', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'position', label: 'Position' },
      { name: 'employmentType', label: 'Employment type' },
      { name: 'employmentStatus', label: 'Employment status', description: 'Use active, inactive, resigned, or terminated as operational status.' },
      { name: 'hiredAt', label: 'Hired at', type: 'date' },
      { name: 'endedAt', label: 'Ended at', type: 'date' },
    ],
  },
  {
    id: 'products',
    label: 'Products',
    singular: 'Product',
    endpoint: 'products',
    description: 'Shared product/SKU identity used by Inventory and future modules.',
    inventoryOwnership: 'Shared Product identity used by Inventory and other apps. Inventory manages stock behavior, not Product identity.',
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'description', label: 'Description', type: 'textarea' },
      { name: 'unit', label: 'Unit', description: 'Defaults to pcs when left blank.' },
      { name: 'isActive', label: 'Active', type: 'checkbox', description: 'Operational product status, not deletion.' },
    ],
  },
  {
    id: 'product-categories',
    label: 'Categories',
    singular: 'Product category',
    endpoint: 'product-categories',
    description: 'Shared product classification used across product-based workflows.',
    inventoryOwnership: 'Shared Product Category identity used by Inventory and other product-based workflows.',
    fields: [
      { name: 'name', label: 'Name', required: true },
    ],
  },
  {
    id: 'customers',
    label: 'Customers',
    singular: 'Customer',
    endpoint: 'customers',
    description: 'Shared customer identity used by CRM and future customer-facing workflows. CRM is not implemented in this MVP.',
    inventoryOwnership: 'Shared Customer identity available for future issue references and customer-facing workflows. Inventory V2 issues and CRM are not implemented yet.',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'address', label: 'Address', type: 'textarea' },
    ],
  },
  {
    id: 'suppliers',
    label: 'Suppliers',
    singular: 'Supplier',
    endpoint: 'suppliers',
    description: 'Shared supplier identity used by Inventory, Purchasing, and future procurement workflows. Purchasing is not implemented in this MVP.',
    inventoryOwnership: 'Shared Supplier identity available to Inventory and future procurement workflows. Purchasing and receipts are not implemented yet.',
    fields: [
      { name: 'name', label: 'Name', required: true },
      { name: 'email', label: 'Email', type: 'email' },
      { name: 'phone', label: 'Phone', type: 'tel' },
      { name: 'address', label: 'Address', type: 'textarea' },
    ],
  },
  {
    id: 'warehouses',
    label: 'Warehouses',
    singular: 'Warehouse',
    endpoint: 'warehouses',
    description: 'Shared warehouse/location identity used by Inventory and future stock workflows.',
    inventoryOwnership: 'Shared Warehouse identity used by Inventory and future stock workflows.',
    fields: [
      { name: 'code', label: 'Code', required: true },
      { name: 'name', label: 'Name', required: true },
      { name: 'address', label: 'Address', type: 'textarea' },
      { name: 'isActive', label: 'Active', type: 'checkbox', description: 'Operational availability, not deletion.' },
    ],
  },
]

export function getRecordArea(id: RecordAreaId): RecordAreaConfig {
  const area = recordAreas.find((candidate) => candidate.id === id)

  if (!area) {
    throw new Error(`Unknown record area: ${id}`)
  }

  return area
}
