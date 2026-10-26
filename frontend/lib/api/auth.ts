import { api } from '@/lib/api/client'
import type { MembershipRole } from '@/lib/api/coverage'

export type AuthUserDto = {
  id: string
  email: string
  firstName: string
  lastName: string
  platformRole: string
}

export type AuthOrganizationDto = {
  id: string
  name: string
  slug: string
}

export type AuthMembershipDto = {
  id: string
  role: MembershipRole | string
  permissions: string[]
  tabs: string[]
}

export type AuthSessionDto = {
  user: AuthUserDto
  organization: AuthOrganizationDto
  membership: AuthMembershipDto
  accessToken: string
  refreshToken: string
  expiresIn: string
}

export type LoginInput = {
  email: string
  password: string
  organizationSlug?: string
}

export async function loginApi(input: LoginInput) {
  const res = await api.post<AuthSessionDto>('/auth/login', input, { skipAuth: true })
  return res.data
}

export async function meApi() {
  const res = await api.get<Omit<AuthSessionDto, 'accessToken' | 'refreshToken' | 'expiresIn'>>(
    '/auth/me',
  )
  return res.data
}

export async function logoutApi() {
  try {
    // Best-effort server revoke; client session is cleared by the caller.
    await api.post<null>('/auth/logout', {}, { skipAuth: false })
  } catch {
    // ignore network / auth errors on logout
  }
}
