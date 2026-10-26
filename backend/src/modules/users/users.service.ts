import { Injectable } from '@nestjs/common'
import * as bcrypt from 'bcrypt'
import { buildPageMeta } from '../../common/dto/pagination.dto'
import { ConflictError, ForbiddenError, NotFoundError } from '../../common/errors/app.error'
import {
  permissionsForRole,
  tabsForPermissions,
} from '../../common/permissions/permissions'
import type { AuthUser } from '../../common/types/auth-user'
import type { InviteUserDto, ListUsersQueryDto, UpdateMembershipRoleDto } from './users.dto'
import { UsersRepository } from './users.repository'

const BCRYPT_ROUNDS = 12

@Injectable()
export class UsersService {
  constructor(private readonly usersRepository: UsersRepository) {}

  async list(user: AuthUser, query: ListUsersQueryDto) {
    const { items, total } = await this.usersRepository.listMembers({
      organizationId: user.organizationId,
      page: query.page,
      limit: query.limit,
    })

    return {
      items: items.map((item) => ({
        membershipId: item.id,
        role: item.role,
        permissions: item.permissions,
        tabs: tabsForPermissions(item.permissions),
        createdAt: item.createdAt,
        user: item.user,
      })),
      meta: buildPageMeta(query.page, query.limit, total),
    }
  }

  async invite(actor: AuthUser, dto: InviteUserDto) {
    if (!actor.permissions.includes('team:write') && actor.role !== 'ORG_ADMIN') {
      throw new ForbiddenError()
    }

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
    const permissions = permissionsForRole(dto.role)

    const result = await this.usersRepository.inviteUser({
      organizationId: actor.organizationId,
      email: dto.email,
      firstName: dto.firstName,
      lastName: dto.lastName,
      passwordHash,
      role: dto.role,
      permissions,
    })

    if (result.alreadyMember) {
      throw new ConflictError('User is already a member of this organization')
    }

    return {
      data: {
        membershipId: result.membership.id,
        role: result.membership.role,
        permissions: result.membership.permissions,
        tabs: tabsForPermissions(result.membership.permissions),
        user: {
          id: result.user.id,
          email: result.user.email,
          firstName: result.user.firstName,
          lastName: result.user.lastName,
        },
      },
      message: 'User invited',
    }
  }

  async updateRole(actor: AuthUser, membershipId: string, dto: UpdateMembershipRoleDto) {
    const membership = await this.usersRepository.findMembership(
      actor.organizationId,
      membershipId,
    )
    if (!membership) throw new NotFoundError('Membership not found')

    if (membership.role === 'ORG_ADMIN' && dto.role !== 'ORG_ADMIN') {
      throw new ForbiddenError('Cannot demote OrgAdmin via this endpoint yet')
    }

    const permissions = permissionsForRole(dto.role)
    const updated = await this.usersRepository.updateRole(membershipId, dto.role, permissions)

    return {
      data: {
        membershipId: updated.id,
        role: updated.role,
        permissions: updated.permissions,
        tabs: tabsForPermissions(updated.permissions),
        user: updated.user,
      },
      message: 'Role updated',
    }
  }
}
