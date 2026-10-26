/** Initials from a display name, e.g. "Ahmed Raza" → "AR". */
export function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word[0] ?? '')
    .join('')
    .toUpperCase()
}
