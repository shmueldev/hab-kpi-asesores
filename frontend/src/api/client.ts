import { selectedAsesorKey } from '../period'

const API_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000'

export type DataFuente = 'sql' | 'redis' | 'demo'

export type KpiDashboard = {
  total_meta: number
  venta_int: number
  pct_cumpl_presupuesto: number
  total_ventas: number
  ventas_aa: number
  pct_crecimiento_dinero: number
  venta_autogestion: number
  pct_autogestion: number
  fuente: DataFuente
  vacio: boolean
  asesor_key: number | null
  asesor_nombre: string | null
  guardado_en: string | null
  periodo_guardado_ini: string | null
  periodo_guardado_fin: string | null
}

export type Asesor = {
  asesor_key: number
  nombre: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
  role: string
  asesor_key: number | null
  username: string
  nombre: string | null
  must_change_password: boolean
}

function authHeaders(): HeadersInit {
  const token = localStorage.getItem('kpi_token')
  if (!token) throw new Error('Sin sesión')
  return { Authorization: `Bearer ${token}` }
}

function clearSession() {
  localStorage.removeItem('kpi_token')
  localStorage.removeItem('kpi_user')
}

async function readError(res: Response, fallback: string): Promise<string> {
  const err = await res.json().catch(() => ({}))
  const detail = err.detail
  if (typeof detail === 'string') return detail
  return fallback
}

export async function login(username: string, password: string): Promise<LoginResponse> {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
  })
  if (!res.ok) throw new Error(await readError(res, 'Error de autenticación'))
  return res.json()
}

export async function fetchKpis(
  fechaIni: string,
  fechaFin: string,
  asesorKey?: number | null,
): Promise<KpiDashboard> {
  const params = new URLSearchParams({ fecha_ini: fechaIni, fecha_fin: fechaFin })
  if (asesorKey != null) params.set('asesor_key', String(asesorKey))
  const res = await fetch(`${API_URL}/kpis?${params}`, { headers: authHeaders() })
  if (res.status === 401) {
    clearSession()
    throw new Error('Sesión expirada')
  }
  if (!res.ok) throw new Error(await readError(res, 'Error al cargar KPIs'))
  return res.json()
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const res = await fetch(`${API_URL}/auth/change-password`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
  })
  if (res.status === 401) {
    clearSession()
    throw new Error('Sesión expirada')
  }
  if (!res.ok) throw new Error(await readError(res, 'No se pudo cambiar la contraseña'))
}

export async function recoverPassword(
  username: string,
  asesorKey: number,
  newPassword: string,
): Promise<void> {
  const res = await fetch(`${API_URL}/auth/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, asesor_key: asesorKey, new_password: newPassword }),
  })
  if (!res.ok) throw new Error(await readError(res, 'No se pudo recuperar la contraseña'))
}

export type ChatSource = 'local' | 'openai'

export type ChatReply = {
  reply: string
  source: ChatSource
}

export async function askChat(
  message: string,
  snapshot: KpiDashboard | null,
  periodLabel?: string,
): Promise<ChatReply> {
  const res = await fetch(`${API_URL}/chat`, {
    method: 'POST',
    headers: { ...authHeaders(), 'Content-Type': 'application/json' },
    body: JSON.stringify({
      message,
      period_label: periodLabel ?? null,
      snapshot,
    }),
  })
  if (res.status === 401) {
    clearSession()
    throw new Error('Sesión expirada')
  }
  if (!res.ok) throw new Error(await readError(res, 'No se pudo consultar el chat'))
  return res.json()
}

export type KpiMonthRow = {
  anio: number
  mes: number
  mes_texto: string
  venta_actual: number
  venta_int: number
  total_meta: number
  ventas_aa: number
  venta_autogestion: number
  pct_cumplimiento: number
  pct_crecimiento: number
  pct_autogestion: number
  acumulado_vs_aa: number
  proyeccion_cierre: number
  es_total: boolean
}

export type KpiMonthlyBreakdown = {
  filas: KpiMonthRow[]
  total: KpiMonthRow | null
  fuente: DataFuente
}

export async function fetchKpiMeses(
  fechaIni: string,
  fechaFin: string,
  asesorKey?: number | null,
): Promise<KpiMonthlyBreakdown> {
  const params = new URLSearchParams({ fecha_ini: fechaIni, fecha_fin: fechaFin })
  if (asesorKey != null) params.set('asesor_key', String(asesorKey))
  const res = await fetch(`${API_URL}/kpis/meses?${params}`, { headers: authHeaders() })
  if (res.status === 401) {
    clearSession()
    throw new Error('Sesión expirada')
  }
  if (!res.ok) throw new Error(await readError(res, 'Error al cargar el desglose mensual'))
  return res.json()
}

export type CarteraBucket = { monto: number; n: number }

export type CarteraAbierta = {
  as_of: string
  abierta: number
  n_abiertas: number
  al_dia: CarteraBucket
  gracia: CarteraBucket
  vencida: CarteraBucket
  sin_vcto: CarteraBucket
  fuente: DataFuente
  asesor_key?: number | null
  vendedor_rowid?: number | null
  vendedor_nombre?: string | null
}

export type CarteraAgingRow = {
  nit: string | null
  razon_social: string | null
  id_sucursal: string | null
  descripcion_sucursal: string | null
  vendedor_codigo_nombre: string | null
  tipo_docto_cruce: string | null
  consec_docto_cruce: number | null
  nro_cuota_cruce: number | null
  fecha_vcto: string | null
  cubeta: string | null
  valor: number
  dias_a_vcto: number | null
}

export type CarteraSerie = { nombre: string; monto: number; n: number }

export type CarteraAging = {
  as_of: string
  resumen: CarteraAbierta
  por_vendedor: CarteraSerie[]
  top_clientes: CarteraSerie[]
  detalle: CarteraAgingRow[]
  fuente: DataFuente
}

export type CarteraCanceladaRow = {
  nit: string | null
  razon_social: string | null
  id_sucursal: string | null
  descripcion_sucursal: string | null
  tipo_docto_cruce: string | null
  consec_docto_cruce: number | null
  nro_cuota_cruce: number | null
  fecha_docto: string | null
  fecha_cancelacion: string | null
  valor: number
}

export type CarteraCanceladas = {
  anio: number
  trimestre: number | null
  q1: number | null
  q2: number | null
  q3: number | null
  q4: number | null
  total: number
  detalle: CarteraCanceladaRow[]
  fuente: DataFuente
}

export type CarteraSiesaRow = {
  nit: string | null
  razon_social: string | null
  numero: string | null
  tipo_docto_cruce: string | null
  codigo_vendedor: string | null
  fecha_docto: string | null
  fecha_vcto: string | null
  plazo: number | null
  dias_vencidos: number | null
  total: number
}

export type CarteraSiesaSaldo = {
  saldo_cartera: number
  n_docs: number
  detalle: CarteraSiesaRow[]
  fuente: DataFuente
}

type CarteraQuery = {
  as_of?: string
  nit?: string
  asesor_key?: number | null
}

function carteraParams(extra: Record<string, string | number | undefined | null> = {}) {
  const params = new URLSearchParams()
  Object.entries(extra).forEach(([key, value]) => {
    if (value != null && value !== '') params.set(key, String(value))
  })
  return params
}

async function carteraGet<T>(path: string, extra: Record<string, string | number | undefined | null> = {}): Promise<T> {
  const params = carteraParams({ asesor_key: selectedAsesorKey(), ...extra })
  const qs = params.toString()
  const res = await fetch(`${API_URL}${path}${qs ? `?${qs}` : ''}`, { headers: authHeaders() })
  if (res.status === 401) {
    clearSession()
    throw new Error('Sesión expirada')
  }
  if (!res.ok) throw new Error(await readError(res, 'Error al cargar cartera'))
  return res.json()
}

export function fetchCarteraAbierta(q: CarteraQuery = {}) {
  return carteraGet<CarteraAbierta>('/cartera/unoee/abierta', q)
}

export function fetchCarteraAging(q: CarteraQuery = {}) {
  return carteraGet<CarteraAging>('/cartera/unoee/aging', q)
}

export function fetchCarteraCanceladas(anio: number, trimestre?: number | null, q: CarteraQuery = {}) {
  return carteraGet<CarteraCanceladas>('/cartera/unoee/canceladas', { ...q, anio, trimestre: trimestre ?? undefined })
}

export function fetchCarteraSiesa(q: CarteraQuery = {}) {
  return carteraGet<CarteraSiesaSaldo>('/cartera/siesa/saldo', q)
}

export async function fetchAsesores(): Promise<Asesor[]> {
  const res = await fetch(`${API_URL}/asesores`, { headers: authHeaders() })
  if (res.status === 401) {
    clearSession()
    throw new Error('Sesión expirada')
  }
  if (!res.ok) throw new Error(await readError(res, 'Error al cargar asesores'))
  return res.json()
}
