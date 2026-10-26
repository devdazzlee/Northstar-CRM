import { Body, Controller, Get, Param, ParseUUIDPipe, Post, ValidationPipe } from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import type { AuthUser } from '../../common/types/auth-user'
import { ImportsService } from './imports.service'

const raw = new ValidationPipe({ whitelist: false, forbidNonWhitelisted: false, transform: true })

@ApiTags('imports')
@ApiBearerAuth()
@Controller('imports')
export class ImportsController {
  constructor(private readonly importsService: ImportsService) {}

  @Post()
  @RequirePermissions('contacts:write')
  @ApiOperation({ summary: 'Queue CSV-like JSON rows for import' })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['entityType', 'rows'],
      properties: {
        entityType: { enum: ['contacts', 'leads', 'companies'] },
        fileName: { type: 'string' },
        rows: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  create(
    @CurrentUser() user: AuthUser,
    @Body(raw)
    body: {
      entityType: 'contacts' | 'leads' | 'companies'
      fileName?: string
      rows: Record<string, string>[]
    },
  ) {
    return this.importsService.create(user, body)
  }

  @Get()
  @RequirePermissions('contacts:read')
  list(@CurrentUser() user: AuthUser) {
    return this.importsService.list(user)
  }

  @Get(':id')
  @RequirePermissions('contacts:read')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.importsService.get(user, id)
  }
}
