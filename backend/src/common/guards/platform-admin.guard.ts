import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PLATFORM_ADMIN_KEY } from '../decorators/platform-admin.decorator'
import { ForbiddenError } from '../errors/app.error'
import type { AuthUser } from '../types/auth-user'

@Injectable()
export class PlatformAdminGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<boolean>(PLATFORM_ADMIN_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required) return true

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>()
    if (request.user?.platformRole !== 'PLATFORM_ADMIN') {
      throw new ForbiddenError('Platform admin required')
    }
    return true
  }
}
