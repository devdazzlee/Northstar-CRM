"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { ChevronLeft, ChevronRight, MoreHorizontal, Plus, Users } from "lucide-react"
import { useForm } from "react-hook-form"
import { EmptyState } from "@/components/ui/empty-state"
import { Modal } from "@/components/ui/modal"
import { PageHeader } from "@/components/ui/page-header"
import { QueryGate } from "@/components/ui/query-gate"
import { VirtualTable } from "@/components/ui/virtual-table"
import { useContactsQuery, useCreateContactMutation } from "@/hooks/use-crm-queries"
import { ApiError } from "@/lib/api/client"
import { ui, type Notify } from "@/lib/ui"
import {
  contactWorkspaceFormSchema,
  type ContactWorkspaceFormValues,
} from "@/lib/validators/contact"
import { Avatar, owners, Shell, Toolbar } from "./shared"

const segmentOptions = [
  "All contacts",
  "My contacts",
  "New this month",
  "Customers",
  "At risk",
]

export function ContactsWorkspace({
  notify,
  onOpen,
}: {
  notify: Notify
  onOpen: (id: string) => void
}) {
  const contactsQuery = useContactsQuery()
  const createContact = useCreateContactMutation()
  const contacts = contactsQuery.data ?? []
  const [query, setQuery] = useState("")
  const [owner, setOwner] = useState("All owners")
  const [showForm, setShowForm] = useState(false)
  const [savedView, setSavedView] = useState("All contacts")
  const [segment, setSegment] = useState("All contacts")

  const visible = useMemo(
    () =>
      contacts.filter((contact) => {
        const haystack =
          `${contact.name} ${contact.company} ${contact.email} ${contact.title ?? ""}`.toLowerCase()
        const matchesQuery = haystack.includes(query.toLowerCase())
        const matchesOwner = owner === "All owners" || contact.owner === owner
        const matchesSegment =
          segment === "All contacts" ||
          (segment === "Customers" && contact.stage.toLowerCase().includes("customer")) ||
          (segment === "My contacts" && contact.owner === "AR") ||
          segment === "New this month" ||
          segment === "At risk"
        return matchesQuery && matchesOwner && matchesSegment
      }),
    [contacts, query, owner, segment],
  )

  const submitContact = async (values: ContactWorkspaceFormValues) => {
    try {
      await createContact.mutateAsync({
        name: values.name,
        email: values.email,
        company: values.company,
        phone: values.phone,
        title: values.title,
        owner: values.owner,
      })
      setShowForm(false)
      notify(`${values.name} added to contacts`)
    } catch (error) {
      notify(error instanceof ApiError ? error.message : "Could not create contact")
    }
  }

  const segmentCount = (item: string) => {
    if (item === "All contacts") return contacts.length
    if (item === "Customers") {
      return contacts.filter((c) => c.stage.toLowerCase().includes("customer")).length
    }
    return contacts.length
  }

  return (
    <QueryGate
      isLoading={contactsQuery.isLoading}
      isError={contactsQuery.isError}
      error={contactsQuery.error}
      onRetry={() => void contactsQuery.refetch()}
      loadingLabel="Loading contacts…"
      errorTitle="Could not load contacts"
      errorIcon={Users}
    >
    <Shell>
      <PageHeader
        eyebrow="Manage"
        title="Contacts"
        description={`${contacts.length} contacts in your workspace`}
        action="Add contact"
        onAction={() => setShowForm(true)}
      />
      <div className="grid gap-4 xl:grid-cols-[190px_minmax(0,1fr)]">
        <aside className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-800 dark:bg-slate-900">
          <div className="mb-2 flex items-center justify-between px-2">
            <span className="text-xs font-semibold">Segments</span>
            <Plus className="size-3.5 text-slate-400" />
          </div>
          {segmentOptions.map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setSegment(item)}
              className={`flex w-full items-center justify-between rounded-lg px-2.5 py-2 text-left text-xs ${
                segment === item
                  ? "bg-indigo-50 font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "text-slate-500 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              {item}
              <span className="text-[10px] text-slate-400">{segmentCount(item)}</span>
            </button>
          ))}
        </aside>
        <div className="min-w-0 rounded-xl border border-slate-200 bg-white shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <Toolbar
            query={query}
            setQuery={setQuery}
            savedViews={[
              { name: "All contacts", count: contacts.length },
              { name: "Recently contacted", count: contacts.length },
              { name: "High intent", count: contacts.filter((c) => (c.tags ?? []).length > 0).length },
            ]}
            view={savedView}
            setView={setSavedView}
            notify={notify}
          />
          <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 dark:border-slate-800">
            <select
              value={owner}
              onChange={(event) => setOwner(event.target.value)}
              className="h-8 rounded-lg border border-slate-200 bg-transparent px-2 text-xs dark:border-slate-700"
            >
              {owners.map((item) => (
                <option key={item}>{item}</option>
              ))}
            </select>
            <span className="text-xs text-slate-400">{visible.length} matching contacts</span>
          </div>
          {visible.length === 0 ? (
            <div className="p-6">
              <EmptyState
                icon={Users}
                title="No contacts yet"
                description="Add your first contact to start building your CRM pipeline."
                actionLabel="Add contact"
                onAction={() => setShowForm(true)}
              />
            </div>
          ) : (
            <>
              <div className="min-w-[1040px]">
                <VirtualTable
                  rows={visible}
                  getRowId={(contact) => contact.id || contact.email}
                  onRowClick={(contact) => onOpen(contact.id || contact.email)}
                  maxHeight={520}
                  columns={[
                    {
                      key: "name",
                      header: "Name",
                      width: "220px",
                      cell: (contact) => (
                        <div className="flex items-center gap-2.5">
                          <Avatar name={contact.name} className={contact.color} />
                          <div>
                            <p className="font-medium">{contact.name}</p>
                            <p className="text-[11px] text-slate-400">{contact.email}</p>
                          </div>
                        </div>
                      ),
                    },
                    {
                      key: "company",
                      header: "Company",
                      width: "140px",
                      cell: (c) => <span className="text-xs">{c.company}</span>,
                    },
                    {
                      key: "title",
                      header: "Title",
                      width: "140px",
                      cell: (c) => <span className="text-xs text-slate-500">{c.title}</span>,
                    },
                    {
                      key: "email",
                      header: "Email",
                      width: "180px",
                      cell: (c) => <span className="text-xs text-slate-500">{c.email}</span>,
                    },
                    {
                      key: "phone",
                      header: "Phone",
                      width: "130px",
                      cell: (c) => <span className="text-xs text-slate-500">{c.phone}</span>,
                    },
                    {
                      key: "stage",
                      header: "Lifecycle",
                      width: "110px",
                      cell: (c) => (
                        <span className="rounded-full bg-indigo-50 px-2 py-1 text-[10px] font-semibold text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300">
                          {c.stage}
                        </span>
                      ),
                    },
                    {
                      key: "owner",
                      header: "Owner",
                      width: "70px",
                      cell: (c) => <span className="text-xs font-semibold">{c.owner}</span>,
                    },
                    {
                      key: "tags",
                      header: "Tags",
                      width: "140px",
                      cell: (c) => (
                        <div className="flex gap-1">
                          {c.tags?.map((tag) => (
                            <span
                              key={tag}
                              className="rounded bg-slate-100 px-1.5 py-1 text-[10px] text-slate-500 dark:bg-slate-800"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      ),
                    },
                    {
                      key: "last",
                      header: "Last contacted",
                      width: "120px",
                      cell: (c) => <span className="text-xs text-slate-500">{c.last}</span>,
                    },
                    {
                      key: "more",
                      header: "",
                      width: "40px",
                      cell: () => <MoreHorizontal className="size-4 text-slate-400" aria-hidden />,
                    },
                  ]}
                />
              </div>
              <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-xs text-slate-500 dark:border-slate-800">
                <span>Showing {visible.length} rows from API</span>
                <div className="flex items-center gap-2">
                  <select className="rounded border border-slate-200 bg-transparent px-2 py-1 text-xs dark:border-slate-700">
                    <option>100 / page</option>
                  </select>
                  <button type="button" className="rounded border border-slate-200 p-1 dark:border-slate-700">
                    <ChevronLeft className="size-3.5" />
                  </button>
                  <button type="button" className="rounded border border-slate-200 p-1 dark:border-slate-700">
                    <ChevronRight className="size-3.5" />
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      {showForm && (
        <AddContactWorkspaceForm
          onClose={() => setShowForm(false)}
          onSubmit={submitContact}
          busy={createContact.isPending}
        />
      )}
    </Shell>
    </QueryGate>
  )
}

function AddContactWorkspaceForm({
  onClose,
  onSubmit,
  busy,
}: {
  onClose: () => void
  onSubmit: (values: ContactWorkspaceFormValues) => void | Promise<void>
  busy?: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ContactWorkspaceFormValues>({
    resolver: zodResolver(contactWorkspaceFormSchema),
    defaultValues: { name: "", email: "", company: "", phone: "", title: "", owner: "AR" },
  })

  return (
    <Modal title="Add contact" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <label className="text-xs font-medium">
          Name
          <input
            {...register("name")}
            placeholder="Full name"
            className={`${ui.input} mt-1.5 h-10 w-full`}
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && <span className="mt-1 block text-[11px] text-rose-600">{errors.name.message}</span>}
        </label>
        <label className="text-xs font-medium">
          Email
          <input
            {...register("email")}
            placeholder="name@company.com"
            className={`${ui.input} mt-1.5 h-10 w-full`}
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && <span className="mt-1 block text-[11px] text-rose-600">{errors.email.message}</span>}
        </label>
        <label className="text-xs font-medium">
          Phone
          <input {...register("phone")} placeholder="+1 415..." className={`${ui.input} mt-1.5 h-10 w-full`} />
        </label>
        <label className="text-xs font-medium">
          Company
          <input
            {...register("company")}
            placeholder="Company name"
            className={`${ui.input} mt-1.5 h-10 w-full`}
            aria-invalid={Boolean(errors.company)}
          />
          {errors.company && (
            <span className="mt-1 block text-[11px] text-rose-600">{errors.company.message}</span>
          )}
        </label>
        <label className="text-xs font-medium">
          Title
          <input {...register("title")} placeholder="Role or title" className={`${ui.input} mt-1.5 h-10 w-full`} />
        </label>
        <label className="text-xs font-medium">
          Owner
          <input
            {...register("owner")}
            className={`${ui.input} mt-1.5 h-10 w-full`}
            aria-invalid={Boolean(errors.owner)}
          />
          {errors.owner && <span className="mt-1 block text-[11px] text-rose-600">{errors.owner.message}</span>}
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onClose} className={ui.button} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={ui.buttonPrimary} disabled={busy}>
            {busy ? "Saving…" : "Save contact"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
