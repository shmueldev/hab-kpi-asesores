function escapeCell(value: string | number | null | undefined) {
  const text = value == null ? '' : String(value)
  if (/[;"\n\r]/.test(text)) return `"${text.replace(/"/g, '""')}"`
  return text
}

export function toCsv(headers: string[], rows: (string | number | null | undefined)[][]) {
  const lines = [headers.map(escapeCell).join(';'), ...rows.map((row) => row.map(escapeCell).join(';'))]
  return `\uFEFF${lines.join('\r\n')}`
}

export function downloadCsv(filename: string, headers: string[], rows: (string | number | null | undefined)[][]) {
  const blob = new Blob([toCsv(headers, rows)], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  const stamp = new Date().toISOString().slice(0, 10)
  link.href = url
  link.download = `${filename}-${stamp}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export function tableToRows(table: HTMLTableElement) {
  const headers = [...table.querySelectorAll('thead th')].map((cell) => cell.textContent?.trim() || '')
  const rows = [...table.querySelectorAll('tbody tr')].map((tr) =>
    [...tr.querySelectorAll('td')].map((cell) => cell.textContent?.replace(/\s+/g, ' ').trim() || ''),
  )
  return { headers, rows }
}

export function slugName(name: string) {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '') || 'tabla'
}
