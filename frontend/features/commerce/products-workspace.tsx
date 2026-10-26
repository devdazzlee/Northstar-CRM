'use client'

import { useMemo, useState } from 'react'
import { ChevronDown, MoreHorizontal, Search } from 'lucide-react'
import { GlobalLoader } from '@/components/ui/global-loader'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { QueryGate } from '@/components/ui/query-gate'
import { useCatalogCreateMutation, useCatalogListQuery } from '@/hooks/use-catalog-query'
import { ApiError } from '@/lib/api/client'
import { catalogRecordLabel } from '@/lib/api/catalog'
import { ui, type Notify } from '@/lib/ui'

type ProductRow = {
  id: string
  name?: string
  sku?: string
  category?: string | null
  priceCents?: number
  currency?: string
  currencies?: string[]
  billingPeriod?: string | null
  active?: boolean
}

export function ProductsWorkspace({ notify }: { notify: Notify }) {
  const [show, setShow] = useState(false)
  const [search, setSearch] = useState('')
  const query = useCatalogListQuery('products')
  const products = useMemo(() => {
    const rows = (query.data ?? []) as ProductRow[]
    const q = search.trim().toLowerCase()
    if (!q) return rows
    return rows.filter((row) =>
      [row.name, row.sku, row.category].some((value) => String(value ?? '').toLowerCase().includes(q)),
    )
  }, [query.data, search])

  return (
    <section className="p-5 lg:p-8">
      <PageHeader
        eyebrow="Catalog"
        title="Products"
        description="Manage products, price books, currencies, discounts, and categories."
        action="Add product"
        onAction={() => setShow(true)}
      />
      <div className={`${ui.shell} overflow-hidden`}>
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <input
              className={`${ui.input} w-full pl-9`}
              placeholder="Search catalog"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
          </div>
          <button type="button" className={ui.button} onClick={() => void query.refetch()}>
            Refresh
            <ChevronDown className="ml-2 inline size-3" />
          </button>
          <button type="button" className={ui.button} onClick={() => notify(`${products.length} products loaded`)}>
            Export
          </button>
        </div>
        <QueryGate
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => void query.refetch()}
          loadingLabel="Loading products…"
          isEmpty={!query.isLoading && products.length === 0}
          emptyTitle="No products yet"
          emptyDescription="Create your first catalog product."
          className="p-0"
        >
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950">
              <tr>
                {['Product', 'SKU', 'Category', 'Base price', 'Currencies', 'Status', ''].map((x) => (
                  <th className="px-5 py-3 font-medium" key={x}>
                    {x}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr className="border-t border-slate-100 dark:border-slate-800" key={p.id}>
                  <td className="px-5 py-4 font-semibold">{catalogRecordLabel(p)}</td>
                  <td className="px-5 py-4 font-mono text-xs text-slate-500">{p.sku || '—'}</td>
                  <td className="px-5 py-4">{p.category || '—'}</td>
                  <td className="px-5 py-4">{formatPrice(p.priceCents, p.currency, p.billingPeriod)}</td>
                  <td className="px-5 py-4 text-xs text-slate-500">
                    {(p.currencies ?? [p.currency || 'USD']).join(' · ')}
                  </td>
                  <td className="px-5 py-4">
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        p.active === false
                          ? 'bg-slate-100 text-slate-600 dark:bg-slate-800'
                          : 'bg-emerald-50 text-emerald-700'
                      }`}
                    >
                      {p.active === false ? 'Inactive' : 'Active'}
                    </span>
                  </td>
                  <td className="px-5 py-4">
                    <MoreHorizontal className="size-4 text-slate-400" />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </QueryGate>
      </div>
      {show && <ProductModal onClose={() => setShow(false)} notify={notify} />}
    </section>
  )
}

function formatPrice(cents?: number, currency = 'USD', period?: string | null) {
  const amount = typeof cents === 'number' ? cents / 100 : 0
  const money = new Intl.NumberFormat('en-US', { style: 'currency', currency, maximumFractionDigits: 0 }).format(
    amount,
  )
  if (!period) return money
  const short = period.toLowerCase().includes('year') ? 'yr' : period.toLowerCase().includes('month') ? 'mo' : period
  return `${money} / ${short}`
}

function ProductModal({ onClose, notify }: { onClose: () => void; notify: Notify }) {
  const create = useCatalogCreateMutation('products')
  const [name, setName] = useState('')
  const [sku, setSku] = useState('')
  const [price, setPrice] = useState('')
  const [category, setCategory] = useState('Plans')

  return (
    <Modal title="Create product" onClose={onClose}>
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="text-xs font-medium">
          Product name
          <input className={`${ui.input} mt-1.5 w-full`} value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <label className="text-xs font-medium">
          SKU
          <input className={`${ui.input} mt-1.5 w-full`} value={sku} onChange={(e) => setSku(e.target.value)} />
        </label>
        <label className="text-xs font-medium">
          Base price (USD)
          <input className={`${ui.input} mt-1.5 w-full`} value={price} onChange={(e) => setPrice(e.target.value)} />
        </label>
        <label className="text-xs font-medium">
          Category
          <input
            className={`${ui.input} mt-1.5 w-full`}
            value={category}
            onChange={(e) => setCategory(e.target.value)}
          />
        </label>
      </div>
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" className={ui.button} onClick={onClose}>
          Cancel
        </button>
        <button
          type="button"
          className={ui.buttonPrimary}
          disabled={create.isPending || name.trim().length < 2 || !sku.trim()}
          onClick={async () => {
            try {
              await create.mutateAsync({
                name: name.trim(),
                sku: sku.trim(),
                category: category.trim() || 'Plans',
                priceCents: Math.round((Number(price) || 0) * 100),
                currency: 'USD',
                currencies: ['USD'],
                active: true,
              })
              notify('Product created')
              onClose()
            } catch (error) {
              notify(error instanceof ApiError ? error.message : 'Create failed')
            }
          }}
        >
          {create.isPending ? <GlobalLoader variant="inline" label="Saving…" /> : 'Create product'}
        </button>
      </div>
    </Modal>
  )
}
