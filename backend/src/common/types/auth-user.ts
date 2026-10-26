import type { MembershipRole, PlatformRole } from '@prisma/client'

export type AuthUser = {
  userId: string
  email: string
  organizationId: string
  membershipId: string
  role: MembershipRole
  permissions: string[]
  platformRole: PlatformRole
}
