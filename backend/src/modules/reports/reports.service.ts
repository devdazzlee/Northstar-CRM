import { Injectable } from '@nestjs/common'
import { DealStage } from '@prisma/client'
import { MemoryCacheService } from '../../common/cache/memory-cache.service'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class ReportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: MemoryCacheService,
  ) {}

  async dashboard(user: AuthUser) {
    const cacheKey = `dashboard:${user.organizationId}`
    const cached = this.cache.get<unknown>(cacheKey)
    if (cached) return { data: cached, message: '' }

    const orgId = user.organizationId
    const [
      contacts,
      companies,
      leads,
      deals,
      openTickets,
      tasksTodo,
      wonDeals,
      pipeline,
    ] = await Promise.all([
      this.prisma.contact.count({ where: { organizationId: orgId, deletedAt: null } }),
      this.prisma.company.count({ where: { organizationId: orgId, deletedAt: null } }),
      this.prisma.lead.count({ where: { organizationId: orgId, deletedAt: null } }),
      this.prisma.deal.count({ where: { organizationId: orgId, deletedAt: null } }),
      this.prisma.supportTicket.count({
        where: { organizationId: orgId, deletedAt: null, status: { in: ['OPEN', 'PENDING'] } },
      }),
      this.prisma.task.count({
        where: { organizationId: orgId, deletedAt: null, status: { in: ['TODO', 'IN_PROGRESS'] } },
      }),
      this.prisma.deal.aggregate({
        where: { organizationId: orgId, deletedAt: null, stage: DealStage.WON },
        _sum: { amountCents: true },
        _count: true,
      }),
      this.prisma.deal.groupBy({
        by: ['stage'],
        where: { organizationId: orgId, deletedAt: null },
        _sum: { amountCents: true },
        _count: true,
      }),
    ])

    const data = {
      counts: { contacts, companies, leads, deals, openTickets, tasksTodo },
      won: {
        count: wonDeals._count,
        amountCents: wonDeals._sum.amountCents ?? 0,
      },
      pipeline: pipeline.map((row) => ({
        stage: row.stage,
        count: row._count,
        amountCents: row._sum.amountCents ?? 0,
      })),
    }
    this.cache.set(cacheKey, data)
    return { data, message: '' }
  }

  async forecast(user: AuthUser) {
    const deals = await this.prisma.deal.findMany({
      where: {
        organizationId: user.organizationId,
        deletedAt: null,
        stage: { notIn: [DealStage.WON, DealStage.LOST] },
      },
      select: {
        id: true,
        title: true,
        amountCents: true,
        probability: true,
        stage: true,
        expectedClose: true,
      },
      orderBy: { expectedClose: 'asc' },
      take: 100,
    })

    const weighted = deals.reduce(
      (sum, deal) => sum + Math.round((deal.amountCents * deal.probability) / 100),
      0,
    )

    return {
      data: { weightedPipelineCents: weighted, deals },
      message: '',
    }
  }

  async supportAnalytics(user: AuthUser) {
    const orgId = user.organizationId
    const [open, pending, resolved, byChannel, byPriority] = await Promise.all([
      this.prisma.supportTicket.count({
        where: { organizationId: orgId, deletedAt: null, status: 'OPEN' },
      }),
      this.prisma.supportTicket.count({
        where: { organizationId: orgId, deletedAt: null, status: 'PENDING' },
      }),
      this.prisma.supportTicket.count({
        where: { organizationId: orgId, deletedAt: null, status: 'RESOLVED' },
      }),
      this.prisma.supportTicket.groupBy({
        by: ['channel'],
        where: { organizationId: orgId, deletedAt: null },
        _count: true,
      }),
      this.prisma.supportTicket.groupBy({
        by: ['priority'],
        where: { organizationId: orgId, deletedAt: null },
        _count: true,
      }),
    ])

    return {
      data: {
        counts: { open, pending, resolved },
        byChannel,
        byPriority,
      },
      message: '',
    }
  }

  async overview(user: AuthUser) {
    const orgId = user.organizationId
    const [recentActivities, recentDeals, recentTickets] = await Promise.all([
      this.prisma.activity.findMany({
        where: { organizationId: orgId, deletedAt: null },
        orderBy: { occurredAt: 'desc' },
        take: 10,
      }),
      this.prisma.deal.findMany({
        where: { organizationId: orgId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
      this.prisma.supportTicket.findMany({
        where: { organizationId: orgId, deletedAt: null },
        orderBy: { updatedAt: 'desc' },
        take: 10,
      }),
    ])

    return {
      data: { recentActivities, recentDeals, recentTickets },
      message: '',
    }
  }
}
