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
} from '@nestjs/common'
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger'
import { CurrentUser } from '../../common/decorators/current-user.decorator'
import { RequirePermissions } from '../../common/decorators/permissions.decorator'
import type { AuthUser } from '../../common/types/auth-user'
import { CreateDealDto, ListDealsQueryDto, UpdateDealDto } from './deals.dto'
import { DealsService } from './deals.service'

@ApiTags('deals')
@ApiBearerAuth()
@Controller('deals')
export class DealsController {
  constructor(private readonly dealsService: DealsService) {}

  @Get()
  @RequirePermissions('deals:read')
  @ApiOperation({ summary: 'List deals (paginated + Postgres FTS)' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListDealsQueryDto) {
    return this.dealsService.list(user, query)
  }

  @Get(':id')
  @RequirePermissions('deals:read')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.dealsService.getById(user, id)
  }

  @Post()
  @RequirePermissions('deals:write')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateDealDto) {
    return this.dealsService.create(user, dto)
  }

  @Patch(':id')
  @RequirePermissions('deals:write')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateDealDto,
  ) {
    return this.dealsService.update(user, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('deals:write')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.dealsService.remove(user, id)
  }
}
