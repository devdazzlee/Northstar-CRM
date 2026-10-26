import { z } from 'zod'

export const contactFormSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters'),
  email: z.string().trim().email('Enter a valid email'),
  company: z.string().trim().min(1, 'Company is required').max(120, 'Company name is too long'),
})

export type ContactFormValues = z.infer<typeof contactFormSchema>

/** Extended contact form used inside the Contacts workspace modal. */
export const contactWorkspaceFormSchema = contactFormSchema.extend({
  phone: z.string().trim().optional(),
  title: z.string().trim().optional(),
  owner: z.string().trim().min(1, 'Owner is required'),
})

export type ContactWorkspaceFormValues = z.infer<typeof contactWorkspaceFormSchema>
