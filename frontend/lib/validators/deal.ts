import { z } from 'zod'

export const dealFormSchema = z.object({
  name: z.string().trim().min(2, 'Deal name is required'),
  company: z.string().trim().min(1, 'Company is required'),
  amount: z
    .string()
    .trim()
    .min(1, 'Value is required')
    .regex(/^\$?\d[\d,]*(\.\d{1,2})?$/, 'Enter a valid amount'),
  closeDate: z.string().trim().min(1, 'Close date is required'),
  stage: z.string().trim().min(1, 'Stage is required'),
})

export type DealFormValues = z.infer<typeof dealFormSchema>
