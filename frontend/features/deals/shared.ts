export type Deal = {
  id: string
  name: string
  company: string
  amount: string
  stage: string
  probability: number
  owner: string
  color: string
  closeDate: string
  tags: string[]
  product: string
  team: string
  stale?: boolean
}

export type DealsWorkspaceProps = {
  notify: (message: string) => void
  onOpen: (id: string) => void
}

export const pipelines = {
  Sales: ['Qualification', 'Discovery', 'Proposal', 'Negotiation'],
  Renewals: ['At risk', 'Review', 'Negotiation', 'Renewed'],
  Partnerships: ['Identified', 'Discovery', 'Proposal', 'Contract'],
}

export const money = (value: string) => Number(value.replace(/[$,]/g, ''))
