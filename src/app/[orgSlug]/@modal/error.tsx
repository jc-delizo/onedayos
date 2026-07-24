'use client'

import { RouteModal } from '@/components/onedayos'

export default function ModalError({ reset }: { reset: () => void }) {
  return (
    <RouteModal title="Unable to open dialog" description="The requested content could not be loaded safely." closeHref="/">
      <button type="button" className="text-sm underline" onClick={reset}>Try again</button>
    </RouteModal>
  )
}
