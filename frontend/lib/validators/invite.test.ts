import { describe, expect, it } from 'vitest'
import { inviteFormSchema } from '@/lib/validators/invite'

describe('inviteFormSchema', () => {
  it('accepts a valid invite', () => {
    const result = inviteFormSchema.safeParse({
      email: 'teammate@northstar.io',
      role: 'Admin',
    })
    expect(result.success).toBe(true)
  })

  it('rejects unknown roles', () => {
    const result = inviteFormSchema.safeParse({
      email: 'teammate@northstar.io',
      role: 'Owner',
    })
    expect(result.success).toBe(false)
  })
})
