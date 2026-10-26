'use client'

import { useState } from 'react'
import { Modal } from '@/components/ui/modal'
import { PageHeader } from '@/components/ui/page-header'
import { ui, type Notify } from '@/lib/ui'

export function InvoicesWorkspace({ notify }: { notify: Notify }) {
  const [payment, setPayment] = useState(false)
  const invoices = [
    ['INV-2048', 'Acme Corporation', '$84,200', 'Paid', 'Oct 22, 2026'],
    ['INV-2047', 'Lattice Labs', '$32,500', 'Partial', 'Oct 18, 2026'],
    ['INV-2046', 'Northwind Co.', '$12,800', 'Overdue', 'Sep 30, 2026'],
  ]
  return (
    <section className="p-5 lg:p-8">
      <PageHeader eyebrow="Revenue" title="Invoices" description="Track payments, send reminders, and share secure payment links." action="Create invoice" onAction={() => notify('Create from quote opened')} />
      <div className="grid gap-4 sm:grid-cols-3">
        {[
          ['Outstanding', '$45,300'],
          ['Paid this month', '$128,400'],
          ['Overdue', '$12,800'],
        ].map((x) => (
          <div className={`${ui.shell} p-5`} key={x[0]}>
            <p className="text-xs text-slate-500">{x[0]}</p>
            <p className="mt-2 text-2xl font-semibold">{x[1]}</p>
          </div>
        ))}
      </div>
      <div className={`${ui.shell} mt-5 overflow-hidden`}>
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs text-slate-500 dark:bg-slate-950">
            <tr>
              {['Invoice', 'Customer', 'Amount', 'Payment status', 'Due date', 'Actions'].map((x) => (
                <th className="px-5 py-3 font-medium" key={x}>
                  {x}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {invoices.map((x) => (
              <tr className="border-t border-slate-100 dark:border-slate-800" key={x[0]}>
                <td className="px-5 py-4 font-semibold text-indigo-600">{x[0]}</td>
                <td className="px-5 py-4">{x[1]}</td>
                <td className="px-5 py-4">{x[2]}</td>
                <td className="px-5 py-4">
                  <span
                    className={`rounded-full px-2 py-1 text-xs ${x[3] === 'Paid' ? 'bg-emerald-50 text-emerald-700' : x[3] === 'Overdue' ? 'bg-rose-50 text-rose-700' : 'bg-amber-50 text-amber-700'}`}
                  >
                    {x[3]}
                  </span>
                </td>
                <td className="px-5 py-4 text-slate-500">{x[4]}</td>
                <td className="px-5 py-4">
                  <button className={ui.button} onClick={() => setPayment(true)}>
                    Record payment
                  </button>
                  <button className="ml-2 text-xs text-indigo-600" onClick={() => notify('Payment link copied')}>
                    Copy link
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {payment && (
        <Modal title="Record payment" onClose={() => setPayment(false)}>
          <div className="grid gap-4 sm:grid-cols-2">
            {['Amount', 'Payment date', 'Method', 'Reference'].map((x) => (
              <label className="text-xs font-medium" key={x}>
                {x}
                <input className={`${ui.input} mt-1.5 w-full`} placeholder={x} />
              </label>
            ))}
          </div>
          <div className="mt-6 flex justify-end">
            <button
              className={ui.buttonPrimary}
              onClick={() => {
                notify('Payment recorded')
                setPayment(false)
              }}
            >
              Save payment
            </button>
          </div>
        </Modal>
      )}
    </section>
  )
}
