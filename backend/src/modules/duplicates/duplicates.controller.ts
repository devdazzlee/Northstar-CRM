import { Body, Controller, Get, Post, ValidationPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import type { AuthUser } from '../../common/types/auth-user'
import { DuplicatesService } from './duplicates.service'

const raw = new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true })

@ApiTags('duplicates')
@ApiBearerAuth()
@Controller('duplicates')
export class DuplicatesController {
  constructor(private readonly duplicatesService: DuplicatesService) {}

  @Get('contacts')
  @RequirePermissions('contacts:read')
  @ApiOperation({ summary: 'Find duplicate contacts by email' })
  contacts(@CurrentUser() user: AuthUser) {
    return this.duplicatesService.findContacts(user)
  }

  @Get('companies')
  @RequirePermissions('companies:read')
  companies(@CurrentUser() user: AuthUser) {
    return this.duplicatesService.findCompanies(user)
  }

  @Post('contacts/merge')
  @RequirePermissions('contacts:write')
  @ApiBody({
    schema: {
      type: 'object',
      required: ['primaryId', 'duplicateIds'],
      properties: {
        primaryId: { type: 'string', format: 'uuid' },
        duplicateIds: { type: 'array', items: { type: 'string', format: 'uuid' } },
      },
    },
  })
  merge(
    @CurrentUser() user: AuthUser,
    @Body(raw) body: { primaryId: string; duplicateIds: string[] },
  ) {
    return this.duplicatesService.mergeContacts(user, body.primaryId, body.duplicateIds ?? [])
  }
}
