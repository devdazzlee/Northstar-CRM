'use client'

import { useEffect, useState } from 'react'
import { Check, Download, FileSpreadsheet, Info, Upload } from 'lucide-react'
import { GlobalLoader } from '@/components/ui/global-loader'
import { Modal } from '@/components/ui/modal'
import { ApiError } from '@/lib/api/client'
import {
  createImportJob,
  fetchImportJob,
  parseCsv,
  type ImportEntityType,
  type ImportJob,
} from '@/lib/api/imports'
import { type Notify } from '@/lib/ui'

const inputClass =
  'mt-1.5 h-10 w-full rounded-lg border border-slate-200 bg-white px-3 text-sm outline-none focus:border-indigo-400 dark:border-slate-700 dark:bg-slate-950'

const DEMO_CSV = `firstName,lastName,email,company,phone
Sam,Rivera,sam@acme.example,Acme Inc,+1 415 555 0100
Riley,Chen,riley@brightline.example,Brightline,+1 212 555 0111
Jordan,Nguyen,jordan@catalog.example,Catalog,+1 512 555 0122`

export function ImportWizard({ onClose, notify }: { onClose: () => void; notify: Notify }) {
  const [step, setStep] = useState(1)
  const [entityType, setEntityType] = useState<ImportEntityType>('contacts')
  const [fileName, setFileName] = useState('northstar-contacts.csv')
  const [rows, setRows] = useState<Record<string, string>[]>(() => parseCsv(DEMO_CSV))
  const [duplicate, setDuplicate] = useState('Skip duplicates')
  const [job, setJob] = useState<ImportJob | null>(null)
  const [busy, setBusy] = useState(false)
  const steps = ['Upload', 'Map fields', 'Review', 'Import']
  const columns = rows[0] ? Object.keys(rows[0]) : []

  const startImport = async () => {
    setBusy(true)
    try {
      const created = await createImportJob({ entityType, fileName, rows })
      setJob(created)
      setStep(4)
      notify('Import queued')
    } catch (error) {
      notify(error instanceof ApiError ? error.message : 'Import failed')
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title="Import records" onClose={onClose} wide>
      <div className="mb-6 flex items-center gap-2">
        {steps.map((item, index) => (
          <div key={item} className="flex flex-1 items-center gap-2">
            <span
              className={`grid size-7 place-items-center rounded-full text-xs font-semibold ${
                step > index ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500 dark:bg-slate-800'
              }`}
            >
              {step > index + 1 ? <Check className="size-3.5" /> : index + 1}
            </span>
            <span className="text-xs font-medium text-slate-500">{item}</span>
            {index < 3 && <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className="space-y-4">
          <label className="text-xs font-medium">
            Entity type
            <select
              className={inputClass}
              value={entityType}
              onChange={(event) => setEntityType(event.target.value as ImportEntityType)}
            >
              <option value="contacts">Contacts</option>
              <option value="leads">Leads</option>
              <option value="companies">Companies</option>
            </select>
          </label>
          <div className="rounded-xl border-2 border-dashed border-indigo-200 bg-indigo-50/40 p-10 text-center dark:border-indigo-900 dark:bg-indigo-950/20">
            <Upload className="mx-auto size-8 text-indigo-500" />
            <h3 className="mt-3 text-sm font-semibold">Upload a CSV file</h3>
            <p className="mt-1 text-xs text-slate-500">Or continue with the demo sample ({rows.length} rows)</p>
            <input
              type="file"
              accept=".csv,text/csv"
              className="mx-auto mt-4 block text-xs"
              onChange={async (event) => {
                const file = event.target.files?.[0]
                if (!file) return
                const text = await file.text()
                const parsed = parseCsv(text)
                if (!parsed.length) {
                  notify('CSV needs a header row and at least one data row')
                  return
                }
                setFileName(file.name)
                setRows(parsed)
                notify(`${parsed.length} rows loaded`)
              }}
            />
            <button
              type="button"
              onClick={() => setStep(2)}
              className="mt-5 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white"
            >
              Continue with {rows.length} rows
            </button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div>
          <div className="mb-4 flex items-center gap-3 rounded-lg bg-slate-50 p-3 text-xs dark:bg-slate-800">
            <FileSpreadsheet className="size-5 text-emerald-500" />
            <span className="font-medium">{fileName}</span>
            <span className="ml-auto text-slate-400">{rows.length} rows</span>
          </div>
          <p className="mb-3 text-xs text-slate-500">Columns detected from your file / sample.</p>
          <div className="overflow-hidden rounded-lg border border-slate-200 dark:border-slate-700">
            <div className="grid grid-cols-2 bg-slate-50 px-3 py-2 text-[10px] font-semibold uppercase text-slate-400 dark:bg-slate-800">
              <span>File column</span>
              <span>Sample value</span>
            </div>
            {columns.map((item) => (
              <div
                key={item}
                className="grid grid-cols-2 border-t border-slate-100 px-3 py-2.5 text-xs dark:border-slate-800"
              >
                <span className="font-medium">{item}</span>
                <span className="truncate text-slate-500">{rows[0]?.[item] || '—'}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {step === 3 && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            <Metric label="Ready to import" value={String(rows.length)} />
            <Metric label="Entity" value={entityType} />
            <Metric label="File" value={fileName} />
          </div>
          <label className="text-xs font-medium">
            Duplicate handling
            <select className={inputClass} value={duplicate} onChange={(event) => setDuplicate(event.target.value)}>
              <option>Skip duplicates</option>
              <option>Update existing records</option>
              <option>Create new records</option>
            </select>
          </label>
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
            <Info className="mr-1 inline size-3.5" />
            Import posts rows to `POST /imports` and processes them on the server.
          </div>
        </div>
      )}

      {step === 4 && job && <ImportProgress jobId={job.id} notify={notify} onClose={onClose} />}

      {step < 4 && (
        <div className="mt-6 flex justify-between border-t border-slate-100 pt-4 dark:border-slate-800">
          <button
            type="button"
            onClick={() => (step > 1 ? setStep(step - 1) : onClose())}
            className="rounded-lg px-4 py-2 text-sm text-slate-500"
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          <button
            type="button"
            disabled={busy || (step === 1 && rows.length === 0)}
            onClick={() => {
              if (step === 3) void startImport()
              else setStep(step + 1)
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {busy ? 'Queuing…' : step === 3 ? 'Start import' : 'Continue'}
          </button>
        </div>
      )}
    </Modal>
  )
}

function ImportProgress({
  jobId,
  notify,
  onClose,
}: {
  jobId: string
  notify: Notify
  onClose: () => void
}) {
  const [job, setJob] = useState<ImportJob | null>(null)

  useEffect(() => {
    let alive = true
    const tick = async () => {
      try {
        const next = await fetchImportJob(jobId)
        if (!alive) return
        setJob(next)
        if (next.status === 'completed' || next.status === 'failed') return
      } catch {
        // keep polling briefly
      }
      window.setTimeout(() => void tick(), 800)
    }
    void tick()
    return () => {
      alive = false
    }
  }, [jobId])

  const done = job?.status === 'completed' || job?.status === 'failed'

  if (!job) return <GlobalLoader variant="section" label="Starting import…" />

  return (
    <div className="py-8 text-center">
      <div className="mx-auto grid size-16 place-items-center rounded-full bg-indigo-50 text-indigo-600 dark:bg-indigo-950/40">
        <Upload className="size-7" />
      </div>
      <h3 className="mt-4 text-base font-semibold">Import job {job.status}</h3>
      <p className="mt-1 text-sm text-slate-500">
        {job.totalRows} rows · {job.fileName || 'upload'} · id {job.id.slice(0, 8)}
      </p>
      {!done && <GlobalLoader variant="inline" label="Processing on server…" className="mt-6 justify-center" />}
      {done && (
        <div className="mt-6 flex justify-center gap-2">
          <button
            type="button"
            onClick={() => {
              notify(job.status === 'completed' ? 'Import complete' : 'Import finished with errors')
              onClose()
            }}
            className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white"
          >
            Done
          </button>
          <button
            type="button"
            onClick={() => notify('Open imports list from Contacts → Import')}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium dark:border-slate-700"
          >
            <Download className="mr-1 inline size-3.5" />
            View job
          </button>
        </div>
      )}
    </div>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-slate-50 p-3 dark:bg-slate-800/60">
      <p className="text-[10px] uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-1 truncate text-sm font-semibold">{value}</p>
    </div>
  )
}
