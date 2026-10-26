import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { mkdir, writeFile } from 'fs/promises'
import { join } from 'path'
import { randomUUID } from 'crypto'
import type { AppConfig } from '../../config/configuration'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class DocumentsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<AppConfig, true>,
  ) {}

  async upload(
    user: AuthUser,
    file: Express.Multer.File,
    meta?: { relatedType?: string; relatedId?: string },
  ) {
    const uploadDir = this.config.get('uploadDir', { infer: true })
    const baseUrl = this.config.get('publicUploadBaseUrl', { infer: true })
    await mkdir(uploadDir, { recursive: true })

    const safeName = `${randomUUID()}-${file.originalname.replace(/[^a-zA-Z0-9._-]/g, '_')}`
    const fullPath = join(uploadDir, safeName)
    await writeFile(fullPath, file.buffer)

    const doc = await this.prisma.document.create({
      data: {
        organizationId: user.organizationId,
        name: file.originalname,
        fileUrl: `${baseUrl.replace(/\/$/, '')}/${safeName}`,
        mimeType: file.mimetype,
        sizeBytes: file.size,
        relatedType: meta?.relatedType,
        relatedId: meta?.relatedId,
      },
    })

    return { data: doc, message: 'Document uploaded' }
  }
}
