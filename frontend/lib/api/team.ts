import { api } from '@/lib/api/client'

export type TeamMember = {
  membershipId: string
  userId: string
  email: string
  firstName: string
  lastName: string
  role: string
  permissions: string[]
  tabs?: string[]
  activity?: string
  team?: string
}

type ApiMembershipRow = {
  membershipId: string
  role: string
  permissions: string[]
  tabs?: string[]
  user: {
    id: string
    email: string
    firstName: string
    lastName: string
  }
}

export const teamKeys = {
  all: ['team'] as const,
  members: () => [...teamKeys.all, 'members'] as const,
}

function mapMember(row: ApiMembershipRow): TeamMember {
  return {
    membershipId: row.membershipId,
    userId: row.user.id,
    email: row.user.email,
    firstName: row.user.firstName,
    lastName: row.user.lastName,
    role: row.role,
    permissions: row.permissions,
    tabs: row.tabs,
  }
}

export async function fetchTeamMembers(): Promise<TeamMember[]> {
  const res = await api.get<ApiMembershipRow[]>('/users?page=1&limit=100')
  const rows = Array.isArray(res.data) ? res.data : []
  return rows.map(mapMember)
}

export async function inviteTeamMember(input: {
  email: string
  firstName: string
  lastName: string
  password: string
  role: string
}): Promise<TeamMember> {
  const res = await api.post<{ membership: ApiMembershipRow } | ApiMembershipRow>('/users/invite', input)
  const payload = res.data
  if (payload && 'membership' in payload && payload.membership) {
    return mapMember(payload.membership)
  }
  return mapMember(payload as ApiMembershipRow)
}
