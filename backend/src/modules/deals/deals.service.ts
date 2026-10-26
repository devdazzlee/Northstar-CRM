import { Injectable } from '@nestjs/common'
import { buildPageMeta } from '../../common/dto/pagination.dto'
import { NotFoundError } from '../../common/errors/app.error'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'
import type { CreateDealDto, ListDealsQueryDto, UpdateDealDto } from './deals.dto'
import { DealsRepository } from './deals.repository'

@Injectable()
export class DealsService {
  constructor(
    private readonly dealsRepository: DealsRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(user: AuthUser, query: ListDealsQueryDto) {
    const { items, total } = await this.dealsRepository.search({
      organizationId: user.organizationId,
      q: query.q,
      stage: query.stage,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    })
    return { items, meta: buildPageMeta(query.page, query.limit, total) }
  }

  async getById(user: AuthUser, id: string) {
    const deal = await this.dealsRepository.findById(user.organizationId, id)
    if (!deal) throw new NotFoundError('Deal not found')
    return deal
  }

  async create(user: AuthUser, dto: CreateDealDto) {
    await this.assertRelations(user.organizationId, dto.companyId, dto.contactId)

    const deal = await this.dealsRepository.create({
      organization: { connect: { id: user.organizationId } },
      title: dto.title,
      amountCents: dto.amountCents ?? 0,
      currency: dto.currency ?? 'USD',
      stage: dto.stage,
      probability: dto.probability ?? 0,
      expectedClose: dto.expectedClose ? new Date(dto.expectedClose) : undefined,
      ...(dto.companyId ? { company: { connect: { id: dto.companyId } } } : {}),
      ...(dto.contactId ? { contact: { connect: { id: dto.contactId } } } : {}),
      createdBy: { connect: { id: user.userId } },
    })

    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.userId,
        action: 'deal.created',
        resource: 'deal',
        resourceId: deal.id,
      },
    })

    return { data: deal, message: 'Deal created' }
  }

  async update(user: AuthUser, id: string, dto: UpdateDealDto) {
    const existing = await this.dealsRepository.findById(user.organizationId, id)
    if (!existing) throw new NotFoundError('Deal not found')

    await this.assertRelations(user.organizationId, dto.companyId, dto.contactId)

    const deal = await this.dealsRepository.update(id, {
      title: dto.title,
      amountCents: dto.amountCents,
      currency: dto.currency,
      stage: dto.stage,
      probability: dto.probability,
      expectedClose: dto.expectedClose ? new Date(dto.expectedClose) : undefined,
      ...(dto.companyId !== undefined
        ? dto.companyId
          ? { company: { connect: { id: dto.companyId } } }
          : { company: { disconnect: true } }
        : {}),
      ...(dto.contactId !== undefined
        ? dto.contactId
          ? { contact: { connect: { id: dto.contactId } } }
          : { contact: { disconnect: true } }
        : {}),
    })

    return { data: deal, message: 'Deal updated' }
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.dealsRepository.findById(user.organizationId, id)
    if (!existing) throw new NotFoundError('Deal not found')
    await this.dealsRepository.softDelete(id)
    return { data: null, message: 'Deal deleted' }
  }

  private async assertRelations(
    organizationId: string,
    companyId?: string,
    contactId?: string,
  ) {
    if (companyId) {
      const company = await this.prisma.company.findFirst({
        where: { id: companyId, organizationId, deletedAt: null },
        select: { id: true },
      })
      if (!company) throw new NotFoundError('Company not found')
    }
    if (contactId) {
      const contact = await this.prisma.contact.findFirst({
        where: { id: contactId, organizationId, deletedAt: null },
        select: { id: true },
      })
      if (!contact) throw new NotFoundError('Contact not found')
    }
  }
}
