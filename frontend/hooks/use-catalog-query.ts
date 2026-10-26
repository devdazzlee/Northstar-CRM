'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  catalogKeys,
  createCatalogRecord,
  deleteCatalogRecord,
  fetchCatalogList,
  updateCatalogRecord,
  type CatalogRecord,
} from '@/lib/api/catalog'

export function useCatalogListQuery(route: string | null | undefined, enabled = true) {
  return useQuery({
    queryKey: catalogKeys.list(route || 'none'),
    queryFn: () => fetchCatalogList(route!),
    enabled: Boolean(route) && enabled,
  })
}

export function useCatalogCreateMutation(route: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (body: Record<string, unknown>) => createCatalogRecord(route, body),
    onSuccess: (row) => {
      client.setQueryData<CatalogRecord[]>(catalogKeys.list(route), (current) =>
        current ? [row, ...current] : [row],
      )
    },
  })
}

export function useCatalogUpdateMutation(route: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: ({ id, body }: { id: string; body: Record<string, unknown> }) =>
      updateCatalogRecord(route, id, body),
    onSuccess: (row) => {
      client.setQueryData<CatalogRecord[]>(catalogKeys.list(route), (current) =>
        current ? current.map((item) => (item.id === row.id ? { ...item, ...row } : item)) : [row],
      )
    },
  })
}

export function useCatalogDeleteMutation(route: string) {
  const client = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => deleteCatalogRecord(route, id),
    onSuccess: (_void, id) => {
      client.setQueryData<CatalogRecord[]>(catalogKeys.list(route), (current) =>
        current ? current.filter((item) => item.id !== id) : [],
      )
    },
  })
}
