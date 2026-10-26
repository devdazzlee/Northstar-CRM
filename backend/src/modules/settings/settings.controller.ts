import { Body, Controller, Get, Patch, ValidationPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import type { AuthUser } from '../../common/types/auth-user'
import { SettingsService } from './settings.service'

const rawBodyPipe = new ValidationPipe({
  whitelist: false,
  forbidNonWhitelisted: false,
  transform: true,
})

@ApiTags('settings')
@ApiBearerAuth()
@Controller('settings')
export class SettingsController {
  constructor(private readonly settingsService: SettingsService) {}

  @Get()
  @RequirePermissions('settings:read')
  @ApiOperation({ summary: 'Get organization settings' })
  get(@CurrentUser() user: AuthUser) {
    return this.settingsService.get(user)
  }

  @Patch()
  @RequirePermissions('settings:write')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        timezone: { type: 'string' },
        locale: { type: 'string' },
        currency: { type: 'string' },
        companyName: { type: 'string' },
        features: { type: 'object' },
        branding: { type: 'object' },
      },
    },
  })
  @ApiOperation({ summary: 'Update organization settings' })
  update(
    @CurrentUser() user: AuthUser,
    @Body(rawBodyPipe) body: Record<string, unknown>,
  ) {
    return this.settingsService.update(user, body)
  }
}
