import { Injectable } from '@nestjs/common'
import { BillingPlan, BillingStatus, PlatformRole } from '@prisma/client'
import { NotFoundError } from '../../common/errors/app.error'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class PlatformService {
  constructor(private readonly prisma: PrismaService) {}

  async listOrganizations() {
    const orgs = await this.prisma.organization.findMany({
      where: { deletedAt: null },
      include: {
        billing: true,
        _count: { select: { memberships: true, contacts: true, deals: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 200,
    })
    return {
      items: orgs,
      meta: { page: 1, limit: 200, total: orgs.length, totalPages: 1 },
    }
  }

  async suspendOrganization(id: string) {
    const org = await this.prisma.organization.findFirst({ where: { id, deletedAt: null } })
    if (!org) throw new NotFoundError('Organization not found')
    await this.prisma.organization.update({
      where: { id },
      data: { deletedAt: new Date() },
    })
    if (org) {
      await this.prisma.organizationBilling.updateMany({
        where: { organizationId: id },
        data: { status: BillingStatus.CANCELED },
      })
    }
    return { data: { id }, message: 'Organization suspended' }
  }

  async setPlan(organizationId: string, plan: BillingPlan, seatLimit?: number) {
    const limits: Record<BillingPlan, { seats: number; contacts: number }> = {
      FREE: { seats: 5, contacts: 1000 },
      STARTER: { seats: 15, contacts: 10_000 },
      GROWTH: { seats: 50, contacts: 50_000 },
      ENTERPRISE: { seats: 500, contacts: 1_000_000 },
    }
    const cfg = limits[plan]
    const billing = await this.prisma.organizationBilling.upsert({
      where: { organizationId },
      update: {
        plan,
        status: BillingStatus.ACTIVE,
        seatLimit: seatLimit ?? cfg.seats,
        contactLimit: cfg.contacts,
      },
      create: {
        organizationId,
        plan,
        status: BillingStatus.ACTIVE,
        seatLimit: seatLimit ?? cfg.seats,
        contactLimit: cfg.contacts,
      },
    })
    return { data: billing, message: 'Plan updated' }
  }

  async promotePlatformAdmin(email: string) {
    const user = await this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    })
    if (!user) throw new NotFoundError('User not found')
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { platformRole: PlatformRole.PLATFORM_ADMIN },
      select: { id: true, email: true, platformRole: true },
    })
    return { data: updated, message: 'Promoted to platform admin' }
  }

  async stats() {
    const [orgs, users, contacts, deals] = await Promise.all([
      this.prisma.organization.count({ where: { deletedAt: null } }),
      this.prisma.user.count({ where: { deletedAt: null } }),
      this.prisma.contact.count({ where: { deletedAt: null } }),
      this.prisma.deal.count({ where: { deletedAt: null } }),
    ])
    return { data: { orgs, users, contacts, deals }, message: '' }
  }
}
