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
import { CreateContactDto, ListContactsQueryDto, UpdateContactDto } from './contacts.dto'
import { ContactsService } from './contacts.service'

@ApiTags('contacts')
@ApiBearerAuth()
@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  @RequirePermissions('contacts:read')
  @ApiOperation({ summary: 'List contacts (paginated, filterable, Postgres FTS via q)' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListContactsQueryDto) {
    return this.contactsService.list(user, query)
  }

  @Get(':id')
  @RequirePermissions('contacts:read')
  @ApiOperation({ summary: 'Get contact by id' })
  get(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.getById(user, id)
  }

  @Post()
  @RequirePermissions('contacts:write')
  @ApiOperation({ summary: 'Create contact' })
  create(@CurrentUser() user: AuthUser, @Body() dto: CreateContactDto) {
    return this.contactsService.create(user, dto)
  }

  @Patch(':id')
  @RequirePermissions('contacts:write')
  @ApiOperation({ summary: 'Update contact' })
  update(
    @CurrentUser() user: AuthUser,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateContactDto,
  ) {
    return this.contactsService.update(user, id, dto)
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @RequirePermissions('contacts:write')
  @ApiOperation({ summary: 'Soft-delete contact' })
  remove(@CurrentUser() user: AuthUser, @Param('id', ParseUUIDPipe) id: string) {
    return this.contactsService.remove(user, id)
  }
}
