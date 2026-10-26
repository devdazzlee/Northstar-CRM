import { Injectable } from '@nestjs/common'
import type { AuthUser } from '../../common/types/auth-user'
import { PrismaService } from '../../database/prisma.service'

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async get(user: AuthUser) {
    const settings = await this.prisma.orgSettings.upsert({
      where: { organizationId: user.organizationId },
      update: {},
      create: { organizationId: user.organizationId },
    })
    return { data: settings, message: '' }
  }

  async update(user: AuthUser, body: Record<string, unknown>) {
    const allowed = ['timezone', 'locale', 'currency', 'companyName', 'features', 'branding'] as const
    const data: Record<string, unknown> = {}
    for (const key of allowed) {
      if (body[key] !== undefined) data[key] = body[key]
    }

    const settings = await this.prisma.orgSettings.upsert({
      where: { organizationId: user.organizationId },
      update: data,
      create: { organizationId: user.organizationId, ...data },
    })

    return { data: settings, message: 'Settings updated' }
  }
}
