'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  createCompanyApi,
  createContactApi,
  createDealApi,
  createLeadApi,
  createTaskApi,
  crmKeys,
  deleteLeadApi,
  fetchCompanies,
  fetchContacts,
  fetchDashboard,
  fetchDeals,
  fetchLeads,
  fetchNotifications,
  fetchTasks,
  markAllNotificationsReadApi,
  markNotificationReadApi,
  updateContactStageApi,
  updateDealStageApi,
  updateLeadOwnerApi,
  updateLeadStatusApi,
  updateLeadTagsApi,
  updateTaskStatusApi,
  type CreateCompanyInput,
  type CreateContactInput,
  type CreateDealInput,
  type CreateLeadInput,
  type CreateTaskInput,
} from '@/lib/api/crm'
import type { UiDeal, UiTask } from '@/lib/api/mappers'
import type { Company, Contact, Lead, WorkspaceNotification } from '@/lib/types'

export function useContactsQuery() {
  return useQuery({ queryKey: crmKeys.contacts(), queryFn: fetchContacts })
}

export function useCompaniesQuery() {
  return useQuery({ queryKey: crmKeys.companies(), queryFn: fetchCompanies })
}

export function useLeadsQuery() {
  return useQuery({ queryKey: crmKeys.leads(), queryFn: fetchLeads })
}

export function useDealsQuery() {
  return useQuery({ queryKey: crmKeys.deals(), queryFn: fetchDeals })
}

export function useTasksQuery() {
  return useQuery({ queryKey: crmKeys.tasks(), queryFn: fetchTasks })
}

export function useDashboardQuery() {
  return useQuery({ queryKey: crmKeys.dashboard(), queryFn: fetchDashboard })
}

export function useNotificationsQuery() {
  return useQuery({ queryKey: crmKeys.notifications(), queryFn: fetchNotifications })
}

export function useCreateContactMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateContactInput) => createContactApi(input),
    onSuccess: (contact) => {
      client.setQueryData<Contact[]>(crmKeys.contacts(), (current) =>
        current ? [contact, ...current] : [contact],
      )
    },
  })
}

export function useCreateCompanyMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateCompanyInput) => createCompanyApi(input),
    onSuccess: (company) => {
      client.setQueryData<Company[]>(crmKeys.companies(), (current) =>
        current ? [company, ...current] : [company],
      )
    },
  })
}

export function useCreateLeadMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateLeadInput) => createLeadApi(input),
    onSuccess: (lead) => {
      client.setQueryData<Lead[]>(crmKeys.leads(), (current) => (current ? [lead, ...current] : [lead]))
    },
  })
}

export function useUpdateLeadStatusMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateLeadStatusApi(id, status),
    onSuccess: (lead) => {
      client.setQueryData<Lead[]>(crmKeys.leads(), (current) =>
        current ? current.map((row) => (row.id === lead.id ? lead : row)) : [lead],
      )
    },
  })
}

export function useDeleteLeadMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteLeadApi(id),
    onSuccess: (_void, id) => {
      client.setQueryData<Lead[]>(crmKeys.leads(), (current) =>
        current ? current.filter((row) => row.id !== id) : [],
      )
    },
  })
}

export function useUpdateLeadOwnerMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, ownerName }: { id: string; ownerName: string }) =>
      updateLeadOwnerApi(id, ownerName),
    onSuccess: (lead) => {
      client.setQueryData<Lead[]>(crmKeys.leads(), (current) =>
        current ? current.map((row) => (row.id === lead.id ? lead : row)) : [lead],
      )
    },
  })
}

export function useUpdateLeadTagsMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, tags }: { id: string; tags: string[] }) => updateLeadTagsApi(id, tags),
    onSuccess: (lead) => {
      client.setQueryData<Lead[]>(crmKeys.leads(), (current) =>
        current ? current.map((row) => (row.id === lead.id ? lead : row)) : [lead],
      )
    },
  })
}

export function useCreateDealMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateDealInput) => createDealApi(input),
    onSuccess: (deal) => {
      client.setQueryData<UiDeal[]>(crmKeys.deals(), (current) => (current ? [deal, ...current] : [deal]))
    },
  })
}

export function useUpdateDealStageMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => updateDealStageApi(id, stage),
    onSuccess: (deal) => {
      client.setQueryData<UiDeal[]>(crmKeys.deals(), (current) =>
        current ? current.map((row) => (row.id === deal.id ? deal : row)) : [deal],
      )
    },
  })
}

export function useCreateTaskMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (input: CreateTaskInput) => createTaskApi(input),
    onSuccess: () => {
      void client.invalidateQueries({ queryKey: crmKeys.tasks() })
    },
  })
}

export function useUpdateTaskStatusMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => updateTaskStatusApi(id, status),
    onSuccess: (task) => {
      client.setQueryData<UiTask[]>(crmKeys.tasks(), (current) =>
        current ? current.map((row) => (row.id === task.id ? task : row)) : [task],
      )
      void client.invalidateQueries({ queryKey: crmKeys.dashboard() })
    },
  })
}

export function useUpdateContactStageMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, stage }: { id: string; stage: string }) => updateContactStageApi(id, stage),
    onSuccess: (contact) => {
      client.setQueryData<Contact[]>(crmKeys.contacts(), (current) =>
        current ? current.map((row) => (row.id === contact.id ? contact : row)) : [contact],
      )
    },
  })
}

export function useMarkNotificationReadMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => markNotificationReadApi(id),
    onSuccess: (_void, id) => {
      client.setQueryData(crmKeys.notifications(), (current: WorkspaceNotification[] | undefined) =>
        current?.map((row) => (row.id === id ? { ...row, read: true } : row)),
      )
    },
  })
}

export function useMarkAllNotificationsReadMutation() {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (ids: string[]) => markAllNotificationsReadApi(ids),
    onSuccess: () => {
      client.setQueryData(crmKeys.notifications(), (current: WorkspaceNotification[] | undefined) =>
        current?.map((row) => ({ ...row, read: true })),
      )
    },
  })
}
