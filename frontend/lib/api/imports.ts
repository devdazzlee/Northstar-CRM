import { api } from '@/lib/api/client'

export type ImportEntityType = 'contacts' | 'leads' | 'companies'

export type ImportJob = {
  id: string
  entityType: string
  fileName: string | null
  totalRows: number
  status: string
  createdAt?: string
}

export async function createImportJob(input: {
  entityType: ImportEntityType
  fileName?: string
  rows: Record<string, string>[]
}): Promise<ImportJob> {
  const res = await api.post<ImportJob>('/imports', input)
  return res.data
}

export async function fetchImportJobs(): Promise<ImportJob[]> {
  const res = await api.get<ImportJob[]>('/imports')
  return Array.isArray(res.data) ? res.data : []
}

export async function fetchImportJob(id: string): Promise<ImportJob> {
  const res = await api.get<ImportJob>(`/imports/${id}`)
  return res.data
}

/** Parse a simple CSV string into row objects (header row required). */
export function parseCsv(text: string): Record<string, string>[] {
  const lines = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
  if (lines.length < 2) return []
  const headers = splitCsvLine(lines[0]).map((h) => h.trim())
  return lines.slice(1).map((line) => {
    const cells = splitCsvLine(line)
    const row: Record<string, string> = {}
    headers.forEach((header, index) => {
      row[header] = (cells[index] ?? '').trim()
    })
    return row
  })
}

function splitCsvLine(line: string): string[] {
  const out: string[] = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i]
    if (ch === '"') {
      inQuotes = !inQuotes
      continue
    }
    if (ch === ',' && !inQuotes) {
      out.push(current)
      current = ''
      continue
    }
    current += ch
  }
  out.push(current)
  return out
}
