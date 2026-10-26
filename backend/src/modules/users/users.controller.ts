import {
  Body,
  Controller,
  Get,
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
import { InviteUserDto, ListUsersQueryDto, UpdateMembershipRoleDto } from './users.dto'
import { UsersService } from './users.service'

@ApiTags('users')
@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @RequirePermissions('team:read')
  @ApiOperation({ summary: 'List organization members' })
  list(@CurrentUser() user: AuthUser, @Query() query: ListUsersQueryDto) {
    return this.usersService.list(user, query)
  }

  @Post('invite')
  @RequirePermissions('team:write')
  @ApiOperation({ summary: 'Invite user into current organization with a role' })
  invite(@CurrentUser() user: AuthUser, @Body() dto: InviteUserDto) {
    return this.usersService.invite(user, dto)
  }

  @Patch(':membershipId/role')
  @RequirePermissions('team:write')
  @ApiOperation({ summary: 'Update membership role (recomputes permissions)' })
  updateRole(
    @CurrentUser() user: AuthUser,
    @Param('membershipId', ParseUUIDPipe) membershipId: string,
    @Body() dto: UpdateMembershipRoleDto,
  ) {
    return this.usersService.updateRole(user, membershipId, dto)
  }
}
