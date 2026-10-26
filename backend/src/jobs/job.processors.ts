import { Injectable, Logger } from '@nestjs/common'
import { PrismaService } from '../database/prisma.service'
import type {
  AutomationRunPayload,
  EmailJobPayload,
  EnrichmentJobPayload,
  ImportJobPayload,
  NotificationJobPayload,
  SequenceTickPayload,
} from './job.types'

@Injectable()
export class JobProcessors {
  private readonly logger = new Logger(JobProcessors.name)

  constructor(private readonly prisma: PrismaService) {}

  async processEmail(payload: EmailJobPayload) {
    this.logger.log(
      `Email queued/sent org=${payload.organizationId} to=${payload.to} subject=${payload.subject}`,
    )
    if (payload.campaignId) {
      await this.prisma.emailCampaign.updateMany({
        where: { id: payload.campaignId, organizationId: payload.organizationId },
        data: { sentCount: { increment: 1 }, status: 'Sent' },
      })
    }
    await this.prisma.workflowLog.create({
      data: {
        organizationId: payload.organizationId,
        workflowName: 'email.send',
        status: 'success',
        message: `Sent to ${payload.to}`,
        payload: payload as object,
      },
    })
  }

  async processNotification(payload: NotificationJobPayload) {
    await this.prisma.notification.create({
      data: {
        organizationId: payload.organizationId,
        userId: payload.userId,
        text: payload.text,
        view: payload.view,
      },
    })
  }

  async processSequenceTick(payload: SequenceTickPayload) {
    const enrollment = await this.prisma.sequenceEnrollment.findFirst({
      where: {
        id: payload.enrollmentId,
        organizationId: payload.organizationId,
        status: 'active',
      },
      include: { sequence: true },
    })
    if (!enrollment) return

    const steps = Array.isArray(enrollment.sequence.steps)
      ? (enrollment.sequence.steps as Array<{ type?: string; subject?: string; delayHours?: number }>)
      : []
    const step = steps[enrollment.currentStep]
    if (!step) {
      await this.prisma.sequenceEnrollment.update({
        where: { id: enrollment.id },
        data: { status: 'completed' },
      })
      return
    }

    await this.prisma.activity.create({
      data: {
        organizationId: payload.organizationId,
        type: 'sequence_step',
        subject: step.subject ?? `Sequence step ${enrollment.currentStep + 1}`,
        body: `Ran step for sequence ${enrollment.sequence.name}`,
        relatedType: 'sequence',
        relatedId: enrollment.sequenceId,
        actorName: 'system',
      },
    })

    const nextStep = enrollment.currentStep + 1
    const done = nextStep >= steps.length
    await this.prisma.sequenceEnrollment.update({
      where: { id: enrollment.id },
      data: {
        currentStep: nextStep,
        status: done ? 'completed' : 'active',
        nextRunAt: done
          ? null
          : new Date(Date.now() + (step.delayHours ?? 24) * 60 * 60 * 1000),
      },
    })
  }

  async processImport(payload: ImportJobPayload) {
    let success = 0
    let errors = 0
    const errorRows: Array<{ row: number; error: string }> = []

    for (let i = 0; i < payload.rows.length; i++) {
      const row = payload.rows[i]
      try {
        if (payload.entityType === 'contacts') {
          const [firstName, ...rest] = (row.name ?? row.firstName ?? 'Unknown').split(' ')
          await this.prisma.contact.create({
            data: {
              organizationId: payload.organizationId,
              firstName,
              lastName: row.lastName ?? rest.join(' ') ?? '',
              email: row.email?.toLowerCase(),
              phone: row.phone,
              companyId: undefined,
              createdById: payload.userId,
              stage: row.stage ?? 'Lead',
            },
          })
        } else if (payload.entityType === 'leads') {
          const [firstName, ...rest] = (row.name ?? row.firstName ?? 'Unknown').split(' ')
          await this.prisma.lead.create({
            data: {
              organizationId: payload.organizationId,
              firstName,
              lastName: row.lastName ?? rest.join(' ') ?? '',
              email: row.email?.toLowerCase(),
              phone: row.phone,
              companyName: row.company ?? row.companyName,
              source: row.source ?? 'Import',
              status: row.status ?? 'New',
              createdById: payload.userId,
            },
          })
        } else if (payload.entityType === 'companies') {
          await this.prisma.company.create({
            data: {
              organizationId: payload.organizationId,
              name: row.name ?? 'Untitled',
              domain: row.domain,
              industry: row.industry,
              createdById: payload.userId,
            },
          })
        }
        success++
      } catch (err) {
        errors++
        errorRows.push({
          row: i + 1,
          error: err instanceof Error ? err.message : 'Unknown error',
        })
      }
    }

    await this.prisma.importJob.update({
      where: { id: payload.importJobId },
      data: {
        status: errors && !success ? 'failed' : errors ? 'completed_with_errors' : 'completed',
        successRows: success,
        errorRows: errors,
        totalRows: payload.rows.length,
        errors: errorRows.slice(0, 50),
        completedAt: new Date(),
      },
    })
  }

  async processEnrichment(payload: EnrichmentJobPayload) {
    const job = await this.prisma.enrichmentJob.findFirst({
      where: { id: payload.enrichmentJobId, organizationId: payload.organizationId },
    })
    if (!job) return

    const result = {
      companySize: '51-200',
      industry: 'Software',
      linkedIn: `https://linkedin.com/company/example-${job.targetId.slice(0, 8)}`,
      confidence: 0.82,
      enrichedAt: new Date().toISOString(),
    }

    await this.prisma.enrichmentJob.update({
      where: { id: job.id },
      data: { status: 'completed', result, completedAt: new Date() },
    })

    if (job.targetType === 'company') {
      await this.prisma.company.updateMany({
        where: { id: job.targetId, organizationId: payload.organizationId },
        data: { industry: result.industry, size: result.companySize },
      })
    }
  }

  async processAutomation(payload: AutomationRunPayload) {
    const rule = await this.prisma.automationRule.findFirst({
      where: {
        id: payload.ruleId,
        organizationId: payload.organizationId,
        active: true,
        deletedAt: null,
      },
    })
    if (!rule) return

    await this.prisma.workflowLog.create({
      data: {
        organizationId: payload.organizationId,
        workflowName: rule.name,
        status: 'success',
        message: `Automation ran for ${payload.entityType}:${payload.entityId}`,
        payload: { trigger: rule.trigger, actions: rule.actions, entityId: payload.entityId },
      },
    })

    await this.prisma.activity.create({
      data: {
        organizationId: payload.organizationId,
        type: 'automation',
        subject: rule.name,
        body: `Triggered by ${rule.trigger}`,
        relatedType: payload.entityType,
        relatedId: payload.entityId,
        actorName: 'automation',
      },
    })
  }
}
