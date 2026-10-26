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
import {
  CreateCompanyDto,
  ListCompaniesQueryDto,
  UpdateCompanyDto,
} from './companies.dto'
import { CompaniesService } from './companies.service'

@ApiTags('companies')
@ApiBearerAuth()
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Get()
  @RequirePermissions('companies:read')
  @ApiOperation({ summary: 'List companies (paginated + Postgres FTS)' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListCompaniesQueryDto) {
    return this.companiesService.list(user, query)
  }

  @Get(':id')
  @RequirePermissions('companies:read')
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.getById(user, id)
  }

  @Post()
  @RequirePermissions('companies:write')
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateCompanyDto) {
    return this.companiesService.create(user, dto)
  }

  @Patch(':id')
  @RequirePermissions('companies:write')
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateCompanyDto,
  ) {
    return this.companiesService.update(user, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('companies:write')
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.companiesService.remove(user, id)
  }
}
