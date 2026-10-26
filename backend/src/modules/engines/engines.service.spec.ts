describe('EnginesService scoring match helpers', () => {
  const match = (fieldValue: string, operator: string, expected: string) => {
    switch (operator) {
      case 'eq':
      case 'equals':
        return fieldValue.toLowerCase() === expected.toLowerCase()
      case 'contains':
        return fieldValue.toLowerCase().includes(expected.toLowerCase())
      case 'startsWith':
        return fieldValue.toLowerCase().startsWith(expected.toLowerCase())
      case 'gt':
        return Number(fieldValue) > Number(expected)
      case 'lt':
        return Number(fieldValue) < Number(expected)
      default:
        return fieldValue.toLowerCase() === expected.toLowerCase()
    }
  }

  it('matches equals/contains/gt', () => {
    expect(match('Web', 'equals', 'web')).toBe(true)
    expect(match('Inbound Web', 'contains', 'web')).toBe(true)
    expect(match('80', 'gt', '50')).toBe(true)
    expect(match('10', 'lt', '50')).toBe(true)
  })
})
