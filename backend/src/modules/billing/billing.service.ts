import { Injectable } from '@nestjs/common'
import { BillingPlan, BillingStatus } from '@prisma/client'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class BillingService {
  constructor(private readonly prisma: PrismaService) {}

  async get(user: AuthUser) {
    const billing = await this.prisma.organizationBilling.upsert({
      where: { organizationId: user.organizationId },
      update: {},
      create: {
        organizationId: user.organizationId,
        plan: BillingPlan.FREE,
        status: BillingStatus.TRIALING,
        trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
    })

    const [seatsUsed, contactsUsed] = await Promise.all([
      this.prisma.membership.count({
        where: { organizationId: user.organizationId, deletedAt: null },
      }),
      this.prisma.contact.count({
        where: { organizationId: user.organizationId, deletedAt: null },
      }),
    ])

    return {
      data: {
        ...billing,
        usage: {
          seatsUsed,
          seatsLimit: billing.seatLimit,
          contactsUsed,
          contactsLimit: billing.contactLimit,
        },
      },
      message: '',
    }
  }

  async upgrade(user: AuthUser, plan: BillingPlan) {
    const limits: Record<BillingPlan, { seats: number; contacts: number }> = {
      FREE: { seats: 5, contacts: 1000 },
      STARTER: { seats: 15, contacts: 10_000 },
      GROWTH: { seats: 50, contacts: 50_000 },
      ENTERPRISE: { seats: 500, contacts: 1_000_000 },
    }
    const cfg = limits[plan]
    const billing = await this.prisma.organizationBilling.upsert({
      where: { organizationId: user.organizationId },
      update: {
        plan,
        status: BillingStatus.ACTIVE,
        seatLimit: cfg.seats,
        contactLimit: cfg.contacts,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
      create: {
        organizationId: user.organizationId,
        plan,
        status: BillingStatus.ACTIVE,
        seatLimit: cfg.seats,
        contactLimit: cfg.contacts,
        currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    })
    return { data: billing, message: 'Plan upgraded (demo — wire Stripe later)' }
  }
}
