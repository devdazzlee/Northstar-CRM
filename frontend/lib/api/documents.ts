import { api, getApiBaseUrl } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth-store'

export type DocumentRow = {
  id: string
  name: string
  fileUrl?: string | null
  mimeType?: string | null
  sizeBytes?: number | null
  relatedType?: string | null
  relatedId?: string | null
  createdAt?: string
  updatedAt?: string
}

export async function uploadDocument(
  file: File,
  meta?: { relatedType?: string; relatedId?: string },
): Promise<DocumentRow> {
  const form = new FormData()
  form.append('file', file)
  if (meta?.relatedType) form.append('relatedType', meta.relatedType)
  if (meta?.relatedId) form.append('relatedId', meta.relatedId)

  const token = useAuthStore.getState().accessToken
  const res = await fetch(`${getApiBaseUrl()}/documents/upload`, {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: form,
  })
  const json = (await res.json()) as {
    success?: boolean
    data?: DocumentRow
    message?: string
  }
  if (!res.ok || json.success === false || !json.data) {
    throw new Error(json.message || 'Upload failed')
  }
  return json.data
}

/** Prefer catalog list; this exists if you need a typed helper. */
export async function fetchDocuments(): Promise<DocumentRow[]> {
  const res = await api.get<DocumentRow[]>('/documents?page=1&limit=100')
  return Array.isArray(res.data) ? res.data : []
}
