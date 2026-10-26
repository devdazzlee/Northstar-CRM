import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

const companySelect = {
  id: true,
  organizationId: true,
  name: true,
  domain: true,
  industry: true,
  size: true,
  location: true,
  revenue: true,
  ownerName: true,
  phone: true,
  website: true,
  notes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.CompanySelect

@Injectable()
export class CompaniesRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    organizationId: string
    q?: string
    page: number
    limit: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }) {
    const { organizationId, q, page, limit, sortBy, sortOrder } = params
    const skip = (page - 1) * limit
    const allowedSort = new Set(['createdAt', 'updatedAt', 'name', 'industry'])
    const orderField = allowedSort.has(sortBy) ? sortBy : 'createdAt'

    if (q?.trim()) {
      const query = q.trim()
      const rows = await this.prisma.$queryRaw<
        Array<{
          id: string
          organization_id: string
          name: string
          domain: string | null
          industry: string | null
          phone: string | null
          website: string | null
          notes: string | null
          created_by_id: string | null
          created_at: Date
          updated_at: Date
          total_count: bigint
        }>
      >`
        SELECT
          c.id,
          c."organizationId" AS organization_id,
          c.name,
          c.domain,
          c.industry,
          c.phone,
          c.website,
          c.notes,
          c."createdById" AS created_by_id,
          c."createdAt" AS created_at,
          c."updatedAt" AS updated_at,
          COUNT(*) OVER() AS total_count
        FROM "Company" c
        WHERE c."organizationId" = ${organizationId}::uuid
          AND c."deletedAt" IS NULL
          AND (
            to_tsvector(
              'english',
              coalesce(c.name, '') || ' ' ||
              coalesce(c.domain, '') || ' ' ||
              coalesce(c.industry, '') || ' ' ||
              coalesce(c.notes, '')
            ) @@ plainto_tsquery('english', ${query})
            OR c.name ILIKE ${`%${query}%`}
            OR c.domain ILIKE ${`%${query}%`}
          )
        ORDER BY c."createdAt" DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `

      const total = rows[0] ? Number(rows[0].total_count) : 0
      return {
        items: rows.map((row) => ({
          id: row.id,
          organizationId: row.organization_id,
          name: row.name,
          domain: row.domain,
          industry: row.industry,
          phone: row.phone,
          website: row.website,
          notes: row.notes,
          createdById: row.created_by_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        total,
      }
    }

    const where: Prisma.CompanyWhereInput = {
      organizationId,
      deletedAt: null,
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        select: companySelect,
        orderBy: { [orderField]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.company.count({ where }),
    ])

    return { items, total }
  }

  findById(organizationId: string, id: string) {
    return this.prisma.company.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: companySelect,
    })
  }

  create(data: Prisma.CompanyCreateInput) {
    return this.prisma.company.create({ data, select: companySelect })
  }

  update(id: string, data: Prisma.CompanyUpdateInput) {
    return this.prisma.company.update({ where: { id }, data, select: companySelect })
  }

  softDelete(id: string) {
    return this.prisma.company.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    })
  }
}
