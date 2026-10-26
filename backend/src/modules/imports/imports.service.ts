import { Injectable } from '@nestjs/common'
import { BadRequestError, NotFoundError } from '../../common/errors/app.error'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'
import { JobsService } from '../../jobs/jobs.service'

@Injectable()
export class ImportsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
  ) {}

  async create(
    user: AuthUser,
    input: {
      entityType: 'contacts' | 'leads' | 'companies'
      fileName?: string
      rows: Record<string, string>[]
    },
  ) {
    if (!input.rows?.length) throw new BadRequestError('rows required')
    if (!['contacts', 'leads', 'companies'].includes(input.entityType)) {
      throw new BadRequestError('entityType must be contacts|leads|companies')
    }

    const job = await this.prisma.importJob.create({
      data: {
        organizationId: user.organizationId,
        entityType: input.entityType,
        fileName: input.fileName,
        totalRows: input.rows.length,
        status: 'queued',
        createdById: user.userId,
      },
    })

    await this.jobs.enqueueImport({
      organizationId: user.organizationId,
      importJobId: job.id,
      entityType: input.entityType,
      rows: input.rows,
      userId: user.userId,
    })

    return { data: job, message: 'Import queued' }
  }

  async list(user: AuthUser) {
    const items = await this.prisma.importJob.findMany({
      where: { organizationId: user.organizationId },
      orderBy: { createdAt: 'desc' },
      take: 50,
    })
    return { items, meta: { page: 1, limit: 50, total: items.length, totalPages: 1 } }
  }

  async get(user: AuthUser, id: string) {
    const job = await this.prisma.importJob.findFirst({
      where: { id, organizationId: user.organizationId },
    })
    if (!job) throw new NotFoundError('Import job not found')
    return job
  }
}
