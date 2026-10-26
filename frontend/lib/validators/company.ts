import { z } from 'zod'

export const companyFormSchema = z.object({
  name: z.string().trim().min(2, 'Company name is required'),
  industry: z.string().trim().min(1, 'Industry is required'),
  size: z.string().trim().min(1, 'Size is required'),
  revenue: z.string().trim().optional(),
  location: z.string().trim().optional(),
  owner: z.string().trim().min(1, 'Owner is required'),
})

export type CompanyFormValues = z.infer<typeof companyFormSchema>
