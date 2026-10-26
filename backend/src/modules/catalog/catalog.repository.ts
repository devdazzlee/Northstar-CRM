import { Injectable } from '@nestjs/common'
import { Prisma } from '@prisma/client'
import { PrismaService } from '../../database/prisma.service'
import type { CatalogModel, CatalogResource } from './catalog.registry'

type Delegate = {
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>
  count: (args: Record<string, unknown>) => Promise<number>
  findFirst: (args: Record<string, unknown>) => Promise<unknown | null>
  create: (args: Record<string, unknown>) => Promise<unknown>
  update: (args: Record<string, unknown>) => Promise<unknown>
}

@Injectable()
export class CatalogRepository {
  constructor(private readonly prisma: PrismaService) {}

  private delegate(model: CatalogModel): Delegate {
    const client = this.prisma as unknown as Record<string, Delegate>
    const d = client[model]
    if (!d) throw new Error(`Unknown Prisma model: ${model}`)
    return d
  }

  async search(resource: CatalogResource, params: {
    organizationId: string
    q?: string
    page: number
    limit: number
    sortBy: string
    sortOrder: 'asc' | 'desc'
  }) {
    const { organizationId, q, page, limit, sortBy, sortOrder } = params
    const skip = (page - 1) * limit
    const orderField = resource.sortableFields.includes(sortBy)
      ? sortBy
      : resource.sortableFields[0] ?? 'createdAt'

    const where: Record<string, unknown> = {
      organizationId,
      deletedAt: null,
    }

    if (q?.trim()) {
      where.OR = resource.searchFields.map((field) => ({
        [field]: { contains: q.trim(), mode: 'insensitive' },
      }))
    }

    const delegate = this.delegate(resource.model)
    const [items, total] = await Promise.all([
      delegate.findMany({
        where,
        orderBy: { [orderField]: sortOrder },
        skip,
        take: limit,
      }),
      delegate.count({ where }),
    ])

    return { items, total }
  }

  findById(model: CatalogModel, organizationId: string, id: string) {
    return this.delegate(model).findFirst({
      where: { id, organizationId, deletedAt: null },
    })
  }

  create(model: CatalogModel, data: Record<string, unknown>) {
    return this.delegate(model).create({ data })
  }

  update(model: CatalogModel, id: string, data: Record<string, unknown>) {
    return this.delegate(model).update({ where: { id }, data })
  }

  softDelete(model: CatalogModel, id: string) {
    return this.delegate(model).update({
      where: { id },
      data: { deletedAt: new Date() },
    })
  }

  async listDeleted(organizationId: string, models: CatalogModel[], limit: number) {
    const results: Array<{ resource: string; item: unknown }> = []
    for (const model of models) {
      const items = await this.delegate(model).findMany({
        where: { organizationId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
        take: limit,
      })
      for (const item of items) {
        results.push({ resource: model, item })
      }
    }
    return results
  }

  restore(model: CatalogModel, id: string) {
    return this.delegate(model).update({
      where: { id },
      data: { deletedAt: null },
    })
  }

  createAudit(data: Prisma.AuditLogCreateInput) {
    return this.prisma.auditLog.create({ data })
  }
}
