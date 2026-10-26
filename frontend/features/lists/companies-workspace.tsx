"use client"

import { useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { Building2, MoreHorizontal } from "lucide-react"
import { useForm } from "react-hook-form"
import { EmptyState } from "@/components/ui/empty-state"
import { Modal } from "@/components/ui/modal"
import { PageHeader } from "@/components/ui/page-header"
import { QueryGate } from "@/components/ui/query-gate"
import { useCompaniesQuery, useCreateCompanyMutation } from "@/hooks/use-crm-queries"
import { ApiError } from "@/lib/api/client"
import { ui, type Notify } from "@/lib/ui"
import { companyFormSchema, type CompanyFormValues } from "@/lib/validators/company"
import { Avatar, Shell, Toolbar } from "./shared"

const tableHeaders = [
  "Company",
  "Industry",
  "Size",
  "Revenue",
  "Location",
  "Owner",
  "Open deals",
  "Health score",
  "",
]

function healthDotClass(health?: number) {
  if (health && health > 80) return "bg-emerald-500"
  if (health && health > 65) return "bg-amber-500"
  return "bg-rose-500"
}

export function CompaniesWorkspace({
  notify,
  onOpen,
}: {
  notify: Notify
  onOpen: (id: string) => void
}) {
  const companiesQuery = useCompaniesQuery()
  const createCompany = useCreateCompanyMutation()
  const companies = companiesQuery.data ?? []
  const [query, setQuery] = useState("")
  const [showForm, setShowForm] = useState(false)
  const [hierarchy, setHierarchy] = useState(false)

  const visible = companies.filter((company) =>
    `${company.name} ${company.industry} ${company.location}`
      .toLowerCase()
      .includes(query.toLowerCase()),
  )

  const submitCompany = async (values: CompanyFormValues) => {
    try {
      await createCompany.mutateAsync(values)
      setShowForm(false)
      notify(`${values.name} added to companies`)
    } catch (error) {
      notify(error instanceof ApiError ? error.message : "Could not create company")
    }
  }

  return (
    <QueryGate
      isLoading={companiesQuery.isLoading}
      isError={companiesQuery.isError}
      error={companiesQuery.error}
      onRetry={() => void companiesQuery.refetch()}
      loadingLabel="Loading companies…"
      errorTitle="Could not load companies"
      errorIcon={Building2}
    >
    <Shell>
      <PageHeader
        eyebrow="Manage"
        title="Companies"
        description={`${companies.length} accounts in your workspace`}
        action="Add company"
        onAction={() => setShowForm(true)}
      />
      <div className="mb-4 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setHierarchy(false)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
            !hierarchy
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "border border-slate-200 dark:border-slate-700"
          }`}
        >
          Accounts
        </button>
        <button
          type="button"
          onClick={() => setHierarchy(true)}
          className={`rounded-lg px-3 py-2 text-xs font-semibold ${
            hierarchy
              ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
              : "border border-slate-200 dark:border-slate-700"
          }`}
        >
          Account hierarchy
        </button>
      </div>
      {hierarchy ? (
        <div className="rounded-xl border border-slate-200 bg-white p-6 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-5 flex items-center gap-2">
            <Building2 className="size-5 text-indigo-500" />
            <div>
              <p className="font-semibold">Workspace accounts</p>
              <p className="text-xs text-slate-400">{companies.length} companies</p>
            </div>
          </div>
          <div className="ml-7 border-l border-dashed border-slate-300 pl-6 dark:border-slate-700">
            {companies.map((company) => (
              <button
                key={company.id}
                type="button"
                onClick={() => onOpen(company.id)}
                className="mb-3 flex w-full items-center gap-3 rounded-lg border border-slate-200 p-3 text-left hover:border-indigo-300 dark:border-slate-700"
              >
                <Avatar name={company.name} className={(company as { color?: string }).color} />
                <span className="text-sm font-medium">{company.name}</span>
                <span className="ml-auto text-xs text-slate-400">{company.deals} open deals</span>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Toolbar
            query={query}
            setQuery={setQuery}
            savedViews={[
              { name: "All companies", count: companies.length },
              { name: "At risk", count: 0 },
            ]}
            view="All companies"
            setView={() => {}}
            notify={notify}
          />
          {visible.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Building2}
                title="No companies yet"
                description="Create a company account to link contacts and deals."
                actionLabel="Add company"
                onAction={() => setShowForm(true)}
              />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="bg-slate-50 text-[10px] uppercase tracking-wider text-slate-400 dark:bg-slate-800/50">
                  <tr>
                    {tableHeaders.map((head) => (
                      <th key={head} className="px-4 py-3 font-medium">
                        {head}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((company) => {
                    const health = (company as { health?: number }).health
                    const color = (company as { color?: string }).color
                    return (
                      <tr
                        key={company.id}
                        onClick={() => onOpen(company.id)}
                        className="cursor-pointer border-t border-slate-100 hover:bg-slate-50/70 dark:border-slate-800"
                      >
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2.5">
                            <Avatar name={company.name} className={color} />
                            <span className="font-medium">{company.name}</span>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-xs text-slate-500">{company.industry}</td>
                        <td className="px-4 py-3 text-xs">{company.size}</td>
                        <td className="px-4 py-3 text-xs">{company.revenue}</td>
                        <td className="px-4 py-3 text-xs text-slate-500">{company.location}</td>
                        <td className="px-4 py-3 text-xs font-semibold">{company.owner}</td>
                        <td className="px-4 py-3 text-xs">{company.deals}</td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className={`h-2 w-2 rounded-full ${healthDotClass(health)}`} />
                            <span className="text-xs font-semibold">{health ?? "—"}/100</span>
                          </div>
                        </td>
                        <td className="px-4">
                          <MoreHorizontal className="size-4 text-slate-400" />
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
      {showForm && (
        <AddCompanyForm
          onClose={() => setShowForm(false)}
          onSubmit={submitCompany}
          busy={createCompany.isPending}
        />
      )}
    </Shell>
    </QueryGate>
  )
}

function AddCompanyForm({
  onClose,
  onSubmit,
  busy,
}: {
  onClose: () => void
  onSubmit: (values: CompanyFormValues) => void | Promise<void>
  busy?: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<CompanyFormValues>({
    resolver: zodResolver(companyFormSchema),
    defaultValues: {
      name: "",
      industry: "",
      size: "",
      revenue: "",
      location: "",
      owner: "AR",
    },
  })

  return (
    <Modal title="Add company" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        {(
          [
            ["name", "Company name", "Northstar Labs"],
            ["industry", "Industry", "SaaS"],
            ["size", "Size", "51-200"],
            ["revenue", "Revenue", "$10M"],
            ["location", "Location", "San Francisco, CA"],
            ["owner", "Owner", "AR"],
          ] as const
        ).map(([key, label, placeholder]) => (
          <label key={key} className="text-xs font-medium">
            {label}
            <input
              {...register(key)}
              placeholder={placeholder}
              className={`${ui.input} mt-1.5 h-10 w-full`}
              aria-invalid={Boolean(errors[key])}
            />
            {errors[key] && (
              <span className="mt-1 block text-[11px] text-rose-600">{errors[key]?.message}</span>
            )}
          </label>
        ))}
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onClose} className={ui.button} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={ui.buttonPrimary} disabled={busy}>
            {busy ? "Saving…" : "Save company"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
