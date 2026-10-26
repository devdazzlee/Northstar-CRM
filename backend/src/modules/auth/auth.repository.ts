import { Injectable } from '@nestjs/common'
import { BillingPlan, BillingStatus, MembershipRole, PlatformRole, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class AuthRepository {
  constructor(private readonly prisma: PrismaService) {}

  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      include: {
        memberships: {
          where: { deletedAt: null },
          include: { organization: true },
        },
      },
    })
  }

  findUserById(userId: string) {
    return this.prisma.user.findFirst({
      where: { id: userId, deletedAt: null },
      include: {
        memberships: {
          where: { deletedAt: null },
          include: { organization: true },
        },
      },
    })
  }

  createOrganizationWithAdmin(input: {
    organizationName: string
    organizationSlug: string
    email: string
    firstName: string
    lastName: string
    passwordHash: string
    permissions: string[]
  }) {
    return this.prisma.$transaction(async (tx) => {
      const organization = await tx.organization.create({
        data: {
          name: input.organizationName,
          slug: input.organizationSlug.toLowerCase(),
        },
      })

      const user = await tx.user.create({
        data: {
          email: input.email.toLowerCase(),
          firstName: input.firstName,
          lastName: input.lastName,
          passwordHash: input.passwordHash,
          platformRole: PlatformRole.NONE,
        },
      })

      const membership = await tx.membership.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          role: MembershipRole.ORG_ADMIN,
          permissions: input.permissions,
        },
      })

      await tx.organizationBilling.create({
        data: {
          organizationId: organization.id,
          plan: BillingPlan.FREE,
          status: BillingStatus.TRIALING,
          seatLimit: 5,
          contactLimit: 1000,
          trialEndsAt: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        },
      })

      await tx.auditLog.create({
        data: {
          organizationId: organization.id,
          userId: user.id,
          action: 'organization.created',
          resource: 'organization',
          resourceId: organization.id,
          metadata: { slug: organization.slug },
        },
      })

      return { organization, user, membership }
    })
  }

  createRefreshToken(data: { userId: string; tokenHash: string; expiresAt: Date }) {
    return this.prisma.refreshToken.create({ data })
  }

  findValidRefreshToken(tokenHash: string) {
    return this.prisma.refreshToken.findFirst({
      where: {
        tokenHash,
        revokedAt: null,
        expiresAt: { gt: new Date() },
      },
      include: {
        user: {
          include: {
            memberships: {
              where: { deletedAt: null },
              include: { organization: true },
            },
          },
        },
      },
    })
  }

  revokeRefreshToken(id: string) {
    return this.prisma.refreshToken.update({
      where: { id },
      data: { revokedAt: new Date() },
    })
  }

  revokeAllUserRefreshTokens(userId: string) {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    })
  }

  slugExists(slug: string) {
    return this.prisma.organization.findFirst({
      where: { slug: slug.toLowerCase(), deletedAt: null },
      select: { id: true },
    })
  }

  emailExists(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
      select: { id: true },
    })
  }

  createAuditLog(data: Prisma.AuditLogCreateInput) {
    return this.prisma.auditLog.create({ data })
  }
}
