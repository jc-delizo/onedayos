import type { ProcessFlowDefinition, ProcessFlowStep } from '@/sdk'
import { StatusBadge } from '@/components/ui/status-badge'

function DiagramNode({ step }: { step: ProcessFlowStep }) {
  return (
    <div
      className="min-w-0 flex-1 rounded-[var(--radius-md)] border border-[var(--color-border-strong)] bg-[var(--color-surface-raised)] p-3"
      data-process-step={step.id}
    >
      <div className="mb-2 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-[var(--color-muted)]">
          {step.number ? `Step ${step.number}` : 'Current'}
        </span>
        <StatusBadge variant="success">Implemented</StatusBadge>
      </div>
      <p className="text-sm font-semibold text-[var(--color-foreground)]">{step.title}</p>
    </div>
  )
}
function Arrow({ label }: { label?: string }) {
  return (
    <div className="flex shrink-0 flex-col items-center justify-center gap-1 px-1 py-2 text-center text-[var(--color-muted)] lg:px-2 lg:py-0">
      {label ? <span className="text-[10px] font-medium uppercase tracking-wide">{label}</span> : null}
      <svg
        aria-hidden="true"
        className="h-7 w-7 rotate-90 lg:rotate-0"
        viewBox="0 0 28 28"
        fill="none"
      >
        <path d="M3 14H24M18 8L24 14L18 20" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </div>
  )
}

function deriveDiagram(definition: ProcessFlowDefinition) {
  const steps = definition.steps.filter((step) => step.status !== 'planned')
  const stepById = new Map(steps.map((step) => [step.id, step]))
  const outgoing = new Map<string, Array<{ to: string; label?: string }>>()
  const incoming = new Set<string>()

  for (const connection of definition.connections ?? []) {
    if (!stepById.has(connection.from) || !stepById.has(connection.to)) continue
    outgoing.set(connection.from, [...(outgoing.get(connection.from) ?? []), {
      to: connection.to,
      label: connection.label,
    }])
    incoming.add(connection.to)
  }

  const root = steps.find((step) => !incoming.has(step.id)) ?? steps[0]
  if (!root) return { prelude: [], branches: [] }

  const prelude: ProcessFlowStep[] = []
  let cursor: ProcessFlowStep | undefined = root
  while (cursor) {
    prelude.push(cursor)
    const next = outgoing.get(cursor.id) ?? []
    if (next.length !== 1) break
    cursor = stepById.get(next[0].to)
  }

  const branchOrigin = prelude.at(-1)
  const branches = (branchOrigin ? outgoing.get(branchOrigin.id) ?? [] : []).map((connection) => {
    const branch: Array<{ step: ProcessFlowStep; label?: string }> = []
    let nextConnection: { to: string; label?: string } | undefined = connection
    const visited = new Set<string>()

    while (nextConnection && !visited.has(nextConnection.to)) {
      visited.add(nextConnection.to)
      const step = stepById.get(nextConnection.to)
      if (!step) break
      branch.push({ step, label: nextConnection.label })
      const next = outgoing.get(step.id) ?? []
      nextConnection = next.length === 1 ? next[0] : undefined
    }

    return branch
  })

  return { prelude, branches }
}

export function ProcessFlowDiagram({ definition }: { definition: ProcessFlowDefinition }) {
  const { prelude, branches } = deriveDiagram(definition)

  return (
    <section aria-labelledby="implemented-flow-heading" className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 id="implemented-flow-heading" className="text-base font-semibold text-[var(--color-foreground)]">
          Implemented now
        </h2>
        <StatusBadge variant="success">Current demo behavior</StatusBadge>
      </div>
      <p className="text-sm leading-6 text-[var(--color-muted)]">
        Follow the numbered text details below for the same sequence without relying on arrows, layout, or color.
      </p>
      <div
        aria-hidden="true"
        className="rounded-[var(--radius-md)] border border-[var(--color-border)] bg-[var(--color-surface)] p-4"
        data-process-flow-diagram
        data-mobile-layout="vertical"
      >
        <div className="flex flex-col lg:flex-row lg:items-stretch">
          {prelude.map((step, index) => (
            <div key={step.id} className="contents">
              <DiagramNode step={step} />
              {index < prelude.length - 1 ? <Arrow /> : null}
            </div>
          ))}
        </div>
        {branches.length > 0 ? (
          <>
            <div className="flex justify-center py-2">
              <svg aria-hidden="true" className="h-8 w-8 text-[var(--color-muted)]" viewBox="0 0 32 32" fill="none">
                <path d="M16 2V14M16 14H6V28M16 14H26V28" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div className="grid gap-4 lg:grid-cols-2">
              {branches.map((branch, branchIndex) => (
                <div
                  key={branch[0]?.step.id ?? branchIndex}
                  className="flex min-w-0 flex-col rounded-[var(--radius-md)] border border-dashed border-[var(--color-border-strong)] bg-[var(--color-surface-muted)] p-3"
                >
                  {branch.map(({ step, label }, index) => (
                    <div key={step.id} className="contents">
                      {index === 0 && label ? (
                        <p className="mb-2 text-center text-[10px] font-medium uppercase tracking-wide text-[var(--color-muted)]">{label}</p>
                      ) : null}
                      <DiagramNode step={step} />
                      {index < branch.length - 1 ? <Arrow /> : null}
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  )
}
