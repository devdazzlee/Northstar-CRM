import { Controller, Get } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import type { AuthUser } from '../../common/types/auth-user'
import { ReportsService } from './reports.service'

@ApiTags('reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Dashboard KPIs for current organization' })
  dashboard(@CurrentUser() user: AuthUser) {
    return this.reportsService.dashboard(user)
  }

  @Get('forecast')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Weighted pipeline forecast' })
  forecast(@CurrentUser() user: AuthUser) {
    return this.reportsService.forecast(user)
  }

  @Get('overview')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'CRM overview feeds' })
  overview(@CurrentUser() user: AuthUser) {
    return this.reportsService.overview(user)
  }

  @Get('support-analytics')
  @RequirePermissions('reports:read')
  @ApiOperation({ summary: 'Support ticket analytics' })
  supportAnalytics(@CurrentUser() user: AuthUser) {
    return this.reportsService.supportAnalytics(user)
  }
}
