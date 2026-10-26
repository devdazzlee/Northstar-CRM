import { z } from 'zod'

export const taskPriorities = ['Low', 'Medium', 'High'] as const

export const taskFormSchema = z.object({
  title: z.string().trim().min(2, 'Task title is required'),
  due: z.string().trim().min(1, 'Due date is required'),
  assignee: z.string().trim().min(1, 'Assignee is required'),
  record: z.string().trim().optional(),
  priority: z.enum(taskPriorities),
})

export type TaskFormValues = z.infer<typeof taskFormSchema>
