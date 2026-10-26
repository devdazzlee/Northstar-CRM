import { Injectable } from '@nestjs/common'
import { buildPageMeta } from '../../common/dto/pagination.dto'
import { NotFoundError } from '../../common/errors/app.error'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'
import type {
  CreateCompanyDto,
  ListCompaniesQueryDto,
  UpdateCompanyDto,
} from './companies.dto'
import { CompaniesRepository } from './companies.repository'

@Injectable()
export class CompaniesService {
  constructor(
    private readonly companiesRepository: CompaniesRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(user: AuthUser, query: ListCompaniesQueryDto) {
    const { items, total } = await this.companiesRepository.search({
      organizationId: user.organizationId,
      q: query.q,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    })
    return { items, meta: buildPageMeta(query.page, query.limit, total) }
  }

  async getById(user: AuthUser, id: string) {
    const company = await this.companiesRepository.findById(user.organizationId, id)
    if (!company) throw new NotFoundError('Company not found')
    return company
  }

  async create(user: AuthUser, dto: CreateCompanyDto) {
    const company = await this.companiesRepository.create({
      organization: { connect: { id: user.organizationId } },
      name: dto.name,
      domain: dto.domain,
      industry: dto.industry,
      size: dto.size,
      location: dto.location,
      revenue: dto.revenue,
      ownerName: dto.ownerName,
      phone: dto.phone,
      website: dto.website,
      notes: dto.notes,
      createdBy: { connect: { id: user.userId } },
    })

    await this.prisma.auditLog.create({
      data: {
        organizationId: user.organizationId,
        userId: user.userId,
        action: 'company.created',
        resource: 'company',
        resourceId: company.id,
      },
    })

    return { data: company, message: 'Company created' }
  }

  async update(user: AuthUser, id: string, dto: UpdateCompanyDto) {
    const existing = await this.companiesRepository.findById(user.organizationId, id)
    if (!existing) throw new NotFoundError('Company not found')

    const company = await this.companiesRepository.update(id, {
      name: dto.name,
      domain: dto.domain,
      industry: dto.industry,
      size: dto.size,
      location: dto.location,
      revenue: dto.revenue,
      ownerName: dto.ownerName,
      phone: dto.phone,
      website: dto.website,
      notes: dto.notes,
    })

    return { data: company, message: 'Company updated' }
  }

  async remove(user: AuthUser, id: string) {
    const existing = await this.companiesRepository.findById(user.organizationId, id)
    if (!existing) throw new NotFoundError('Company not found')
    await this.companiesRepository.softDelete(id)
    return { data: null, message: 'Company deleted' }
  }
}
