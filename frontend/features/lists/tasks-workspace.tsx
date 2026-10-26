"use client"

import { useMemo, useState } from "react"
import { zodResolver } from "@hookform/resolvers/zod"
import { CheckSquare, SlidersHorizontal } from "lucide-react"
import { useForm } from "react-hook-form"
import { EmptyState } from "@/components/ui/empty-state"
import { Modal } from "@/components/ui/modal"
import { PageHeader } from "@/components/ui/page-header"
import { QueryGate } from "@/components/ui/query-gate"
import { useCreateTaskMutation, useTasksQuery, useUpdateTaskStatusMutation } from "@/hooks/use-crm-queries"
import { ApiError } from "@/lib/api/client"
import type { UiTask } from "@/lib/api/mappers"
import { ui, type Notify } from "@/lib/ui"
import { taskFormSchema, taskPriorities, type TaskFormValues } from "@/lib/validators/task"
import { Avatar, Shell } from "./shared"

function TaskCard({
  task,
  onComplete,
  busy,
}: {
  task: UiTask
  onComplete: (task: UiTask) => void
  busy?: boolean
}) {
  const meta = [
    task.record,
    task.due,
    task.recurring ? task.recurring : null,
    task.subtasks ? `${task.subtasks} subtasks` : null,
  ]
    .filter(Boolean)
    .join(" · ")

  const priorityClass =
    task.priority === "High"
      ? "bg-rose-50 text-rose-600"
      : task.priority === "Medium"
        ? "bg-amber-50 text-amber-600"
        : "bg-slate-100 text-slate-500"
  const done = String(task.status).toLowerCase() === "done"

  return (
    <div className="flex items-center gap-3 border-t border-slate-100 px-4 py-3 first:border-t-0 dark:border-slate-800">
      <button
        type="button"
        disabled={busy || done}
        onClick={() => onComplete(task)}
        className={`size-4 rounded border ${done ? "border-emerald-500 bg-emerald-500" : "border-slate-300 dark:border-slate-600"} disabled:opacity-60`}
        aria-label={done ? `${task.title} completed` : `Complete ${task.title}`}
      />
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${done ? "text-slate-400 line-through" : ""}`}>{task.title}</p>
        <p className="mt-1 text-[11px] text-slate-400">{meta}</p>
      </div>
      <span className={`rounded-full px-2 py-1 text-[10px] font-semibold ${priorityClass}`}>{task.priority}</span>
      <Avatar name={task.assignee} />
    </div>
  )
}

export function TasksWorkspace({ notify }: { notify: Notify }) {
  const tasksQuery = useTasksQuery()
  const createTask = useCreateTaskMutation()
  const updateStatus = useUpdateTaskStatusMutation()
  const tasks = tasksQuery.data ?? []
  const [mode, setMode] = useState("List")
  const [scope, setScope] = useState("My tasks")
  const [showForm, setShowForm] = useState(false)

  const boardColumns = ["To do", "In progress", "Done"]

  const scoped = useMemo(() => {
    if (scope === "My tasks") return tasks.filter((t) => t.assignee === "AR" || t.assignee === "—")
    return tasks
  }, [tasks, scope])

  const completeTask = (task: UiTask) => {
    void updateStatus.mutateAsync({ id: task.id, status: "Done" }).then(
      () => notify(`${task.title} marked complete`),
      (error: unknown) => notify(error instanceof ApiError ? error.message : "Could not complete task"),
    )
  }

  return (
    <QueryGate
      isLoading={tasksQuery.isLoading}
      isError={tasksQuery.isError}
      error={tasksQuery.error}
      onRetry={() => void tasksQuery.refetch()}
      loadingLabel="Loading tasks…"
      errorTitle="Could not load tasks"
      errorIcon={CheckSquare}
    >
    <Shell>
      <PageHeader
        eyebrow="Manage"
        title="Tasks"
        description={`${tasks.length} tasks from your workspace`}
        action="Add task"
        onAction={() => setShowForm(true)}
      />
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
          {["List", "Board"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setMode(item)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                mode === item
                  ? "bg-slate-900 text-white dark:bg-white dark:text-slate-900"
                  : "text-slate-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <div className="flex rounded-lg border border-slate-200 p-1 dark:border-slate-700">
          {["My tasks", "Team"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => setScope(item)}
              className={`rounded-md px-3 py-1.5 text-xs font-semibold ${
                scope === item
                  ? "bg-indigo-50 text-indigo-700 dark:bg-indigo-950/50 dark:text-indigo-300"
                  : "text-slate-500"
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => notify("Task filters opened")}
          className="flex items-center gap-2 rounded-lg border border-slate-200 px-3 py-2 text-xs font-semibold dark:border-slate-700"
        >
          <SlidersHorizontal className="size-3.5" />
          Filters
        </button>
      </div>
      {scoped.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks yet"
          description="Create a task to track follow-ups and next actions."
          actionLabel="Add task"
          onAction={() => setShowForm(true)}
        />
      ) : mode === "Board" ? (
        <div className="grid gap-4 lg:grid-cols-3">
          {boardColumns.map((status) => (
            <div key={status} className="rounded-xl bg-slate-100/70 p-3 dark:bg-slate-900">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xs font-semibold">{status}</h3>
                <span className="rounded-full bg-white px-2 py-1 text-[10px] text-slate-500 dark:bg-slate-800">
                  {scoped.filter((task) => task.status === status).length}
                </span>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-950">
                {scoped
                  .filter((task) => task.status === status)
                  .map((task) => (
                    <TaskCard
                      key={task.id}
                      task={task}
                      onComplete={completeTask}
                      busy={updateStatus.isPending}
                    />
                  ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
          {scoped.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onComplete={completeTask}
              busy={updateStatus.isPending}
            />
          ))}
        </div>
      )}
      {showForm && (
        <CreateTaskForm
          onClose={() => setShowForm(false)}
          busy={createTask.isPending}
          onSubmit={async (values) => {
            try {
              await createTask.mutateAsync(values)
              setShowForm(false)
              notify(`Task created · ${values.title}`)
            } catch (error) {
              notify(error instanceof ApiError ? error.message : "Could not create task")
            }
          }}
        />
      )}
    </Shell>
    </QueryGate>
  )
}

function CreateTaskForm({
  onClose,
  onSubmit,
  busy,
}: {
  onClose: () => void
  onSubmit: (values: TaskFormValues) => void | Promise<void>
  busy?: boolean
}) {
  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TaskFormValues>({
    resolver: zodResolver(taskFormSchema),
    defaultValues: {
      title: "",
      due: new Date().toISOString().slice(0, 10),
      assignee: "AR",
      record: "",
      priority: "Medium",
    },
  })

  return (
    <Modal title="Create task" onClose={onClose}>
      <form onSubmit={handleSubmit(onSubmit)} className="grid gap-4 sm:grid-cols-2" noValidate>
        <label className="text-xs font-medium">
          Task title
          <input
            {...register("title")}
            placeholder="Follow up with account"
            className={`${ui.input} mt-1.5 h-10 w-full`}
            aria-invalid={Boolean(errors.title)}
          />
          {errors.title && <span className="mt-1 block text-[11px] text-rose-600">{errors.title.message}</span>}
        </label>
        <label className="text-xs font-medium">
          Due date
          <input
            type="date"
            {...register("due")}
            className={`${ui.input} mt-1.5 h-10 w-full`}
            aria-invalid={Boolean(errors.due)}
          />
          {errors.due && <span className="mt-1 block text-[11px] text-rose-600">{errors.due.message}</span>}
        </label>
        <label className="text-xs font-medium">
          Assignee
          <input
            {...register("assignee")}
            className={`${ui.input} mt-1.5 h-10 w-full`}
            aria-invalid={Boolean(errors.assignee)}
          />
          {errors.assignee && (
            <span className="mt-1 block text-[11px] text-rose-600">{errors.assignee.message}</span>
          )}
        </label>
        <label className="text-xs font-medium">
          Related record
          <input
            {...register("record")}
            placeholder="Company, contact or deal"
            className={`${ui.input} mt-1.5 h-10 w-full`}
          />
        </label>
        <label className="text-xs font-medium sm:col-span-2">
          Priority
          <select {...register("priority")} className={`${ui.input} mt-1.5 h-10 w-full`}>
            {taskPriorities.map((priority) => (
              <option key={priority} value={priority}>
                {priority}
              </option>
            ))}
          </select>
        </label>
        <div className="flex justify-end gap-2 sm:col-span-2">
          <button type="button" onClick={onClose} className={ui.button} disabled={busy}>
            Cancel
          </button>
          <button type="submit" className={ui.buttonPrimary} disabled={busy}>
            {busy ? "Creating…" : "Create task"}
          </button>
        </div>
      </form>
    </Modal>
  )
}
