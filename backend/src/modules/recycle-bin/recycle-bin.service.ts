import { Injectable } from '@nestjs/common'
import { NotFoundError } from '../../common/errors/app.error'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'
import { CATALOG_RESOURCES, type CatalogModel } from '../catalog/catalog.registry'
import { CatalogRepository } from '../catalog/catalog.repository'

const CORE_MODELS = ['contact', 'company', 'deal'] as const

type SoftDeleteDelegate = {
  findMany: (args: Record<string, unknown>) => Promise<unknown[]>
  findFirst: (args: Record<string, unknown>) => Promise<{ id: string } | null>
  update: (args: Record<string, unknown>) => Promise<unknown>
}

@Injectable()
export class RecycleBinService {
  constructor(
    private readonly catalogRepository: CatalogRepository,
    private readonly prisma: PrismaService,
  ) {}

  async list(user: AuthUser) {
    const catalogModels = CATALOG_RESOURCES.map((r) => r.model)
    const catalogItems = await this.catalogRepository.listDeleted(
      user.organizationId,
      catalogModels,
      20,
    )

    const coreItems: Array<{ resource: string; item: unknown }> = []
    for (const model of CORE_MODELS) {
      const items = await this.delegate(model).findMany({
        where: { organizationId: user.organizationId, deletedAt: { not: null } },
        orderBy: { deletedAt: 'desc' },
        take: 20,
      })
      for (const item of items) coreItems.push({ resource: model, item })
    }

    const items = [...coreItems, ...catalogItems]
    return {
      items,
      meta: {
        page: 1,
        limit: items.length || 1,
        total: items.length,
        totalPages: 1,
      },
    }
  }

  async restore(user: AuthUser, resource: string, id: string) {
    const catalog = CATALOG_RESOURCES.find((r) => r.model === resource || r.route === resource)
    if (catalog) {
      const row = await this.delegate(catalog.model).findFirst({
        where: { id, organizationId: user.organizationId, deletedAt: { not: null } },
      })
      if (!row) throw new NotFoundError('Deleted record not found')
      const restored = await this.catalogRepository.restore(catalog.model, id)
      return { data: restored, message: 'Restored' }
    }

    if ((CORE_MODELS as readonly string[]).includes(resource)) {
      const row = await this.delegate(resource).findFirst({
        where: { id, organizationId: user.organizationId, deletedAt: { not: null } },
      })
      if (!row) throw new NotFoundError('Deleted record not found')
      const restored = await this.delegate(resource).update({
        where: { id },
        data: { deletedAt: null },
      })
      return { data: restored, message: 'Restored' }
    }

    throw new NotFoundError(`Unknown resource type: ${resource}`)
  }

  private delegate(model: string): SoftDeleteDelegate {
    return (this.prisma as unknown as Record<string, SoftDeleteDelegate>)[model]
  }
}
