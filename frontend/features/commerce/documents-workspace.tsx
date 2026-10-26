'use client'

import { useMemo, useRef, useState } from 'react'
import { FileText, Folder, Upload } from 'lucide-react'
import { GlobalLoader } from '@/components/ui/global-loader'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogListQuery } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { catalogKeys } from '@/lib/api/catalog'
import { uploadDocument, type DocumentRow } from '@/lib/api/documents'
import { ui, type Notify } from '@/lib/ui'
import { useQueryClient } from '@tanstack/react-query'

function formatBytes(value?: number | null) {
  if (!value) return '—'
  if (value < 1024) return `${value} B`
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`
  return `${(value / (1024 * 1024)).toFixed(1)} MB`
}

export function DocumentsWorkspace({ notify }: { notify: Notify }) {
  const query = useCatalogListQuery('documents')
  const client = useQueryClient()
  const rows = (query.data ?? []) as DocumentRow[]
  const [previewId, setPreviewId] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [folder, setFolder] = useState('All files')
  const inputRef = useRef<HTMLInputElement>(null)

  const preview = rows.find((row) => row.id === previewId) ?? rows[0]

  const visible = useMemo(() => {
    if (folder === 'All files') return rows
    return rows.filter((row) => String(row.mimeType || '').toLowerCase().includes(folder.toLowerCase().slice(0, 3)))
  }, [rows, folder])

  const onUpload = async (fileList: FileList | null) => {
    const file = fileList?.[0]
    if (!file) return
    setUploading(true)
    try {
      const doc = await uploadDocument(file)
      client.setQueryData(catalogKeys.list('documents'), (current: DocumentRow[] | undefined) =>
        current ? [doc, ...current] : [doc],
      )
      setPreviewId(doc.id)
      notify(`${doc.name} uploaded`)
    } catch (error) {
      notify(error instanceof Error ? error.message : error instanceof ApiError ? error.message : 'Upload failed')
    } finally {
      setUploading(false)
      if (inputRef.current) inputRef.current.value = ''
    }
  }

  return (
    <section className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Workspace"
        title="Documents"
        description="Organize files, templates, versions, and record attachments."
        action={uploading ? 'Uploading…' : 'Upload files'}
        onAction={() => inputRef.current?.click()}
      />
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        onChange={(event) => void onUpload(event.target.files)}
      />
      <QueryGate
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => void query.refetch()}
        loadingLabel="Loading documents…"
        isEmpty={!query.isLoading && rows.length === 0}
        emptyTitle="No documents yet"
        emptyDescription="Upload a file to store it in your org library."
        emptyActionLabel="Upload files"
        onEmptyAction={() => inputRef.current?.click()}
        className="p-0"
      >
        <div className="grid gap-5 lg:grid-cols-[220px_1fr_300px]">
          <aside className={`${ui.shell} p-4`}>
            <h3 className="mb-3 text-sm font-semibold">Folders</h3>
            {['All files', 'pdf', 'doc', 'image'].map((x) => (
              <button
                type="button"
                className={`mb-1 flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs ${folder === x ? 'bg-indigo-50 text-indigo-700' : 'text-slate-500'}`}
                key={x}
                onClick={() => setFolder(x)}
              >
                <Folder className="size-3.5" />
                {x === 'All files' ? x : x.toUpperCase()}
                <span className="ml-auto">
                  {x === 'All files'
                    ? rows.length
                    : rows.filter((row) => String(row.mimeType || '').toLowerCase().includes(x)).length}
                </span>
              </button>
            ))}
            <button
              type="button"
              className={`${ui.button} mt-4 w-full`}
              onClick={() => inputRef.current?.click()}
              disabled={uploading}
            >
              <Upload className="mr-1 inline size-3.5" />
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </aside>
          <div className={`${ui.shell} p-5`}>
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="font-semibold">{folder === 'All files' ? 'All files' : folder.toUpperCase()}</h2>
                <p className="text-xs text-slate-500">{visible.length} files from API</p>
              </div>
            </div>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {visible.map((doc) => (
                <button
                  type="button"
                  onClick={() => setPreviewId(doc.id)}
                  className={`rounded-xl border p-4 text-left ${preview?.id === doc.id ? 'border-indigo-400 bg-indigo-50/50' : 'border-slate-200 dark:border-slate-700'}`}
                  key={doc.id}
                >
                  <div className="mb-4 grid size-10 place-items-center rounded-lg bg-indigo-50 text-indigo-600">
                    <FileText className="size-5" />
                  </div>
                  <p className="truncate text-sm font-medium">{doc.name}</p>
                  <p className="mt-1 text-xs text-slate-500">
                    {formatBytes(doc.sizeBytes)} ·{' '}
                    {doc.createdAt ? new Date(doc.createdAt).toLocaleDateString() : '—'}
                  </p>
                </button>
              ))}
            </div>
          </div>
          <aside className={`${ui.shell} p-5`}>
            {preview ? (
              <>
                <p className="text-xs text-slate-500">Preview</p>
                <h3 className="mt-2 font-semibold">{preview.name}</h3>
                <div className="my-5 grid h-48 place-items-center rounded-lg bg-slate-50 dark:bg-slate-950">
                  <FileText className="size-10 text-slate-300" />
                </div>
                <div className="space-y-2 text-xs">
                  <p className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    Type <span className="float-right">{preview.mimeType || '—'}</span>
                  </p>
                  <p className="rounded-lg border border-slate-200 p-3 dark:border-slate-700">
                    Size <span className="float-right">{formatBytes(preview.sizeBytes)}</span>
                  </p>
                  {preview.fileUrl && (
                    <a
                      href={preview.fileUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex w-full justify-center rounded-lg bg-indigo-600 px-3 py-2 text-xs font-semibold text-white"
                    >
                      Open file
                    </a>
                  )}
                </div>
              </>
            ) : (
              <GlobalLoader variant="section" label="Select a file" />
            )}
          </aside>
        </div>
      </QueryGate>
    </section>
  )
}
