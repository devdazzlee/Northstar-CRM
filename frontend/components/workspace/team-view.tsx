'use client'

import { useState } from 'react'
import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Users } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { EmptyState } from '@/components/ui/empty-state'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { ApiError } from '@/lib/api/client'
import { fetchTeamMembers, inviteTeamMember, teamKeys } from '@/lib/api/team'
import { ui, type Notify } from '@/lib/ui'
import { inviteFormSchema, inviteRoles, type InviteFormValues } from '@/lib/validators/invite'

export function TeamView({ notify }: { notify: Notify }) {
  const query = useQuery({ queryKey: teamKeys.members(), queryFn: fetchTeamMembers })
  const [showInvite, setShowInvite] = useState(false)
  const client = useQueryClient()
  const inviteMutation = useMutation({
    mutationFn: inviteTeamMember,
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: teamKeys.members() })
    },
  })

  const people = query.data ?? []

  return (
    <QueryGate
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => void query.refetch()}
      loadingLabel="Loading team…"
      errorTitle="Could not load team"
      errorIcon={Users}
    >
    <div className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Admin"
        title="Team"
        description="Manage members and roles from the API"
        action="Invite member"
        onAction={() => setShowInvite(true)}
      />
      {people.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No members yet"
          description="Invite teammates to collaborate in this workspace."
          actionLabel="Invite member"
          onAction={() => setShowInvite(true)}
        />
      ) : (
        <div className={`${ui.shell} overflow-hidden`}>
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-slate-800/50">
              <tr>
                <th className="px-4 py-3">Member</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Permissions</th>
              </tr>
            </thead>
            <tbody>
              {people.map((person) => (
                <tr key={person.membershipId} className="border-t border-slate-100 dark:border-slate-800">
                  <td className="px-4 py-3 font-medium">
                    {person.firstName} {person.lastName}
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{person.email}</td>
                  <td className="px-4 py-3">
                    <span className="rounded-full bg-blue-50 px-2 py-1 text-xs text-blue-700">
                      {person.role.replaceAll('_', ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-slate-500">{person.permissions.length} grants</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {showInvite && (
        <InviteForm
          busy={inviteMutation.isPending}
          onClose={() => setShowInvite(false)}
          onSubmit={async (values) => {
            try {
              const [firstName, ...rest] = values.email.split('@')[0]?.split(/[._-]/) ?? ['Teammate']
              await inviteMutation.mutateAsync({
                email: values.email,
                firstName: firstName || 'Teammate',
                lastName: rest.join(' ') || 'User',
                password: 'Password123!',
                role: values.role === 'Admin' ? 'ORG_ADMIN' : values.role === 'Manager' ? 'SALES_MANAGER' : 'SALES_REP',
              })
              setShowInvite(false)
              notify(`Invitation sent as ${values.role}`)
            } catch (error) {
              notify(error instanceof ApiError ? error.message : 'Invite failed')
            }
          }}
        />
      )}
    </div>
    </QueryGate>
  )
}

/** @deprecated Prefer TeamView invite flow — kept for unit tests. */
export function InviteMemberDialog({
  onClose,
  onSubmit,
  busy,
}: {
  onClose: () => void
  onSubmit: (values: InviteFormValues) => void | Promise<void>
  busy?: boolean
}) {
  return <InviteForm onClose={onClose} onSubmit={onSubmit} busy={busy} />
}

function InviteForm({
  onClose,
  onSubmit,
  busy,
}: {
  onClose: () => void
  onSubmit: (values: InviteFormValues) => void | Promise<void>
  busy?: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<InviteFormValues>({
    resolver: zodResolver(inviteFormSchema),
    defaultValues: { email: '', role: 'Member' },
  })

  return (
    <Modal title="Invite member" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4" noValidate>
        <label className="block text-xs font-medium">
          Email
          <input
            {...register('email')}
            placeholder="name@company.com"
            className={`${ui.input} mt-1 w-full`}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className="mt-1 block text-[11px] text-rose-600">{errors.email.message}</span>}
        </label>
        <label className="block text-xs font-medium">
          Role
          <select {...register('role')} className={`${ui.input} mt-1 w-full bg-slate-50 dark:bg-slate-800`} aria-invalid={Boolean(errors.role)}>
            {inviteRoles.map((role) => (
              <option key={role} value={role}>
                {role}
              </option>
            ))}
          </select>
          {errors.role && <span className="mt-1 block text-[11px] text-rose-600">{errors.role.message}</span>}
        </label>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={ui.button} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={ui.buttonPrimary} disabled={busy}>
            {busy ? 'Sending…' : 'Send invitation'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
