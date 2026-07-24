export default function ModalLoading() {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/45" role="status" aria-label="Loading dialog">
      <div className="h-48 w-[min(42rem,calc(100%-2rem))] animate-pulse rounded-[var(--radius-md)] bg-[var(--color-surface)]" />
    </div>
  )
}
