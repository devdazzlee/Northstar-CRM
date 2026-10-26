export const JOB_QUEUES = {
  email: 'email',
  sequences: 'sequences',
  imports: 'imports',
  notifications: 'notifications',
  enrichment: 'enrichment',
  automation: 'automation',
} as const

export type JobQueueName = (typeof JOB_QUEUES)[keyof typeof JOB_QUEUES]

export type EmailJobPayload = {
  organizationId: string
  to: string
  subject: string
  body: string
  campaignId?: string
}

export type SequenceTickPayload = {
  organizationId: string
  enrollmentId: string
}

export type ImportJobPayload = {
  organizationId: string
  importJobId: string
  entityType: 'contacts' | 'leads' | 'companies'
  rows: Record<string, string>[]
  userId: string
}

export type NotificationJobPayload = {
  organizationId: string
  userId?: string
  text: string
  view?: string
}

export type EnrichmentJobPayload = {
  organizationId: string
  enrichmentJobId: string
}

export type AutomationRunPayload = {
  organizationId: string
  ruleId: string
  entityType: string
  entityId: string
}
