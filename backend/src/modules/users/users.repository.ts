import { Injectable } from '@nestjs/common'
import { MembershipRole, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class UsersRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listMembers(params: {
    organizationId: string
    page: number
    limit: number
  }) {
    const { organizationId, page, limit } = params
    const skip = (page - 1) * limit
    const where: Prisma.MembershipWhereInput = {
      organizationId,
      deletedAt: null,
      user: { deletedAt: null },
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.membership.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          role: true,
          permissions: true,
          createdAt: true,
          user: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              platformRole: true,
              createdAt: true,
            },
          },
        },
      }),
      this.prisma.membership.count({ where }),
    ])

    return { items, total }
  }

  findMembership(organizationId: string, membershipId: string) {
    return this.prisma.membership.findFirst({
      where: { id: membershipId, organizationId, deletedAt: null },
      include: { user: true },
    })
  }

  findUserByEmail(email: string) {
    return this.prisma.user.findFirst({
      where: { email: email.toLowerCase(), deletedAt: null },
    })
  }

  inviteUser(input: {
    organizationId: string
    email: string
    firstName: string
    lastName: string
    passwordHash: string
    role: MembershipRole
    permissions: string[]
  }) {
    return this.prisma.$transaction(async (tx) => {
      let user = await tx.user.findFirst({
        where: { email: input.email.toLowerCase(), deletedAt: null },
      })

      if (!user) {
        user = await tx.user.create({
          data: {
            email: input.email.toLowerCase(),
            firstName: input.firstName,
            lastName: input.lastName,
            passwordHash: input.passwordHash,
          },
        })
      }

      const existing = await tx.membership.findFirst({
        where: {
          organizationId: input.organizationId,
          userId: user.id,
          deletedAt: null,
        },
      })
      if (existing) return { user, membership: existing, alreadyMember: true as const }

      const membership = await tx.membership.create({
        data: {
          organizationId: input.organizationId,
          userId: user.id,
          role: input.role,
          permissions: input.permissions,
        },
      })

      await tx.auditLog.create({
        data: {
          organizationId: input.organizationId,
          userId: user.id,
          action: 'membership.created',
          resource: 'membership',
          resourceId: membership.id,
          metadata: { role: input.role },
        },
      })

      return { user, membership, alreadyMember: false as const }
    })
  }

  updateRole(membershipId: string, role: MembershipRole, permissions: string[]) {
    return this.prisma.membership.update({
      where: { id: membershipId },
      data: { role, permissions },
      select: {
        id: true,
        role: true,
        permissions: true,
        user: {
          select: {
            id: true,
            email: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    })
  }
}
