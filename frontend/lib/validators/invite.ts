import { z } from 'zod'

export const inviteRoles = ['Member', 'Manager', 'Admin'] as const

export const inviteFormSchema = z.object({
  email: z.string().trim().email('Enter a valid work email'),
  role: z.enum(inviteRoles),
})

export type InviteFormValues = z.infer<typeof inviteFormSchema>
