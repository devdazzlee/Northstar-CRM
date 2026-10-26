import { Injectable } from '@nestjs/common'
import { NotFoundError } from '../../common/errors/app.error'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'
import { JobsService } from '../../jobs/jobs.service'

@Injectable()
export class EnginesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
  ) {}

  async scoreLeads(user: AuthUser) {
    const rules = await this.prisma.leadScoreRule.findMany({
      where: { organizationId: user.organizationId, active: true, deletedAt: null },
    })
    const leads = await this.prisma.lead.findMany({
      where: { organizationId: user.organizationId, deletedAt: null },
    })

    let updated = 0
    for (const lead of leads) {
      let score = 0
      for (const rule of rules) {
        const fieldValue = String(
        (lead as unknown as Record<string, unknown>)[rule.field] ?? '',
      )
        if (this.match(fieldValue, rule.operator, rule.value)) {
          score += rule.points
        }
      }
      if (score !== lead.score) {
        await this.prisma.lead.update({ where: { id: lead.id }, data: { score } })
        updated++
      }
    }

    return { data: { scored: leads.length, updated, rules: rules.length }, message: 'Lead scoring complete' }
  }

  async runAssignment(user: AuthUser, entityType: string) {
    const rules = await this.prisma.assignmentRule.findMany({
      where: {
        organizationId: user.organizationId,
        active: true,
        deletedAt: null,
        entityType,
      },
      orderBy: { createdAt: 'asc' },
    })
    if (!rules.length) {
      return { data: { assigned: 0 }, message: 'No assignment rules' }
    }

    let assigned = 0
    if (entityType === 'lead') {
      const leads = await this.prisma.lead.findMany({
        where: {
          organizationId: user.organizationId,
          deletedAt: null,
          OR: [{ ownerName: null }, { ownerName: '' }],
        },
        take: 100,
      })
      for (const lead of leads) {
        const rule = rules[assigned % rules.length]
        await this.prisma.lead.update({
          where: { id: lead.id },
          data: { ownerName: rule.assignTo ?? 'Unassigned' },
        })
        assigned++
      }
    }

    if (entityType === 'ticket') {
      const tickets = await this.prisma.supportTicket.findMany({
        where: {
          organizationId: user.organizationId,
          deletedAt: null,
          OR: [{ agentName: null }, { agentName: '' }],
        },
        take: 100,
      })
      for (const ticket of tickets) {
        const rule = rules[assigned % rules.length]
        await this.prisma.supportTicket.update({
          where: { id: ticket.id },
          data: { agentName: rule.assignTo ?? 'Unassigned' },
        })
        assigned++
      }
    }

    return { data: { assigned, rules: rules.length }, message: 'Assignment complete' }
  }

  async runAutomations(user: AuthUser) {
    const rules = await this.prisma.automationRule.findMany({
      where: { organizationId: user.organizationId, active: true, deletedAt: null },
    })
    for (const rule of rules) {
      await this.jobs.enqueueAutomation({
        organizationId: user.organizationId,
        ruleId: rule.id,
        entityType: 'organization',
        entityId: user.organizationId,
      })
    }
    return { data: { queued: rules.length }, message: 'Automations queued' }
  }

  async requestApproval(
    user: AuthUser,
    input: { workflowId: string; entityType: string; entityId: string; note?: string },
  ) {
    const workflow = await this.prisma.approvalWorkflow.findFirst({
      where: {
        id: input.workflowId,
        organizationId: user.organizationId,
        active: true,
        deletedAt: null,
      },
    })
    if (!workflow) throw new NotFoundError('Approval workflow not found')

    const request = await this.prisma.approvalRequest.create({
      data: {
        organizationId: user.organizationId,
        workflowId: workflow.id,
        entityType: input.entityType,
        entityId: input.entityId,
        requestedBy: user.email,
        note: input.note,
      },
    })
    return { data: request, message: 'Approval requested' }
  }

  async decideApproval(
    user: AuthUser,
    requestId: string,
    decision: 'approved' | 'rejected',
    note?: string,
  ) {
    const request = await this.prisma.approvalRequest.findFirst({
      where: { id: requestId, organizationId: user.organizationId, status: 'pending' },
    })
    if (!request) throw new NotFoundError('Approval request not found')

    const updated = await this.prisma.approvalRequest.update({
      where: { id: request.id },
      data: {
        status: decision,
        decidedBy: user.email,
        note: note ?? request.note,
      },
    })
    return { data: updated, message: `Request ${decision}` }
  }

  async sendCampaign(user: AuthUser, campaignId: string, recipients: string[]) {
    const campaign = await this.prisma.emailCampaign.findFirst({
      where: { id: campaignId, organizationId: user.organizationId, deletedAt: null },
    })
    if (!campaign) throw new NotFoundError('Campaign not found')

    for (const to of recipients) {
      await this.jobs.enqueueEmail({
        organizationId: user.organizationId,
        to,
        subject: campaign.subject ?? campaign.name,
        body: `Campaign: ${campaign.name}`,
        campaignId: campaign.id,
      })
    }

    await this.prisma.emailCampaign.update({
      where: { id: campaign.id },
      data: { status: 'Sending' },
    })

    return { data: { queued: recipients.length }, message: 'Campaign emails queued' }
  }

  async enrollSequence(
    user: AuthUser,
    input: { sequenceId: string; leadId?: string; contactId?: string },
  ) {
    const sequence = await this.prisma.sequence.findFirst({
      where: { id: input.sequenceId, organizationId: user.organizationId, deletedAt: null },
    })
    if (!sequence) throw new NotFoundError('Sequence not found')

    const enrollment = await this.prisma.sequenceEnrollment.create({
      data: {
        organizationId: user.organizationId,
        sequenceId: sequence.id,
        leadId: input.leadId,
        contactId: input.contactId,
        nextRunAt: new Date(),
      },
    })

    await this.prisma.sequence.update({
      where: { id: sequence.id },
      data: { enrolledCount: { increment: 1 } },
    })

    await this.jobs.enqueueSequenceTick({
      organizationId: user.organizationId,
      enrollmentId: enrollment.id,
    })

    return { data: enrollment, message: 'Enrolled in sequence' }
  }

  async tickSequences(user: AuthUser) {
    const due = await this.prisma.sequenceEnrollment.findMany({
      where: {
        organizationId: user.organizationId,
        status: 'active',
        OR: [{ nextRunAt: null }, { nextRunAt: { lte: new Date() } }],
      },
      take: 50,
    })
    for (const row of due) {
      await this.jobs.enqueueSequenceTick({
        organizationId: user.organizationId,
        enrollmentId: row.id,
      })
    }
    return { data: { queued: due.length }, message: 'Sequence ticks queued' }
  }

  private match(fieldValue: string, operator: string, expected: string) {
    switch (operator) {
      case 'eq':
      case 'equals':
        return fieldValue.toLowerCase() === expected.toLowerCase()
      case 'contains':
        return fieldValue.toLowerCase().includes(expected.toLowerCase())
      case 'startsWith':
        return fieldValue.toLowerCase().startsWith(expected.toLowerCase())
      case 'gt':
        return Number(fieldValue) > Number(expected)
      case 'lt':
        return Number(fieldValue) < Number(expected)
      default:
        return fieldValue.toLowerCase() === expected.toLowerCase()
    }
  }
}
