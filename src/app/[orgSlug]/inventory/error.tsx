'use client'

import { SafePageErrorState } from '@/components/onedayos'

export default function InventoryError() {
  return <SafePageErrorState title="Unable to load Inventory" message="The Inventory module could not be loaded." />
}
