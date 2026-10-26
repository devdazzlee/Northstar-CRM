import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Type,
  ValidationPipe,
} from '@nestjs/common'
import { ApiBearerAuth, ApiBody, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import { PaginationQueryDto } from '../../common/dto/pagination.dto'
import type { AuthUser } from '../../common/types/auth-user'
import type { CatalogResource } from './catalog.registry'
import { CatalogService } from './catalog.service'

const rawBodyPipe = new ValidationPipe({
  whitelist: false,
  forbidNonWhitelisted: false,
  transform: true,
})

export function createCatalogController(resource: CatalogResource): Type<unknown> {
  @ApiTags(resource.tag)
  @ApiBearerAuth()
  @Controller(resource.route)
  class CatalogResourceController {
    constructor(public readonly catalogService: CatalogService) {}

    @Get()
    @RequirePermissions(resource.readPermission)
    @ApiOperation({ summary: `List ${resource.route}` })
    list(@CurrentUser() user: AuthUser, @Query() query: PaginationQueryDto) {
      return this.catalogService.list(resource.route, user, query)
    }

    @Get(':id')
    @RequirePermissions(resource.readPermission)
    @ApiOperation({ summary: `Get ${resource.route} by id` })
    get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
      return this.catalogService.getById(resource.route, user, id)
    }

    @Post()
    @RequirePermissions(resource.writePermission)
    @ApiBody({
      schema: {
        type: 'object',
        additionalProperties: true,
        description: `Writable: ${resource.writableFields.join(', ')}`,
      },
    })
    @ApiOperation({ summary: `Create ${resource.route}` })
    create(
      @CurrentUser() user: AuthUser,
      @Body(rawBodyPipe) body: Record<string, unknown>,
    ) {
      return this.catalogService.create(resource.route, user, body)
    }

    @Patch(':id')
    @RequirePermissions(resource.writePermission)
    @ApiBody({
      schema: {
        type: 'object',
        additionalProperties: true,
        description: `Writable: ${resource.writableFields.join(', ')}`,
      },
    })
    @ApiOperation({ summary: `Update ${resource.route}` })
    update(
      @CurrentUser() user: AuthUser,
      @Param('id', ParseUUIDPipe) id: string,
      @Body(rawBodyPipe) body: Record<string, unknown>,
    ) {
      return this.catalogService.update(resource.route, user, id, body)
    }

    @Delete(':id')
    @HttpCode(HttpStatus.OK)
    @RequirePermissions(resource.writePermission)
    @ApiOperation({ summary: `Soft-delete ${resource.route}` })
    remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
      return this.catalogService.remove(resource.route, user, id)
    }
  }

  Object.defineProperty(CatalogResourceController, 'name', {
    value: `${resource.route.replace(/-([a-z])/g, (_, c: string) => c.toUpperCase())}Controller`,
  })

  return CatalogResourceController
}
