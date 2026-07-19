import type { ProcessFlowDefinition, ProcessFlowStep } from '@/sdk'
import { StatusBadge } from '@/components/ui/status-badge'
import { Surface } from '@/components/ui/surface'
import type { AppPageProps } from './app-page'
import { AppPage } from './app-page'

type ProcessFlowPageProps = Omit<AppPageProps, 'title' | 'description' | 'children' | 'primaryAction' | 'secondaryActions'> & {
  definition: ProcessFlowDefinition
}

function DetailList({ title, items }: { title: string; items?: readonly string[] }) {
  if (!items || items.length === 0) return null

  return (
    <div className="space-y-1.5">
      <h4 className="text-xs font-semibold uppercase tracking-normal text-[var(--color-muted)]">{title}</h4>
      <ul className="list-inside list-disc space-y-1 text-sm text-[var(--color-muted)]">
        {items.map((item) => (
          <li key={item} className="leading-6">{item}</li>
        ))}
      </ul>
    </div>
  )
}

function StepCard({ step, index }: { step: ProcessFlowStep; index: number }) {
  const number = step.number ?? index + 1

  return (
    <li>
      <Surface className="h-full space-y-4 p-4">
        <div className="flex items-start gap-3">
          <span
            aria-label={`Step ${number}`}
            className="grid size-8 shrink-0 place-items-center rounded-full border border-[var(--color-border)] bg-[var(--color-surface-raised)] text-sm font-semibold text-[var(--color-foreground)]"
          >
            {number}
          </span>
          <div className="min-w-0 space-y-1">
            <h3 className="text-base font-semibold text-[var(--color-foreground)]">{step.title}</h3>
            <p className="text-sm leading-6 text-[var(--color-muted)]">{step.description}</p>
          </div>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <DetailList title="Inputs" items={step.inputs} />
          <DetailList title="Outputs" items={step.outputs} />
        </div>
        {step.warning ? (
          <p role="note" className="rounded-[var(--radius-sm)] border border-[var(--color-warning)] bg-[var(--color-warning-soft)] px-3 py-2 text-sm leading-6 text-[var(--color-warning)]">
            {step.warning}
          </p>
        ) : null}
      </Surface>
    </li>
  )
}

function OwnershipPanel({ title, items, variant }: { title: string; items: readonly string[]; variant: 'brand' | 'neutral' }) {
  return (
    <Surface className="space-y-3 p-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="text-base font-semibold text-[var(--color-foreground)]">{title}</h2>
        <StatusBadge variant={variant}>{items.length}</StatusBadge>
      </div>
      <ul className="list-inside list-disc space-y-2 text-sm text-[var(--color-muted)]">
        {items.map((item) => (
          <li key={item} className="leading-6">{item}</li>
        ))}
      </ul>
    </Surface>
  )
}

export function ProcessFlowPage({ definition, ...appPageProps }: ProcessFlowPageProps) {
  return (
    <AppPage {...appPageProps} title={definition.title} description={definition.description} contentWidth="wide">
      <section aria-labelledby="process-flow-steps" className="space-y-4">
        <h2 id="process-flow-steps" className="text-base font-semibold text-[var(--color-foreground)]">
          Process steps
        </h2>
        <ol className="grid gap-4 lg:grid-cols-2">
          {definition.steps.map((step, index) => (
            <StepCard key={step.id} step={step} index={index} />
          ))}
        </ol>
      </section>

      <section aria-label="Ownership boundaries" className="grid gap-4 lg:grid-cols-2">
        <OwnershipPanel title="What this module owns" items={definition.owns} variant="brand" />
        <OwnershipPanel title="What this module does not own" items={definition.doesNotOwn} variant="neutral" />
      </section>

      {(definition.currentBoundaries?.length || definition.futureIntegrations?.length) ? (
        <section aria-label="MVP boundaries and future integrations" className="grid gap-4 lg:grid-cols-2">
          {definition.currentBoundaries?.length ? (
            <Surface className="space-y-3 p-4">
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">Current MVP boundaries</h2>
              <ul className="list-inside list-disc space-y-2 text-sm text-[var(--color-muted)]">
                {definition.currentBoundaries.map((item) => (
                  <li key={item} className="leading-6">{item}</li>
                ))}
              </ul>
            </Surface>
          ) : null}
          {definition.futureIntegrations?.length ? (
            <Surface className="space-y-3 p-4">
              <h2 className="text-base font-semibold text-[var(--color-foreground)]">Future integrations</h2>
              <ul className="list-inside list-disc space-y-2 text-sm text-[var(--color-muted)]">
                {definition.futureIntegrations.map((item) => (
                  <li key={item} className="leading-6">{item}</li>
                ))}
              </ul>
            </Surface>
          ) : null}
        </section>
      ) : null}
    </AppPage>
  )
}
