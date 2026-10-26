'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { GlobalLoader } from '@/components/ui/global-loader'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { ApiRecordsPanel } from '@/components/workspace/api-records-panel'
import {
  useCatalogCreateMutation,
  useCatalogDeleteMutation,
  useCatalogListQuery,
  useCatalogUpdateMutation,
} from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { catalogRecordLabel, type CatalogRecord } from '@/lib/api/catalog'
import { ui, type Notify } from '@/lib/ui'

type LiveCatalogWorkspaceProps = {
  title: string
  description?: string
  route: string
  notify: Notify
  createDefaults?: Record<string, unknown>
  nameField?: string
}

export function LiveCatalogWorkspace({
  title,
  description = 'Records loaded from the Northstar API.',
  route,
  notify,
  createDefaults = { status: 'Active' },
  nameField = 'name',
}: LiveCatalogWorkspaceProps) {
  const query = useCatalogListQuery(route)
  const createMutation = useCatalogCreateMutation(route)
  const updateMutation = useCatalogUpdateMutation(route)
  const deleteMutation = useCatalogDeleteMutation(route)
  const [showCreate, setShowCreate] = useState(false)
  const [editRow, setEditRow] = useState<CatalogRecord | null>(null)
  const [name, setName] = useState('')

  return (
    <div className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Live data"
        title={title}
        description={`${description} ${query.data?.length ?? 0} records.`}
        action="Create"
        onAction={() => {
          setName('')
          setShowCreate(true)
        }}
      />
      <ApiRecordsPanel
        title={title}
        rows={query.data ?? []}
        isLoading={query.isLoading}
        isError={query.isError}
        errorMessage={query.error instanceof Error ? query.error.message : undefined}
        onRetry={() => void query.refetch()}
        onOpen={(row) => notify(`${catalogRecordLabel(row)} opened`)}
        onEdit={(row) => {
          setEditRow(row)
          setName(String(row[nameField] ?? catalogRecordLabel(row)))
        }}
        onDelete={async (row) => {
          if (!row.id) return
          try {
            await deleteMutation.mutateAsync(String(row.id))
            notify(`${catalogRecordLabel(row)} deleted`)
          } catch (error) {
            notify(error instanceof ApiError ? error.message : 'Delete failed')
          }
        }}
      />
      {showCreate && (
        <Modal title={`Create ${title}`} onClose={() => setShowCreate(false)}>
          <label className="text-xs font-medium">
            Name
            <input
              className={`${ui.input} mt-1.5 w-full`}
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="Record name"
            />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={ui.button} onClick={() => setShowCreate(false)}>
              Cancel
            </button>
            <button
              type="button"
              className={ui.buttonPrimary}
              disabled={createMutation.isPending || name.trim().length < 2}
              onClick={async () => {
                try {
                  await createMutation.mutateAsync({
                    ...createDefaults,
                    [nameField]: name.trim(),
                  })
                  setShowCreate(false)
                  setName('')
                  notify(`${title} created`)
                } catch (error) {
                  notify(error instanceof ApiError ? error.message : 'Create failed')
                }
              }}
            >
              {createMutation.isPending ? (
                <GlobalLoader variant="inline" label="Saving…" />
              ) : (
                <>
                  <Plus className="mr-1 inline size-3.5" />
                  Save
                </>
              )}
            </button>
          </div>
        </Modal>
      )}
      {editRow?.id && (
        <Modal title={`Edit ${title}`} onClose={() => setEditRow(null)}>
          <label className="text-xs font-medium">
            Name
            <input
              className={`${ui.input} mt-1.5 w-full`}
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" className={ui.button} onClick={() => setEditRow(null)}>
              Cancel
            </button>
            <button
              type="button"
              className={ui.buttonPrimary}
              disabled={updateMutation.isPending || name.trim().length < 2}
              onClick={async () => {
                try {
                  await updateMutation.mutateAsync({
                    id: String(editRow.id),
                    body: { [nameField]: name.trim() },
                  })
                  setEditRow(null)
                  notify(`${title} updated`)
                } catch (error) {
                  notify(error instanceof ApiError ? error.message : 'Update failed')
                }
              }}
            >
              {updateMutation.isPending ? <GlobalLoader variant="inline" label="Saving…" /> : 'Save changes'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  )
}
