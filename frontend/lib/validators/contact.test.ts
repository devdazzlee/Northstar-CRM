import { describe, expect, it } from 'vitest'
import { contactFormSchema } from '@/lib/validators/contact'

describe('contactFormSchema', () => {
  it('accepts a valid contact', () => {
    const result = contactFormSchema.safeParse({
      name: 'Jordan Lee',
      email: 'jordan@company.com',
      company: 'Northstar',
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid email', () => {
    const result = contactFormSchema.safeParse({
      name: 'Jordan Lee',
      email: 'not-an-email',
      company: 'Northstar',
    })
    expect(result.success).toBe(false)
  })

  it('rejects short names', () => {
    const result = contactFormSchema.safeParse({
      name: 'J',
      email: 'j@company.com',
      company: 'Northstar',
    })
    expect(result.success).toBe(false)
  })
})
