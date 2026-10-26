import { Body, Controller, Param, ParseUUIDPipe, Post, ValidationPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import type { AuthUser } from '../../common/types/auth-user'
import { EnginesService } from './engines.service'

const raw = new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true })

@ApiTags('engines')
@ApiBearerAuth()
@Controller('engines')
export class EnginesController {
  constructor(private readonly enginesService: EnginesService) {}

  @Post('lead-scoring/run')
  @RequirePermissions('automation:write')
  @ApiOperation({ summary: 'Recompute lead scores from active rules' })
  score(@CurrentUser() user: AuthUser) {
    return this.enginesService.scoreLeads(user)
  }

  @Post('assignment/run')
  @RequirePermissions('automation:write')
  @ApiBody({ schema: { properties: { entityType: { type: 'string', example: 'lead' } } } })
  assign(
    @CurrentUser() user: AuthUser,
    @Body(raw) body: { entityType?: string },
  ) {
    return this.enginesService.runAssignment(user, body.entityType ?? 'lead')
  }

  @Post('automation/run')
  @RequirePermissions('automation:write')
  @ApiOperation({ summary: 'Queue all active automation rules' })
  automate(@CurrentUser() user: AuthUser) {
    return this.enginesService.runAutomations(user)
  }

  @Post('approvals/request')
  @RequirePermissions('automation:write')
  request(
    @CurrentUser() user: AuthUser,
    @Body(raw) body: { workflowId: string; entityType: string; entityId: string; note?: string },
  ) {
    return this.enginesService.requestApproval(user, body)
  }

  @Post('approvals/:id/decide')
  @RequirePermissions('automation:write')
  decide(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(raw) body: { decision: 'approved' | 'rejected'; note?: string },
  ) {
    return this.enginesService.decideApproval(user, id, body.decision, body.note)
  }

  @Post('campaigns/:id/send')
  @RequirePermissions('engage:write')
  sendCampaign(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body(raw) body: { recipients: string[] },
  ) {
    return this.enginesService.sendCampaign(user, id, body.recipients ?? [])
  }

  @Post('sequences/enroll')
  @RequirePermissions('engage:write')
  enroll(
    @CurrentUser() user: AuthUser,
    @Body(raw) body: { sequenceId: string; leadId?: string; contactId?: string },
  ) {
    return this.enginesService.enrollSequence(user, body)
  }

  @Post('sequences/tick')
  @RequirePermissions('engage:write')
  tick(@CurrentUser() user: AuthUser) {
    return this.enginesService.tickSequences(user)
  }
}
