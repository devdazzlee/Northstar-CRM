import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Post, UseGuards, ValidationPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { BillingPlan } from '@prisma/client'
import { PlatformAdminOnly } from '../../common/decorators/platform-admin.decorator'
import { PlatformAdminGuard } from '../../common/guards/platform-admin.guard'
import { PlatformService } from './platform.service'

const raw = new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true })

@ApiTags('platform')
@ApiBearerAuth()
@PlatformAdminOnly()
@UseGuards(PlatformAdminGuard)
@Controller('platform')
export class PlatformController {
  constructor(private readonly platformService: PlatformService) {}

  @Get('stats')
  @ApiOperation({ summary: 'Platform-wide stats' })
  stats() {
    return this.platformService.stats()
  }

  @Get('organizations')
  listOrgs() {
    return this.platformService.listOrganizations()
  }

  @Post('organizations/:id/suspend')
  suspend(@Param('id', ParseUUIDPipe) id: string) {
    return this.platformService.suspendOrganization(id)
  }

  @Patch('organizations/:id/plan')
  setPlan(
    @Param('id', ParseUUIDPipe) id: string,
    @Body(raw) body: { plan: BillingPlan; seatLimit?: number },
  ) {
    return this.platformService.setPlan(id, body.plan, body.seatLimit)
  }

  @Post('users/promote')
  promote(@Body(raw) body: { email: string }) {
    return this.platformService.promotePlatformAdmin(body.email)
  }
}
