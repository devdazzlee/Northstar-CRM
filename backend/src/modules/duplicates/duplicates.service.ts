import { Injectable } from '@nestjs/common'
import { NotFoundError } from '../../common/errors/app.error'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class DuplicatesService {
  constructor(private readonly prisma: PrismaService) {}

  async findContacts(user: AuthUser) {
    const contacts = await this.prisma.contact.findMany({
      where: { organizationId: user.organizationId, deletedAt: null },
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        companyId: true,
      },
    })

    const byEmail = new Map<string, typeof contacts>()
    for (const c of contacts) {
      if (!c.email) continue
      const key = c.email.toLowerCase()
      const list = byEmail.get(key) ?? []
      list.push(c)
      byEmail.set(key, list)
    }

    const groups = [...byEmail.entries()]
      .filter(([, list]) => list.length > 1)
      .map(([email, list]) => ({ key: email, field: 'email', records: list }))

    return {
      data: { groups, totalGroups: groups.length },
      message: '',
    }
  }

  async findCompanies(user: AuthUser) {
    const companies = await this.prisma.company.findMany({
      where: { organizationId: user.organizationId, deletedAt: null },
      select: { id: true, name: true, domain: true },
    })

    const byDomain = new Map<string, typeof companies>()
    for (const c of companies) {
      const key = (c.domain ?? c.name).toLowerCase()
      const list = byDomain.get(key) ?? []
      list.push(c)
      byDomain.set(key, list)
    }

    const groups = [...byDomain.entries()]
      .filter(([, list]) => list.length > 1)
      .map(([key, list]) => ({ key, field: 'domain|name', records: list }))

    return { data: { groups, totalGroups: groups.length }, message: '' }
  }

  async mergeContacts(user: AuthUser, primaryId: string, duplicateIds: string[]) {
    const primary = await this.prisma.contact.findFirst({
      where: { id: primaryId, organizationId: user.organizationId, deletedAt: null },
    })
    if (!primary) throw new NotFoundError('Primary contact not found')

    const result = await this.prisma.$transaction(async (tx) => {
      await tx.deal.updateMany({
        where: { organizationId: user.organizationId, contactId: { in: duplicateIds } },
        data: { contactId: primaryId },
      })
      await tx.supportTicket.updateMany({
        where: { organizationId: user.organizationId, contactId: { in: duplicateIds } },
        data: { contactId: primaryId },
      })
      const softDeleted = await tx.contact.updateMany({
        where: {
          organizationId: user.organizationId,
          id: { in: duplicateIds },
          deletedAt: null,
        },
        data: { deletedAt: new Date() },
      })
      await tx.auditLog.create({
        data: {
          organizationId: user.organizationId,
          userId: user.userId,
          action: 'contact.merge',
          resource: 'contact',
          resourceId: primaryId,
          metadata: { duplicateIds },
        },
      })
      return softDeleted.count
    })

    return { data: { mergedInto: primaryId, removed: result }, message: 'Contacts merged' }
  }
}
