import { Injectable } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import type { AppConfig } from '../../config/configuration'
import { UnauthorizedError } from '../../common/errors/app.error'
import type { AuthUser } from '../../common/types/auth-user'

type JwtPayload = {
  sub: string
  email: string
  organizationId: string
  membershipId: string
  role: AuthUser['role']
  permissions: string[]
  platformRole: AuthUser['platformRole']
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(configService: ConfigService<AppConfig, true>) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get('jwt.accessSecret', { infer: true }),
    })
  }

  validate(payload: JwtPayload): AuthUser {
    if (!payload?.sub || !payload.organizationId) {
      throw new UnauthorizedError('Invalid access token')
    }
    return {
      userId: payload.sub,
      email: payload.email,
      organizationId: payload.organizationId,
      membershipId: payload.membershipId,
      role: payload.role,
      permissions: payload.permissions ?? [],
      platformRole: payload.platformRole,
    }
  }
}
