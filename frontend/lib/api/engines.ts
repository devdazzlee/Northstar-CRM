import { api } from '@/lib/api/client'

export async function runAutomationsApi() {
  const res = await api.post<{ queued?: number }>('/engines/automation/run')
  return res.data
}

export async function runLeadScoringApi() {
  const res = await api.post<{ scored?: number }>('/engines/lead-scoring/run')
  return res.data
}

export async function runAssignmentApi(entityType = 'lead') {
  const res = await api.post<{ assigned?: number }>('/engines/assignment/run', { entityType })
  return res.data
}

export async function enrollSequenceApi(input: {
  sequenceId: string
  leadId?: string
  contactId?: string
}) {
  const res = await api.post('/engines/sequences/enroll', input)
  return res.data
}

export async function sendCampaignApi(id: string, recipients: string[]) {
  const res = await api.post<{ queued?: number }>(`/engines/campaigns/${id}/send`, { recipients })
  return res.data
}
