import { describe, expect, it, vi } from 'vitest'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ContactDialog, SearchDialog } from '@/components/workspace/shell-dialogs'
import { crmKeys } from '@/lib/api/crm'
import type { Lead } from '@/lib/types'

function renderWithQuery(ui: React.ReactElement, leads: Lead[] = []) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
  client.setQueryData(crmKeys.contacts(), [])
  client.setQueryData(crmKeys.companies(), [])
  client.setQueryData(crmKeys.leads(), leads)
  client.setQueryData(crmKeys.deals(), [])
  return render(<QueryClientProvider client={client}>{ui}</QueryClientProvider>)
}

describe('ContactDialog', () => {
  it('shows validation errors for empty required fields', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ContactDialog onClose={vi.fn()} onSubmit={onSubmit} />)

    await user.click(screen.getByRole('button', { name: 'Add contact' }))

    expect(await screen.findByText(/at least 2 characters/i)).toBeInTheDocument()
    expect(screen.getByText(/valid email/i)).toBeInTheDocument()
    expect(onSubmit).not.toHaveBeenCalled()
  })

  it('submits a valid contact payload', async () => {
    const user = userEvent.setup()
    const onSubmit = vi.fn()
    render(<ContactDialog onClose={vi.fn()} onSubmit={onSubmit} />)

    await user.type(screen.getByPlaceholderText(/jordan lee/i), 'Jordan Lee')
    await user.type(screen.getByPlaceholderText(/jordan@company.com/i), 'jordan@company.com')
    await user.type(screen.getByPlaceholderText(/company name/i), 'Northstar')
    await user.click(screen.getByRole('button', { name: 'Add contact' }))

    await waitFor(() => {
      expect(onSubmit).toHaveBeenCalledWith(
        {
          name: 'Jordan Lee',
          email: 'jordan@company.com',
          company: 'Northstar',
        },
        expect.anything(),
      )
    })
  })
})

describe('SearchDialog', () => {
  const lead: Lead = {
    id: 'le-1',
    name: 'Maya Patel',
    email: 'maya@vertex.ai',
    company: 'Vertex AI',
    source: 'Website',
    score: 92,
    status: 'Hot',
    owner: 'AR',
    phone: '+1 415 555 0142',
  }

  it('filters results as the user types', async () => {
    const user = userEvent.setup()
    const setQuery = vi.fn()
    const onSelect = vi.fn()

    const { rerender } = renderWithQuery(
      <SearchDialog query="" setQuery={setQuery} onClose={vi.fn()} onSelect={onSelect} />,
      [lead],
    )

    await user.type(screen.getByLabelText(/search contacts/i), 'Maya')
    expect(setQuery).toHaveBeenCalled()

    rerender(
      <QueryClientProvider
        client={(() => {
          const client = new QueryClient({ defaultOptions: { queries: { retry: false } } })
          client.setQueryData(crmKeys.contacts(), [])
          client.setQueryData(crmKeys.companies(), [])
          client.setQueryData(crmKeys.leads(), [lead])
          client.setQueryData(crmKeys.deals(), [])
          return client
        })()}
      >
        <SearchDialog query="Maya" setQuery={setQuery} onClose={vi.fn()} onSelect={onSelect} />
      </QueryClientProvider>,
    )

    expect(screen.getByText('Maya Patel')).toBeInTheDocument()
    await user.click(screen.getByText('Maya Patel'))
    expect(onSelect).toHaveBeenCalledWith('Leads')
  })

  it('shows empty state when nothing matches', () => {
    renderWithQuery(
      <SearchDialog query="zzzz-no-match" setQuery={vi.fn()} onClose={vi.fn()} onSelect={vi.fn()} />,
      [lead],
    )
    expect(screen.getByText(/no matching live records/i)).toBeInTheDocument()
  })
})
