import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { Users } from 'lucide-react'
import { EmptyState } from '@/components/ui/empty-state'

describe('EmptyState', () => {
  it('renders title and description', () => {
    render(<EmptyState icon={Users} title="No contacts" description="Add your first contact to get started." />)
    expect(screen.getByText('No contacts')).toBeInTheDocument()
    expect(screen.getByText('Add your first contact to get started.')).toBeInTheDocument()
  })

  it('fires action callback', async () => {
    const user = userEvent.setup()
    const onAction = vi.fn()
    render(
      <EmptyState
        icon={Users}
        title="No contacts"
        description="Add your first contact to get started."
        actionLabel="Add contact"
        onAction={onAction}
      />,
    )
    await user.click(screen.getByRole('button', { name: 'Add contact' }))
    expect(onAction).toHaveBeenCalledTimes(1)
  })
})
