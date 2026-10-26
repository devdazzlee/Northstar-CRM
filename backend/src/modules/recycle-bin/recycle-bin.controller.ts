import { Controller, Get, Param, Post } from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import type { AuthUser } from '../../common/types/auth-user'
import { RecycleBinService } from './recycle-bin.service'

@ApiTags('recycle-bin')
@ApiBearerAuth()
@Controller('recycle-bin')
export class RecycleBinController {
  constructor(private readonly recycleBinService: RecycleBinService) {}

  @Get()
  @RequirePermissions('contacts:write')
  @ApiOperation({ summary: 'List soft-deleted CRM records' })
  list(@CurrentUser() user: AuthUser) {
    return this.recycleBinService.list(user)
  }

  @Post(':resource/:id/restore')
  @RequirePermissions('contacts:write')
  @ApiOperation({ summary: 'Restore a soft-deleted record' })
  restore(
    @CurrentUser() user: AuthUser,
    @Param('resource') resource: string,
    @Param('id') id: string,
  ) {
    return this.recycleBinService.restore(user, resource, id)
  }
}
