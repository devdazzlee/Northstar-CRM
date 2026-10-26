import { ui } from '@/lib/ui'

export { ui }

export function money(value: number) {
  return `$${Math.round(value / 1000)}k`
}
