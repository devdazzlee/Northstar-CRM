import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { NotFoundError } from '../../common/errors/app.error'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'
import { JobsService } from '../../jobs/jobs.service'
import { MemoryCacheService } from '../../common/cache/memory-cache.service'

@Injectable()
export class ExtrasService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
    private readonly cache: MemoryCacheService,
  ) {}

  async leaderboards(user: AuthUser) {
    const cacheKey = `leaderboards:${user.organizationId}`
    const cached = this.cache.get<unknown>(cacheKey)
    if (cached) return { data: cached, message: '' }

    const deals = await this.prisma.deal.findMany({
      where: { organizationId: user.organizationId, deletedAt: null, stage: 'WON' },
      select: { ownerName: true, amountCents: true },
    })
    const map = new Map<string, { owner: string; wonCents: number; deals: number }>()
    for (const d of deals) {
      const owner = d.ownerName ?? 'Unassigned'
      const row = map.get(owner) ?? { owner, wonCents: 0, deals: 0 }
      row.wonCents += d.amountCents
      row.deals += 1
      map.set(owner, row)
    }
    const rankings = [...map.values()].sort((a, b) => b.wonCents - a.wonCents)
    this.cache.set(cacheKey, rankings)
    return { data: rankings, message: '' }
  }

  async createChatThread(
    user: AuthUser,
    input: { subject?: string; visitorName?: string; visitorEmail?: string; message: string },
  ) {
    const thread = await this.prisma.chatThread.create({
      data: {
        organizationId: user.organizationId,
        subject: input.subject,
        visitorName: input.visitorName,
        visitorEmail: input.visitorEmail,
        messages: {
          create: {
            organizationId: user.organizationId,
            senderType: 'visitor',
            senderName: input.visitorName ?? 'Visitor',
            body: input.message,
          },
        },
      },
      include: { messages: true },
    })
    return { data: thread, message: 'Chat thread created' }
  }

  async replyChat(user: AuthUser, threadId: string, body: string) {
    const thread = await this.prisma.chatThread.findFirst({
      where: { id: threadId, organizationId: user.organizationId, deletedAt: null },
    })
    if (!thread) throw new NotFoundError('Chat thread not found')
    const message = await this.prisma.chatMessage.create({
      data: {
        organizationId: user.organizationId,
        threadId,
        senderType: 'agent',
        senderName: user.email,
        body,
      },
    })
    await this.prisma.chatThread.update({
      where: { id: threadId },
      data: { updatedAt: new Date() },
    })
    return { data: message, message: 'Reply sent' }
  }

  async listChatThreads(user: AuthUser) {
    const items = await this.prisma.chatThread.findMany({
      where: { organizationId: user.organizationId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 50,
      include: { messages: { orderBy: { createdAt: 'desc' }, take: 1 } },
    })
    return { items, meta: { page: 1, limit: 50, total: items.length, totalPages: 1 } }
  }

  async enrich(user: AuthUser, targetType: string, targetId: string) {
    const job = await this.prisma.enrichmentJob.create({
      data: {
        organizationId: user.organizationId,
        targetType,
        targetId,
        status: 'queued',
      },
    })
    await this.jobs.enqueueEnrichment({
      organizationId: user.organizationId,
      enrichmentJobId: job.id,
    })
    return { data: job, message: 'Enrichment queued' }
  }

  async createSocialPost(
    user: AuthUser,
    input: { platform: string; content: string; scheduledAt?: string },
  ) {
    const post = await this.prisma.socialPost.create({
      data: {
        organizationId: user.organizationId,
        platform: input.platform,
        content: input.content,
        status: input.scheduledAt ? 'scheduled' : 'draft',
        scheduledAt: input.scheduledAt ? new Date(input.scheduledAt) : undefined,
      },
    })
    return { data: post, message: 'Social post saved' }
  }

  async listSocial(user: AuthUser) {
    const items = await this.prisma.socialPost.findMany({
      where: { organizationId: user.organizationId, deletedAt: null },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return { items, meta: { page: 1, limit: 50, total: items.length, totalPages: 1 } }
  }

  async createMessagingThread(
    user: AuthUser,
    input: { channel: string; participant: string; lastMessage?: string },
  ) {
    const thread = await this.prisma.messagingThread.create({
      data: {
        organizationId: user.organizationId,
        channel: input.channel,
        participant: input.participant,
        lastMessage: input.lastMessage,
      },
    })
    return { data: thread, message: 'Messaging thread created' }
  }

  async listMessaging(user: AuthUser) {
    const items = await this.prisma.messagingThread.findMany({
      where: { organizationId: user.organizationId, deletedAt: null },
      orderBy: { updatedAt: 'desc' },
      take: 50,
    })
    return { items, meta: { page: 1, limit: 50, total: items.length, totalPages: 1 } }
  }

  async runSandbox(user: AuthUser, name: string, payload?: unknown) {
    const result = {
      echo: payload ?? null,
      ranAt: new Date().toISOString(),
      ok: true,
    }
    const run = await this.prisma.sandboxRun.create({
      data: {
        organizationId: user.organizationId,
        name,
        payload: payload as object | undefined,
        result,
        status: 'completed',
      },
    })
    return { data: run, message: 'Sandbox run completed' }
  }

  async marketplace() {
    return {
      data: {
        apps: [
          { id: 'slack', name: 'Slack', category: 'Communication', status: 'available' },
          { id: 'gmail', name: 'Gmail Sync', category: 'Email', status: 'available' },
          { id: 'stripe', name: 'Stripe Billing', category: 'Payments', status: 'available' },
          { id: 'hubspot-import', name: 'HubSpot Import', category: 'Migration', status: 'beta' },
        ],
      },
      message: '',
    }
  }

  async developerInfo(user: AuthUser) {
    return {
      data: {
        organizationId: user.organizationId,
        apiBase: '/api/v1',
        auth: 'Bearer JWT',
        webhooks: { status: 'planned', endpoints: [] },
        rateLimit: '100 req/min default',
        openapi: '/docs',
      },
      message: '',
    }
  }

  async languageSettings(user: AuthUser) {
    const settings = await this.prisma.orgSettings.upsert({
      where: { organizationId: user.organizationId },
      update: {},
      create: { organizationId: user.organizationId },
    })
    return {
      data: {
        locale: settings.locale,
        timezone: settings.timezone,
        availableLocales: ['en-US', 'en-GB', 'es-ES', 'fr-FR', 'de-DE', 'pt-BR'],
      },
      message: '',
    }
  }

  async getSupportSettings(user: AuthUser) {
    const settings = await this.prisma.orgSettings.upsert({
      where: { organizationId: user.organizationId },
      update: {},
      create: { organizationId: user.organizationId },
    })
    const features = (settings.features as Record<string, unknown> | null) ?? {}
    return {
      data: {
        slaHours: 24,
        channels: ['Email', 'Chat', 'Phone'],
        businessHours: 'Mon–Fri 9:00–18:00',
        ...(typeof features.support === 'object' && features.support
          ? (features.support as Record<string, unknown>)
          : {}),
      },
      message: '',
    }
  }

  async updateSupportSettings(user: AuthUser, body: Record<string, unknown>) {
    const settings = await this.prisma.orgSettings.upsert({
      where: { organizationId: user.organizationId },
      update: {},
      create: { organizationId: user.organizationId },
    })
    const features = {
      ...((settings.features as Record<string, unknown> | null) ?? {}),
      support: body,
    } as Prisma.InputJsonValue
    const updated = await this.prisma.orgSettings.update({
      where: { id: settings.id },
      data: { features },
    })
    return { data: body, message: 'Support settings saved' }
  }

  async getCustomerPortal(user: AuthUser) {
    const settings = await this.prisma.orgSettings.upsert({
      where: { organizationId: user.organizationId },
      update: {},
      create: { organizationId: user.organizationId },
    })
    const features = (settings.features as Record<string, unknown> | null) ?? {}
    return {
      data: {
        enabled: true,
        url: `https://portal.northstar.local/${user.organizationId.slice(0, 8)}`,
        allowTicketCreate: true,
        allowKb: true,
        ...(typeof features.customerPortal === 'object' && features.customerPortal
          ? (features.customerPortal as Record<string, unknown>)
          : {}),
      },
      message: '',
    }
  }

  async updateCustomerPortal(user: AuthUser, body: Record<string, unknown>) {
    const settings = await this.prisma.orgSettings.upsert({
      where: { organizationId: user.organizationId },
      update: {},
      create: { organizationId: user.organizationId },
    })
    const features = {
      ...((settings.features as Record<string, unknown> | null) ?? {}),
      customerPortal: body,
    } as Prisma.InputJsonValue
    await this.prisma.orgSettings.update({
      where: { id: settings.id },
      data: { features },
    })
    return { data: body, message: 'Customer portal settings saved' }
  }

  async quotesAndInvoices(user: AuthUser) {
    const [quotes, invoices] = await Promise.all([
      this.prisma.quote.findMany({
        where: { organizationId: user.organizationId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.invoice.findMany({
        where: { organizationId: user.organizationId, deletedAt: null },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ])
    return { data: { quotes, invoices }, message: '' }
  }

  async customer360(user: AuthUser, contactId: string) {
    const contact = await this.prisma.contact.findFirst({
      where: { id: contactId, organizationId: user.organizationId, deletedAt: null },
      include: { company: true, deals: { where: { deletedAt: null }, take: 20 } },
    })
    if (!contact) throw new NotFoundError('Contact not found')
    const [tickets, activities] = await Promise.all([
      this.prisma.supportTicket.findMany({
        where: { organizationId: user.organizationId, contactId, deletedAt: null },
        take: 20,
      }),
      this.prisma.activity.findMany({
        where: {
          organizationId: user.organizationId,
          deletedAt: null,
          relatedId: contactId,
        },
        orderBy: { occurredAt: 'desc' },
        take: 20,
      }),
    ])
    return { data: { contact, tickets, activities }, message: '' }
  }
}
