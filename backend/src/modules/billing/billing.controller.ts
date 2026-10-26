import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { BillingPlan } from '@prisma/client'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import type { AuthUser } from '../../common/types/auth-user'
import { BillingService } from './billing.service'

const raw = new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true })

@ApiTags('billing')
@ApiBearerAuth()
@Controller('billing')
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  @Get()
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Current org SaaS plan + usage' })
  get(@CurrentUser() user: AuthUser) {
    return this.billingService.get(user)
  }

  @Post('upgrade')
  @RequirePermissions('settings:write')
  upgrade(@CurrentUser() user: AuthUser, @Body(raw) body: { plan: BillingPlan }) {
    return this.billingService.upgrade(user, body.plan)
  }
}
