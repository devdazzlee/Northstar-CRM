import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { JwtService } from '@nestjs/jwt'
import * as bcrypt from 'bcrypt'
import { createHash, randomBytes } from 'crypto'
import type { AppConfig } from '../../config/configuration'
import { ConflictError, UnauthorizedError } from '../../common/errors/app.error'
import {
  permissionsForRole,
  tabsForPermissions,
} from '../../common/permissions/permissions'
import type { AuthUser } from '../../common/types/auth-user'
import { AuthRepository } from './auth.repository'
import type { LoginDto, RegisterDto } from './auth.dto'

const BCRYPT_ROUNDS = 12

type TokenPair = {
  accessToken: string
  refreshToken: string
  expiresIn: string
}

@Injectable()
export class AuthService {
  constructor(
    private readonly authRepository: AuthRepository,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService<AppConfig, true>,
  ) {}

  async register(dto: RegisterDto) {
    const existingSlug = await this.authRepository.slugExists(dto.organizationSlug)
    if (existingSlug) throw new ConflictError('Organization slug already taken')

    const existingEmail = await this.authRepository.emailExists(dto.email)
    if (existingEmail) throw new ConflictError('Email already registered')

    const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS)
    const permissions = permissionsForRole('ORG_ADMIN')

    const { organization, user, membership } =
      await this.authRepository.createOrganizationWithAdmin({
        organizationName: dto.organizationName,
        organizationSlug: dto.organizationSlug,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        passwordHash,
        permissions,
      })

    const authUser: AuthUser = {
      userId: user.id,
      email: user.email,
      organizationId: organization.id,
      membershipId: membership.id,
      role: membership.role,
      permissions: membership.permissions,
      platformRole: user.platformRole,
    }

    const tokens = await this.issueTokens(authUser)

    return {
      data: {
        user: this.toPublicUser(user),
        organization: {
          id: organization.id,
          name: organization.name,
          slug: organization.slug,
        },
        membership: {
          id: membership.id,
          role: membership.role,
          permissions: membership.permissions,
          tabs: tabsForPermissions(membership.permissions),
        },
        ...tokens,
      },
      message: 'Organization registered',
    }
  }

  async login(dto: LoginDto) {
    const user = await this.authRepository.findUserByEmail(dto.email)
    if (!user) throw new UnauthorizedError('Invalid credentials')

    const valid = await bcrypt.compare(dto.password, user.passwordHash)
    if (!valid) throw new UnauthorizedError('Invalid credentials')

    const memberships = user.memberships.filter((m) => !m.organization.deletedAt)
    if (memberships.length === 0) {
      throw new UnauthorizedError('No organization membership')
    }

    const orgSlug = dto.organizationSlug?.toLowerCase()
    const membership = orgSlug
      ? memberships.find((m) => m.organization.slug === orgSlug)
      : memberships[0]

    if (!membership) throw new UnauthorizedError('Organization not found for user')

    const authUser: AuthUser = {
      userId: user.id,
      email: user.email,
      organizationId: membership.organizationId,
      membershipId: membership.id,
      role: membership.role,
      permissions: membership.permissions,
      platformRole: user.platformRole,
    }

    const tokens = await this.issueTokens(authUser)

    await this.authRepository.createAuditLog({
      action: 'auth.login',
      resource: 'user',
      resourceId: user.id,
      organization: { connect: { id: membership.organizationId } },
      user: { connect: { id: user.id } },
    })

    return {
      data: {
        user: this.toPublicUser(user),
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
        },
        membership: {
          id: membership.id,
          role: membership.role,
          permissions: membership.permissions,
          tabs: tabsForPermissions(membership.permissions),
        },
        ...tokens,
      },
      message: 'Logged in',
    }
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken)
    const stored = await this.authRepository.findValidRefreshToken(tokenHash)
    if (!stored || stored.user.deletedAt) {
      throw new UnauthorizedError('Invalid refresh token')
    }

    await this.authRepository.revokeRefreshToken(stored.id)

    const membership = stored.user.memberships[0]
    if (!membership) throw new UnauthorizedError('No organization membership')

    const authUser: AuthUser = {
      userId: stored.user.id,
      email: stored.user.email,
      organizationId: membership.organizationId,
      membershipId: membership.id,
      role: membership.role,
      permissions: membership.permissions,
      platformRole: stored.user.platformRole,
    }

    const tokens = await this.issueTokens(authUser)
    return { data: tokens, message: 'Token refreshed' }
  }

  async logout(userId: string) {
    await this.authRepository.revokeAllUserRefreshTokens(userId)
    return { data: null, message: 'Logged out' }
  }

  async me(authUser: AuthUser) {
    const user = await this.authRepository.findUserById(authUser.userId)
    if (!user) throw new UnauthorizedError()

    const membership = user.memberships.find((m) => m.id === authUser.membershipId)
    if (!membership) throw new UnauthorizedError()

    return {
      data: {
        user: this.toPublicUser(user),
        organization: {
          id: membership.organization.id,
          name: membership.organization.name,
          slug: membership.organization.slug,
        },
        membership: {
          id: membership.id,
          role: membership.role,
          permissions: membership.permissions,
          tabs: tabsForPermissions(membership.permissions),
        },
      },
      message: '',
    }
  }

  private async issueTokens(authUser: AuthUser): Promise<TokenPair> {
    const jwt = this.configService.get('jwt', { infer: true })
    const accessToken = await this.jwtService.signAsync(
      {
        sub: authUser.userId,
        email: authUser.email,
        organizationId: authUser.organizationId,
        membershipId: authUser.membershipId,
        role: authUser.role,
        permissions: authUser.permissions,
        platformRole: authUser.platformRole,
      },
      {
        secret: jwt.accessSecret,
        // Nest JWT typings expect ms.StringValue; config is validated at startup.
        expiresIn: jwt.accessExpiresIn as `${number}${'s' | 'm' | 'h' | 'd'}`,
      },
    )

    const refreshToken = randomBytes(48).toString('hex')
    const expiresAt = this.refreshExpiryDate(jwt.refreshExpiresIn)

    await this.authRepository.createRefreshToken({
      userId: authUser.userId,
      tokenHash: this.hashToken(refreshToken),
      expiresAt,
    })

    return {
      accessToken,
      refreshToken,
      expiresIn: jwt.accessExpiresIn,
    }
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex')
  }

  private refreshExpiryDate(expiresIn: string): Date {
    const match = /^(\d+)([dhms])$/.exec(expiresIn)
    const amount = match ? Number(match[1]) : 7
    const unit = match?.[2] ?? 'd'
    const ms =
      unit === 'd'
        ? amount * 24 * 60 * 60 * 1000
        : unit === 'h'
          ? amount * 60 * 60 * 1000
          : unit === 'm'
            ? amount * 60 * 1000
            : amount * 1000
    return new Date(Date.now() + ms)
  }

  private toPublicUser(user: {
    id: string
    email: string
    firstName: string
    lastName: string
    platformRole: string
  }) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      platformRole: user.platformRole,
    }
  }
}
