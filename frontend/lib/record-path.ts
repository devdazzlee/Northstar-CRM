/** Browser path helper for full-record deep links. */
export function recordPath(type: 'contact' | 'company' | 'lead' | 'deal', id: string): string {
  const segment =
    type === 'lead' ? 'leads' : type === 'contact' ? 'contacts' : type === 'company' ? 'companies' : 'deals'
  return `/${segment}/${id}`
}
