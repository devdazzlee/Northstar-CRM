import { Injectable } from '@nestjs/common'
import { DealStage, Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

const dealSelect = {
  id: true,
  organizationId: true,
  companyId: true,
  contactId: true,
  title: true,
  amountCents: true,
  currency: true,
  stage: true,
  probability: true,
  expectedClose: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.DealSelect

@Injectable()
export class DealsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    organizationId: string
    q?: string
    stage?: DealStage
    page: number
    limit: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }) {
    const { organizationId, q, stage, page, limit, sortBy, sortOrder } = params
    const skip = (page - 1) * limit
    const allowedSort = new Set([
      'createdAt',
      'updatedAt',
      'title',
      'amountCents',
      'stage',
      'expectedClose',
    ])
    const orderField = allowedSort.has(sortBy) ? sortBy : 'createdAt'

    if (q?.trim()) {
      const query = q.trim()
      const rows = await this.prisma.$queryRaw<
        Array<{
          id: string
          organization_id: string
          company_id: string | null
          contact_id: string | null
          title: string
          amount_cents: number
          currency: string
          stage: DealStage
          probability: number
          expected_close: Date | null
          created_by_id: string | null
          created_at: Date
          updated_at: Date
          total_count: bigint
        }>
      >`
        SELECT
          d.id,
          d."organizationId" AS organization_id,
          d."companyId" AS company_id,
          d."contactId" AS contact_id,
          d.title,
          d."amountCents" AS amount_cents,
          d.currency,
          d.stage,
          d.probability,
          d."expectedClose" AS expected_close,
          d."createdById" AS created_by_id,
          d."createdAt" AS created_at,
          d."updatedAt" AS updated_at,
          COUNT(*) OVER() AS total_count
        FROM "Deal" d
        WHERE d."organizationId" = ${organizationId}::uuid
          AND d."deletedAt" IS NULL
          ${stage ? Prisma.sql`AND d.stage = ${stage}::"DealStage"` : Prisma.empty}
          AND (
            to_tsvector('english', coalesce(d.title, '')) @@ plainto_tsquery('english', ${query})
            OR d.title ILIKE ${`%${query}%`}
          )
        ORDER BY d."createdAt" DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `

      const total = rows[0] ? Number(rows[0].total_count) : 0
      return {
        items: rows.map((row) => ({
          id: row.id,
          organizationId: row.organization_id,
          companyId: row.company_id,
          contactId: row.contact_id,
          title: row.title,
          amountCents: row.amount_cents,
          currency: row.currency,
          stage: row.stage,
          probability: row.probability,
          expectedClose: row.expected_close,
          createdById: row.created_by_id,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
        })),
        total,
      }
    }

    const where: Prisma.DealWhereInput = {
      organizationId,
      deletedAt: null,
      ...(stage ? { stage } : {}),
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.deal.findMany({
        where,
        select: dealSelect,
        orderBy: { [orderField]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.deal.count({ where }),
    ])

    return { items, total }
  }

  findById(organizationId: string, id: string) {
    return this.prisma.deal.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: dealSelect,
    })
  }

  create(data: Prisma.DealCreateInput) {
    return this.prisma.deal.create({ data, select: dealSelect })
  }

  update(id: string, data: Prisma.DealUpdateInput) {
    return this.prisma.deal.update({ where: { id }, data, select: dealSelect })
  }

  softDelete(id: string) {
    return this.prisma.deal.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    })
  }
}
