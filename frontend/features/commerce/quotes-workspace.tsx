'use client'

import { useState } from 'react'
import { ChevronDown, FileText, Send } from 'lucide-react'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { ui, type Notify } from '@/lib/ui'

export function QuotesWorkspace({ notify }: { notify: Notify }) {
  const [show, setShow] = useState(false)
  const quotes = [
    ['Q-1048', 'Acme Corporation', '$84,200', 'Sent', 'Oct 31, 2026'],
    ['Q-1047', 'Lattice Labs', '$32,500', 'Viewed', 'Nov 08, 2026'],
    ['Q-1046', 'Northwind Co.', '$12,800', 'Draft', 'Nov 12, 2026'],
    ['Q-1045', 'Vercel Partner', '$56,000', 'Signed', 'Oct 28, 2026'],
  ]
  return (
    <section className="p-5 lg:p-8">
      <PageHeader eyebrow="Revenue" title="Quotes" description="Build proposals from the catalog, collect signatures, and track approvals." action="Create quote" onAction={() => setShow(true)} />
      <div className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/20 dark:text-amber-200">
        Approval required for quotes over $50,000. Finance review is enabled.
      </div>
      <div className={`${ui.shell} overflow-hidden`}>
        <div className="flex gap-2 border-b border-slate-200 p-4 dark:border-slate-800">
          <input className={`${ui.input} flex-1`} placeholder="Search quotes" />
          {['All status', 'Price book', 'This quarter'].map((x) => (
            <button className={ui.button} key={x}>
              {x}
              <ChevronDown className="ml-2 inline size-3" />
            </button>
          ))}
        </div>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950">
            <tr>
              {['Quote', 'Customer', 'Total', 'Status tracker', 'Valid until', ''].map((x) => (
                <th className="px-5 py-3 font-medium" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {quotes.map((q) => (
              <tr className="border-t border-slate-100 dark:border-slate-800" key={q[0]}>
                <td className="px-5 py-4 font-semibold text-indigo-600">{q[0]}</td>
                <td className="px-5 py-4">{q[1]}</td>
                <td className="px-5 py-4 font-semibold">{q[2]}</td>
                <td className="px-5 py-4">
                  <span className="rounded-full bg-indigo-50 px-2 py-1 text-xs text-indigo-700">{q[3]}</span>
                </td>
                <td className="px-5 py-4 text-slate-500">{q[4]}</td>
                <td className="px-5 py-4">
                  <button onClick={() => notify('Quote preview opened')}>
                    <FileText className="size-4 text-slate-400" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {show && <QuoteBuilder onClose={() => setShow(false)} notify={notify} />}
    </section>
  )
}

function QuoteBuilder({ onClose, notify }: { onClose: () => void; notify: Notify }) {
  const [step, setStep] = useState(1)
  return (
    <Modal title="Build quote" onClose={onClose}>
      <div className="mb-6 flex items-center gap-2 text-xs">
        {['Line items', 'Terms & tax', 'Preview & send'].map((x, i) => (
          <div key={x} className={`flex items-center gap-2 ${step === i + 1 ? 'font-semibold text-indigo-600' : 'text-slate-400'}`}>
            <span className="grid size-6 place-items-center rounded-full bg-slate-100 dark:bg-slate-800">{i + 1}</span>
            {x}
          </div>
        ))}
      </div>
      {step === 1 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-semibold">Catalog line items</h3>
            <button className={ui.button}>Add line item</button>
          </div>
          {[
            ['Northstar Enterprise', '2', '$4,800'],
            ['Onboarding package', '1', '$4,500'],
          ].map((x) => (
            <div className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-sm dark:border-slate-700" key={x[0]}>
              <span>{x[0]}</span>
              <span className="text-slate-500">
                Qty {x[1]} · {x[2]}
              </span>
            </div>
          ))}
        </div>
      )}
      {step === 2 && (
        <div className="grid gap-4 sm:grid-cols-2">
          {['Discount %', 'Tax rate %', 'Payment terms', 'Valid for days'].map((x) => (
            <label className="text-xs font-medium" key={x}>
              {x}
              <input className={`${ui.input} mt-1.5 w-full`} placeholder={x} />
            </label>
          ))}
        </div>
      )}
      {step === 3 && (
        <div className="rounded-lg border border-slate-200 p-5 dark:border-slate-700">
          <p className="text-xs text-slate-500">PDF preview</p>
          <h3 className="mt-3 text-xl font-semibold">Quote Q-1049</h3>
          <div className="my-6 h-px bg-slate-200 dark:bg-slate-700" />
          <p className="text-2xl font-semibold">$9,300.00</p>
          <div className="mt-5 flex gap-2">
            <button
              className={ui.buttonPrimary}
              onClick={() => {
                notify('Quote sent for e-signature')
                onClose()
              }}
            >
              <Send className="mr-1 inline size-3.5" />
              Send for signature
            </button>
          </div>
        </div>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button className={ui.button} onClick={onClose}>
          Cancel
        </button>
        {step > 1 && (
          <button className={ui.button} onClick={() => setStep(step - 1)}>
            Back
          </button>
        )}
        {step < 3 && (
          <button className={ui.buttonPrimary} onClick={() => setStep(step + 1)}>
            Continue
          </button>
        )}
      </div>
    </Modal>
  )
}
