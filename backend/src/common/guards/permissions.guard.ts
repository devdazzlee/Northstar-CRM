import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator'
import { ForbiddenError } from '../errors/app.error'
import type { Permission } from '../permissions/permissions'
import type { AuthUser } from '../types/auth-user'

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const required = this.reflector.getAllAndOverride<Permission[]>(PERMISSIONS_KEY, [
      context.getHandler(),
      context.getClass(),
    ])
    if (!required || required.length === 0) return true

    const request = context.switchToHttp().getRequest<{ user?: AuthUser }>()
    const user = request.user
    if (!user) throw new ForbiddenError()

    if (user.platformRole === 'PLATFORM_ADMIN') return true

    const hasAll = required.every((permission) => user.permissions.includes(permission))
    if (!hasAll) {
      throw new ForbiddenError('Missing required permissions')
    }
    return true
  }
}
