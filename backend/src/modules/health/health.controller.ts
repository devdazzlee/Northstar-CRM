import { Controller, Get } from '@nestjs/common'
import { ApiOperation, ApiTags } from '@nestjs/swagger'
import { Public } from '../../common/decorators/public.decorator'
import { PrismaService } from '../../database/prisma.service'
import { JobsService } from '../../jobs/jobs.service'

@ApiTags('health')
@Controller('health')
export class HealthController {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jobs: JobsService,
  ) {}

  @Public()
  @Get()
  @ApiOperation({ summary: 'Liveness + database + jobs mode' })
  async check() {
    await this.prisma.$queryRaw`SELECT 1`
    return {
      data: {
        status: 'ok',
        database: 'up',
        jobs: this.jobs.status(),
        timestamp: new Date().toISOString(),
      },
      message: 'Healthy',
    }
  }
}
