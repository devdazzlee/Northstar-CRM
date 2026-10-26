'use client'

import { useRef, type ReactNode } from 'react'
import { useVirtualizer } from '@tanstack/react-virtual'

type Column<T> = {
  key: string
  header: string
  width?: string
  cell: (row: T) => ReactNode
}

type VirtualTableProps<T> = {
  rows: T[]
  columns: Column<T>[]
  rowHeight?: number
  maxHeight?: number
  getRowId: (row: T) => string
  onRowClick?: (row: T) => void
  emptyMessage?: string
}

/** Virtualized table for long CRM lists. Falls back to empty state when there are no rows. */
export function VirtualTable<T>({
  rows,
  columns,
  rowHeight = 56,
  maxHeight = 480,
  getRowId,
  onRowClick,
  emptyMessage = 'No records found.',
}: VirtualTableProps<T>) {
  const parentRef = useRef<HTMLDivElement>(null)
  const virtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => rowHeight,
    overscan: 8,
  })

  if (rows.length === 0) {
    return <p className="p-8 text-center text-sm text-slate-400">{emptyMessage}</p>
  }

  return (
    <div ref={parentRef} className="overflow-auto" style={{ maxHeight }}>
      <div className="sticky top-0 z-10 grid border-b border-slate-100 bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:border-slate-800 dark:bg-slate-800/50" style={{ gridTemplateColumns: columns.map((c) => c.width ?? '1fr').join(' ') }}>
        {columns.map((column) => (
          <div key={column.key} className="px-4 py-3 font-medium">
            {column.header}
          </div>
        ))}
      </div>
      <div className="relative w-full" style={{ height: virtualizer.getTotalSize() }}>
        {virtualizer.getVirtualItems().map((item) => {
          const row = rows[item.index]
          return (
            <div
              key={getRowId(row)}
              role={onRowClick ? 'button' : undefined}
              tabIndex={onRowClick ? 0 : undefined}
              onClick={onRowClick ? () => onRowClick(row) : undefined}
              onKeyDown={
                onRowClick
                  ? (event) => {
                      if (event.key === 'Enter' || event.key === ' ') {
                        event.preventDefault()
                        onRowClick(row)
                      }
                    }
                  : undefined
              }
              className="absolute left-0 grid w-full cursor-pointer border-b border-slate-100 text-sm hover:bg-slate-50/70 dark:border-slate-800 dark:hover:bg-slate-800/40"
              style={{
                height: item.size,
                transform: `translateY(${item.start}px)`,
                gridTemplateColumns: columns.map((c) => c.width ?? '1fr').join(' '),
              }}
            >
              {columns.map((column) => (
                <div key={column.key} className="flex items-center px-4 py-2">
                  {column.cell(row)}
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}
