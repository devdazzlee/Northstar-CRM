import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { InviteMemberDialog } from '@/components/workspace/team-view'

describe('InviteMemberDialog', () => {
  it('rejects invalid email', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<InviteMemberDialog onClose={vi.fn()} onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/name@company.com/i), 'not-valid')
    await user.click(screen.getByRole('button', { name: /send invitation/i }))

    expect(await screen.findByText(/valid work email/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits invite with selected role', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<InviteMemberDialog onClose={vi.fn()} onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/name@company.com/i), 'teammate@northstar.io')
    await user.selectOptions(screen.getByRole('combobox'), 'Manager')
    await user.click(screen.getByRole('button', { name: /send invitation/i }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          email: 'teammate@northstar.io',
          role: 'Manager',
        },
        expect.anything(),
      )
    })
  })
})
