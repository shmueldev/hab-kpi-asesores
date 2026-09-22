export function rowMatches(values: unknown[], query: string) {
  const q = query.trim().toLowerCase()
  if (!q) return true
  return values.some((value) => String(value ?? '').toLowerCase().includes(q))
}

export function uniqueSorted(values: (string | null | undefined)[]) {
  return [...new Set(values.map((value) => (value || '').trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  )
}
