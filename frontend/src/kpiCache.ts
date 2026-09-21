import type { KpiDashboard } from './api/client'
import type { PeriodState } from './period'

export const LAST_KPI = 'kpi_snapshot'
const PREFIX = 'kpi_cache:'

const memory = new Map<string, KpiDashboard>()

export function kpiCacheKey(fechaIni: string, fechaFin: string, asesorKey?: number | null) {
  return `${fechaIni}|${fechaFin}|${asesorKey ?? 'all'}`
}

export function readKpiCache(key: string): KpiDashboard | null {
  const hit = memory.get(key)
  if (hit) return hit
  try {
    const raw = sessionStorage.getItem(PREFIX + key)
    if (!raw) return null
    const data = JSON.parse(raw) as KpiDashboard
    memory.set(key, data)
    return data
  } catch {
    return null
  }
}

export function writeKpiCache(key: string, data: KpiDashboard, period?: PeriodState) {
  memory.set(key, data)
  try {
    sessionStorage.setItem(PREFIX + key, JSON.stringify(data))
    sessionStorage.setItem(LAST_KPI, JSON.stringify({ data, period, key }))
  } catch {
    /* quota */
  }
}

export function readLastSnapshot(): { data: KpiDashboard; period?: PeriodState } | null {
  try {
    const raw = sessionStorage.getItem(LAST_KPI)
    if (!raw) return null
    return JSON.parse(raw) as { data: KpiDashboard; period?: PeriodState }
  } catch {
    return null
  }
}
