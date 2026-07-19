'use client'

import { Button } from '@/components/ui/button'
import { SafePageErrorState } from '@/components/onedayos'

export default function OrganizationError({ reset }: { error: Error; reset: () => void }) {
  return (
    <SafePageErrorState
      title="Unable to load Organization"
      message="Organization admin content could not be loaded. Try again or contact an Org Admin if access is expected."
      action={<Button onClick={reset} variant="secondary">Retry</Button>}
    />
  )
}
