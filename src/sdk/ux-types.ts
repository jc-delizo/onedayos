export type ModuleUxContract = {
  primaryUsers: readonly string[]
  userGoals: readonly string[]
  primaryTasks: readonly string[]
  taskFrequency: readonly string[]
  workEnvironment: readonly string[]
  requiredKnowledge: readonly string[]
  relatedBusinessObjects: readonly string[]
  moduleOwnedRecords: readonly string[]
  criticalErrorsToPrevent: readonly string[]
  permissionRoles: readonly string[]
  appNavigation: readonly string[]
  pageMap: readonly string[]
  defaultLandingPage: string
  processFlowRoute: string
  keyboardWorkflows: readonly string[]
  accessibilityRequirements: readonly string[]
  usabilityTestScenarios: readonly string[]
  knownMvpLimitations: readonly string[]
  futureIntegrations: readonly string[]
}

export type ProcessFlowStep = {
  id: string
  number?: number
  title: string
  description: string
  inputs?: readonly string[]
  outputs?: readonly string[]
  warning?: string
  status?: 'current' | 'planned'
}

export type ProcessFlowConnection = {
  from: string
  to: string
  label?: string
}

export type ProcessFlowDefinition = {
  title: string
  description: string
  steps: readonly ProcessFlowStep[]
  connections?: readonly ProcessFlowConnection[]
  plannedSteps?: readonly ProcessFlowStep[]
  plannedLabel?: string
  owns: readonly string[]
  doesNotOwn: readonly string[]
  currentBoundaries?: readonly string[]
  futureIntegrations?: readonly string[]
}
