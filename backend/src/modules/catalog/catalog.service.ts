import { Injectable } from '@nestjs/common'
import { buildPageMeta, type PaginationQueryDto } from '../../common/dto/pagination.dto'
import { BadRequestError, NotFoundError } from '../../common/errors/app.error'
import type { AuthUser } from '../../common/types/auth-user'
import { CATALOG_RESOURCES, type CatalogResource } from './catalog.registry'
import { CatalogRepository } from './catalog.repository'

const DATE_FIELDS = new Set([
  'dueAt',
  'startsAt',
  'endsAt',
  'occurredAt',
  'validUntil',
  'scheduledAt',
  'ranAt',
  'renewsAt',
  'expectedClose',
])

@Injectable()
export class CatalogService {
  constructor(private readonly catalogRepository: CatalogRepository) {}

  getResource(route: string): CatalogResource {
    const resource = CATALOG_RESOURCES.find((item) => item.route === route)
    if (!resource) throw new NotFoundError(`Unknown resource: ${route}`)
    return resource
  }

  async list(route: string, user: AuthUser, query: PaginationQueryDto) {
    const resource = this.getResource(route)
    const { items, total } = await this.catalogRepository.search(resource, {
      organizationId: user.organizationId,
      q: query.q,
      page: query.page,
      limit: query.limit,
      sortBy: query.sortBy,
      sortOrder: query.sortOrder,
    })
    return { items, meta: buildPageMeta(query.page, query.limit, total) }
  }

  async getById(route: string, user: AuthUser, id: string) {
    const resource = this.getResource(route)
    const item = await this.catalogRepository.findById(
      resource.model,
      user.organizationId,
      id,
    )
    if (!item) throw new NotFoundError(`${resource.tag} record not found`)
    return item
  }

  async create(route: string, user: AuthUser, body: Record<string, unknown>) {
    const resource = this.getResource(route)
    const data = this.pickWritable(resource, body)
    const created = await this.catalogRepository.create(resource.model, {
      ...resource.createDefaults,
      ...data,
      organizationId: user.organizationId,
      ...(this.supportsCreatedBy(resource.model) ? { createdById: user.userId } : {}),
    })

    await this.catalogRepository.createAudit({
      action: `${resource.model}.created`,
      resource: resource.model,
      resourceId: (created as { id: string }).id,
      organization: { connect: { id: user.organizationId } },
      user: { connect: { id: user.userId } },
    })

    return { data: created, message: `${resource.tag} created` }
  }

  async update(route: string, user: AuthUser, id: string, body: Record<string, unknown>) {
    const resource = this.getResource(route)
    const existing = await this.catalogRepository.findById(
      resource.model,
      user.organizationId,
      id,
    )
    if (!existing) throw new NotFoundError(`${resource.tag} record not found`)

    const data = this.pickWritable(resource, body)
    const updated = await this.catalogRepository.update(resource.model, id, data)
    return { data: updated, message: `${resource.tag} updated` }
  }

  async remove(route: string, user: AuthUser, id: string) {
    const resource = this.getResource(route)
    const existing = await this.catalogRepository.findById(
      resource.model,
      user.organizationId,
      id,
    )
    if (!existing) throw new NotFoundError(`${resource.tag} record not found`)
    await this.catalogRepository.softDelete(resource.model, id)
    return { data: null, message: `${resource.tag} deleted` }
  }

  private pickWritable(resource: CatalogResource, body: Record<string, unknown>) {
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      throw new BadRequestError('Body must be an object')
    }

    const data: Record<string, unknown> = {}
    for (const field of resource.writableFields) {
      if (body[field] === undefined) continue
      let value = body[field]
      if (DATE_FIELDS.has(field) && typeof value === 'string') {
        value = new Date(value)
      } else if (field === 'email' && typeof value === 'string') {
        value = value.toLowerCase()
      } else if (typeof value === 'string') {
        value = this.normalizeEnum(resource.model, field, value)
      }
      data[field] = value
    }

    if (Object.keys(data).length === 0 && Object.keys(body).length > 0) {
      throw new BadRequestError(
        `No writable fields provided. Allowed: ${resource.writableFields.join(', ')}`,
      )
    }

    return data
  }

  private supportsCreatedBy(model: string): boolean {
    return model === 'lead' || model === 'task'
  }

  private normalizeEnum(model: string, field: string, value: string): string {
    const key = `${model}.${field}`
    const maps: Record<string, Record<string, string>> = {
      'task.priority': {
        Low: 'LOW',
        Medium: 'MEDIUM',
        High: 'HIGH',
        LOW: 'LOW',
        MEDIUM: 'MEDIUM',
        HIGH: 'HIGH',
      },
      'task.status': {
        'To do': 'TODO',
        Todo: 'TODO',
        'In progress': 'IN_PROGRESS',
        Done: 'DONE',
        TODO: 'TODO',
        IN_PROGRESS: 'IN_PROGRESS',
        DONE: 'DONE',
      },
      'supportTicket.status': {
        Open: 'OPEN',
        Pending: 'PENDING',
        Resolved: 'RESOLVED',
        OPEN: 'OPEN',
        PENDING: 'PENDING',
        RESOLVED: 'RESOLVED',
      },
      'supportTicket.priority': {
        Urgent: 'URGENT',
        High: 'HIGH',
        Normal: 'NORMAL',
        URGENT: 'URGENT',
        HIGH: 'HIGH',
        NORMAL: 'NORMAL',
      },
      'supportTicket.channel': {
        Email: 'EMAIL',
        Chat: 'CHAT',
        Phone: 'PHONE',
        EMAIL: 'EMAIL',
        CHAT: 'CHAT',
        PHONE: 'PHONE',
      },
    }
    return maps[key]?.[value] ?? value
  }
}
