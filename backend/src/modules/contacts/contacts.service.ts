import { Injectable } from '@nestjs/common'
import { buildPageMeta } from '../../common/dto/pagination.dto'
import { NotFoundError } from '../../common/errors/app.error'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'
import type { CreateContactDto, ListContactsQueryDto, UpdateContactDto } from './contacts.dto'
import { ContactsRepository } from './contacts.repository'

@Injectable()
export class ContactsService {
  constructor(
    private readonly contactsRepository: ContactsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(user: AuthUser, query: ListContactsQueryDto) {
    const { items, total } = await this.contactsRepository.search({
      organizationId: user.organizationId,
      q: query.q,
      companyId: query.companyId,
      stage: query.stage,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    })

    return {
      items,
      meta: buildPageMeta(query.page, query.limit, total),
    }
  }

  async getById(user: AuthUser, id: string) {
    const contact = await this.contactsRepository.findById(user.organizationId, id)
    if (!contact) throw new NotFoundError('Contact not found')
    return contact
  }

  async create(user: AuthUser, dto: CreateContactDto) {
    if (dto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: dto.companyId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
        select: { id: true },
      })
      if (!company) throw new NotFoundError('Company not found')
    }

    const contact = await this.contactsRepository.create({
      organization: { connect: { id: user.organizationId } },
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email?.toLowerCase(),
      phone: dto.phone,
      title: dto.title,
      stage: dto.stage,
      ownerName: dto.ownerName,
      tags: dto.tags ?? [],
      notes: dto.notes,
      ...(dto.companyId ? { company: { connect: { id: dto.companyId } } } : {}),
      createdBy: { connect: { id: user.userId } },
    })

    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.userId,
        action: 'contact.created',
        resource: 'contact',
        resourceId: contact.id,
      },
    })

    return { data: contact, message: 'Contact created' }
  }

  async update(user: AuthUser, id: string, dto: UpdateContactDto) {
    const existing = await this.contactsRepository.findById(user.organizationId, id)
    if (!existing) throw new NotFoundError('Contact not found')

    if (dto.companyId) {
      const company = await this.prisma.company.findFirst({
        where: {
          id: dto.companyId,
          organizationId: user.organizationId,
          deletedAt: null,
        },
        select: { id: true },
      })
      if (!company) throw new NotFoundError('Company not found')
    }

    const contact = await this.contactsRepository.update(id, {
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email?.toLowerCase(),
      phone: dto.phone,
      title: dto.title,
      stage: dto.stage,
      ownerName: dto.ownerName,
      tags: dto.tags,
      notes: dto.notes,
      ...(dto.companyId !== undefined
        ? dto.companyId
          ? { company: { connect: { id: dto.companyId } } }
          : { company: { disconnect: true } }
        : {}),
    })

    return { data: contact, message: 'Contact updated' }
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.contactsRepository.findById(user.organizationId, id)
    if (!existing) throw new NotFoundError('Contact not found')
    await this.contactsRepository.softDelete(id)
    return { data: null, message: 'Contact deleted' }
  }
}
