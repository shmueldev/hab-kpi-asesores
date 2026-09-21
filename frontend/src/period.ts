export type Quarter = 1 | 2 | 3 | 4
export type PeriodMode = 'q' | 'year'

export type PeriodState = {
  year: number
  quarter: Quarter
  mode: PeriodMode
  asesorKey: number | ''
}

function pad(n: number) {
  return String(n).padStart(2, '0')
}

export function iso(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

export function currentYear() {
  return new Date().getFullYear()
}

export function currentQuarter(d = new Date()): Quarter {
  return (Math.floor(d.getMonth() / 3) + 1) as Quarter
}

export function yearOptions(from = 2023) {
  const y = currentYear()
  const years: number[] = []
  for (let i = y; i >= from; i -= 1) years.push(i)
  return years
}

export function quarterBounds(year: number, q: Quarter) {
  const startMonth = (q - 1) * 3
  const start = new Date(year, startMonth, 1)
  const end = new Date(year, startMonth + 3, 0)
  return { start, end }
}

export function isQuarterOpen(year: number, q: Quarter) {
  return quarterBounds(year, q).start <= new Date()
}

export function rangeForQuarter(year: number, q: Quarter) {
  const { start, end } = quarterBounds(year, q)
  const now = new Date()
  const fin = end > now ? now : end
  return { fechaIni: iso(start), fechaFin: iso(fin) }
}

export function rangeForYear(year: number) {
  const start = new Date(year, 0, 1)
  const end = new Date(year, 11, 31)
  const now = new Date()
  const fin = end > now ? now : end
  return { fechaIni: iso(start), fechaFin: iso(fin) }
}

export function lastOpenQuarter(year: number): Quarter {
  for (const q of [4, 3, 2, 1] as Quarter[]) {
    if (isQuarterOpen(year, q)) return q
  }
  return 1
}

export function defaultPeriod(): PeriodState {
  const year = currentYear()
  return { year, quarter: lastOpenQuarter(year), mode: 'q', asesorKey: '' }
}

export function rangeFromPeriod(p: PeriodState) {
  return p.mode === 'year' ? rangeForYear(p.year) : rangeForQuarter(p.year, p.quarter)
}

const KEY = 'kpi_period'

export function savePeriod(p: PeriodState) {
  localStorage.setItem(KEY, JSON.stringify(p))
}

export function loadPeriod(): PeriodState {
  try {
    const raw = localStorage.getItem(KEY) ?? sessionStorage.getItem(KEY)
    if (!raw) return defaultPeriod()
    const parsed = JSON.parse(raw) as PeriodState
    if (!parsed.year || !parsed.quarter) return defaultPeriod()
    return parsed
  } catch {
    return defaultPeriod()
  }
}

export function selectedAsesorKey(): number | null {
  try {
    const user = JSON.parse(localStorage.getItem('kpi_user') || '{}') as {
      role?: string
      asesor_key?: number | null
    }
    if (user.role === 'asesor') return user.asesor_key ?? null
  } catch {
    /* sesión rota: el API igual fuerza el JWT */
  }
  const period = loadPeriod()
  return period.asesorKey === '' ? null : period.asesorKey
}

export function periodLabel(p: PeriodState) {
  if (p.mode === 'year') {
    return p.year === currentYear() ? `Año ${p.year} (lo que va)` : `Año ${p.year}`
  }
  return `Q${p.quarter} ${p.year}`
}
