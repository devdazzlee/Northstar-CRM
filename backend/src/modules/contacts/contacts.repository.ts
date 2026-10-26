import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'

const contactSelect = {
  id: true,
  organizationId: true,
  companyId: true,
  firstName: true,
  lastName: true,
  email: true,
  phone: true,
  title: true,
  stage: true,
  ownerName: true,
  tags: true,
  notes: true,
  createdById: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ContactSelect

@Injectable()
export class ContactsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(params: {
    organizationId: string
    q?: string
    companyId?: string
    stage?: string
    page: number
    limit: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }) {
    const { organizationId, q, companyId, stage, page, limit, sortBy, sortOrder } = params
    const skip = (page - 1) * limit
    const allowedSort = new Set([
      'createdAt',
      'updatedAt',
      'firstName',
      'lastName',
      'email',
      'stage',
    ])
    const orderField = allowedSort.has(sortBy) ? sortBy : 'createdAt'

    if (q?.trim()) {
      const query = q.trim()
      const rows = await this.prisma.$queryRaw<
        Array<{
          id: string
          organization_id: string
          company_id: string | null
          first_name: string
          last_name: string
          email: string | null
          phone: string | null
          title: string | null
          stage: string | null
          owner_name: string | null
          tags: string[]
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
          c."companyId" AS company_id,
          c."firstName" AS first_name,
          c."lastName" AS last_name,
          c.email,
          c.phone,
          c.title,
          c.stage,
          c."ownerName" AS owner_name,
          c.tags,
          c.notes,
          c."createdById" AS created_by_id,
          c."createdAt" AS created_at,
          c."updatedAt" AS updated_at,
          COUNT(*) OVER() AS total_count
        FROM "Contact" c
        WHERE c."organizationId" = ${organizationId}::uuid
          AND c."deletedAt" IS NULL
          ${companyId ? Prisma.sql`AND c."companyId" = ${companyId}::uuid` : Prisma.empty}
          ${stage ? Prisma.sql`AND c.stage = ${stage}` : Prisma.empty}
          AND (
            to_tsvector(
              'english',
              coalesce(c."firstName", '') || ' ' ||
              coalesce(c."lastName", '') || ' ' ||
              coalesce(c.email, '') || ' ' ||
              coalesce(c.phone, '') || ' ' ||
              coalesce(c.title, '') || ' ' ||
              coalesce(c.notes, '') || ' ' ||
              coalesce(array_to_string(c.tags, ' '), '')
            ) @@ plainto_tsquery('english', ${query})
            OR c."firstName" ILIKE ${`%${query}%`}
            OR c."lastName" ILIKE ${`%${query}%`}
            OR c.email ILIKE ${`%${query}%`}
          )
        ORDER BY c."createdAt" DESC
        LIMIT ${limit}
        OFFSET ${skip}
      `

      const total = rows[0] ? Number(rows[0].total_count) : 0
      const items = rows.map((row) => ({
        id: row.id,
        organizationId: row.organization_id,
        companyId: row.company_id,
        firstName: row.first_name,
        lastName: row.last_name,
        email: row.email,
        phone: row.phone,
        title: row.title,
        stage: row.stage,
        ownerName: row.owner_name,
        tags: row.tags,
        notes: row.notes,
        createdById: row.created_by_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at,
      }))

      return { items, total }
    }

    const where: Prisma.ContactWhereInput = {
      organizationId,
      deletedAt: null,
      ...(companyId ? { companyId } : {}),
      ...(stage ? { stage } : {}),
    }

    const [items, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        select: contactSelect,
        orderBy: { [orderField]: sortOrder },
        skip,
        take: limit,
      }),
      this.prisma.contact.count({ where }),
    ])

    return { items, total }
  }

  findById(organizationId: string, id: string) {
    return this.prisma.contact.findFirst({
      where: { id, organizationId, deletedAt: null },
      select: contactSelect,
    })
  }

  create(data: Prisma.ContactCreateInput) {
    return this.prisma.contact.create({ data, select: contactSelect })
  }

  update(id: string, data: Prisma.ContactUpdateInput) {
    return this.prisma.contact.update({ where: { id }, data, select: contactSelect })
  }

  softDelete(id: string) {
    return this.prisma.contact.update({
      where: { id },
      data: { deletedAt: new Date() },
      select: { id: true },
    })
  }
}
