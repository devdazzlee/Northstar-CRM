import { z } from 'zod'

export const loginFormSchema = z.object({
  email: z.string().email('Enter a valid email'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  organizationSlug: z.string().optional(),
})

export type LoginFormValues = z.infer<typeof loginFormSchema>
