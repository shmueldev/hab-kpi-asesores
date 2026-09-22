import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Asesor,
  CarteraAbierta,
  fetchAsesores,
  fetchCarteraAbierta,
  fetchKpiMeses,
  fetchKpis,
  KpiDashboard,
  KpiMonthlyBreakdown,
} from '../api/client'
import AppHeader from '../components/AppHeader'
import BikeLoader from '../components/BikeLoader'
import BreakdownTable from '../components/BreakdownTable'
import KpiCard, { sparkDeltaPct, sparkDeltaPp } from '../components/KpiCard'
import OnboardingTour from '../components/OnboardingTour'
import {
  formatMoney,
  formatPct,
  HorizontalBarsChart,
  MonthBarChart,
  StackedShareChart,
  TrendLineChart,
} from '../components/KpiCharts'
import { kpiCacheKey, readDashPack, writeDashPack, writeKpiCache } from '../kpiCache'
import {
  isQuarterOpen,
  lastOpenQuarter,
  loadPeriod,
  periodLabel,
  Quarter,
  rangeFromPeriod,
  savePeriod,
  yearOptions,
  type PeriodState,
} from '../period'

export default function Dashboard() {
  const navigate = useNavigate()
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('kpi_user') || '{}') as {
        role?: string
        asesor_key?: number | null
        nombre?: string | null
      }
    } catch {
      return {}
    }
  }, [])

  const [period, setPeriod] = useState<PeriodState>(loadPeriod)
  const [asesores, setAsesores] = useState<Asesor[]>([])
  const [data, setData] = useState<KpiDashboard | null>(null)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [tourReplay, setTourReplay] = useState(0)
  const [cartera, setCartera] = useState<CarteraAbierta | null>(null)
  const [carteraSpark, setCarteraSpark] = useState<number[]>([])
  const [meses, setMeses] = useState<KpiMonthlyBreakdown | null>(null)
  const [ready, setReady] = useState(false)

  const selectedKey = user.role === 'asesor' ? user.asesor_key ?? null : period.asesorKey === '' ? null : period.asesorKey
  const range = rangeFromPeriod(period)

  function applyPack(pack: {
    kpi: KpiDashboard
    meses: KpiMonthlyBreakdown | null
    cartera: CarteraAbierta | null
    carteraSpark: number[]
  }) {
    setData(pack.kpi)
    setMeses(pack.meses)
    setCartera(pack.cartera)
    setCarteraSpark(pack.carteraSpark)
    setReady(true)
  }

  async function fetchPack(next: PeriodState, key: number | null) {
    const { fechaIni, fechaFin } = rangeFromPeriod(next)
    const [kpi, mesesRes, carteraRes] = await Promise.all([
      fetchKpis(fechaIni, fechaFin, key),
      fetchKpiMeses(fechaIni, fechaFin, key).catch(() => null),
      fetchCarteraBundle(),
    ])
    return {
      kpi,
      meses: mesesRes,
      cartera: carteraRes.cartera,
      carteraSpark: carteraRes.spark,
    }
  }

  async function load(next = period, key = selectedKey) {
    const { fechaIni, fechaFin } = rangeFromPeriod(next)
    const cacheKey = kpiCacheKey(fechaIni, fechaFin, key)
    const cached = readDashPack(cacheKey)
    setError('')
    if (cached?.kpi) {
      applyPack(cached)
      setLoading(false)
      try {
        const pack = await fetchPack(next, key)
        applyPack(pack)
        writeDashPack(cacheKey, pack, next)
      } catch {
        /* se mantiene el snapshot ya visto */
      }
      return
    }
    setReady(false)
    setLoading(true)
    try {
      const pack = await fetchPack(next, key)
      applyPack(pack)
      writeDashPack(cacheKey, pack, next)
    } catch (err) {
      setData(null)
      setMeses(null)
      setCartera(null)
      setCarteraSpark([])
      setReady(false)
      setError(err instanceof Error ? err.message : 'Error')
      if (String(err).includes('Sesión')) navigate('/login')
    } finally {
      setLoading(false)
    }
  }

  function commit(next: PeriodState) {
    setPeriod(next)
    savePeriod(next)
    const key = user.role === 'asesor' ? user.asesor_key ?? null : next.asesorKey === '' ? null : next.asesorKey
    void load(next, key)
  }

  useEffect(() => {
    savePeriod(period)
    void (async () => {
      try {
        setAsesores(await fetchAsesores())
      } catch {
        setAsesores([])
      }
    })()
    void load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function openDetail(kpi: string) {
    if (data) writeKpiCache(kpiCacheKey(range.fechaIni, range.fechaFin, selectedKey), data, period)
    navigate(`/detalle/${kpi}`)
  }

  const monthRows = (meses?.filas || []).filter((row) => !row.es_total)
  const displayName =
    data?.asesor_nombre || user.nombre || (user.role === 'asesor' ? 'Tu cartera' : 'Visión consolidada')
  const cumplSpark = monthRows.map((row) => row.pct_cumplimiento)
  const crecSpark = monthRows.map((row) => row.pct_crecimiento)
  const autoSpark = monthRows.map((row) => row.pct_autogestion)
  const cumplTrend = sparkDeltaPp(cumplSpark)
  const crecTrend = sparkDeltaPp(crecSpark, 'vs mes anterior')
  const autoTrend = sparkDeltaPp(autoSpark)
  const carteraTrend = sparkDeltaPct(carteraSpark)

  return (
    <div className="app-shell hud">
      <AppHeader
        subtitle={`${displayName} · ${periodLabel(period)}`}
        onReplayTour={() => setTourReplay((n) => n + 1)}
      />
      <OnboardingTour ready={ready && Boolean(data) && !loading} isAdmin={user.role === 'admin'} replayToken={tourReplay} />

      <main className="dashboard has-loader">
        <section className="filters neon-card" data-tour="filters">
          <label>
            Año
            <select
              value={period.year}
              onChange={(e) => {
                const year = Number(e.target.value)
                const q = isQuarterOpen(year, period.quarter) ? period.quarter : lastOpenQuarter(year)
                commit({ ...period, year, quarter: q })
              }}
            >
              {yearOptions().map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </label>
          <div className="period-buttons">
            {([1, 2, 3, 4] as Quarter[]).map((q) => {
              const open = isQuarterOpen(period.year, q)
              const tip = open ? `Ver Q${q} ${period.year}` : `Q${q} ${period.year} todavía no empieza`
              return (
                <span key={q} className="q-wrap" title={tip}>
                  <button
                    type="button"
                    disabled={!open}
                    className={`ghost q-btn${period.mode === 'q' && period.quarter === q ? ' active neon' : ''}`}
                    onClick={() => commit({ ...period, quarter: q, mode: 'q' })}
                  >
                    Q{q}
                  </button>
                </span>
              )
            })}
            <button
              type="button"
              className={`ghost q-btn${period.mode === 'year' ? ' active neon' : ''}`}
              onClick={() => commit({ ...period, mode: 'year' })}
            >
              Año
            </button>
          </div>
          {user.role === 'admin' && (
            <label className="asesor-filter" data-tour="asesor">
              Asesor
              <select
                value={period.asesorKey}
                onChange={(e) => {
                  const asesorKey = e.target.value === '' ? '' : Number(e.target.value)
                  commit({ ...period, asesorKey })
                }}
              >
                <option value="">Todos</option>
                {asesores.map((a) => (
                  <option key={a.asesor_key} value={a.asesor_key}>
                    {a.nombre}
                  </option>
                ))}
              </select>
            </label>
          )}
          <p className="range-hint">
            {range.fechaIni} → {range.fechaFin}
          </p>
        </section>

        {ready && data && <SourceBanner data={data} />}
        {error && <div className="error banner">{error}</div>}
        {!ready && !error && <BikeLoader label={`El asesor va por ${periodLabel(period)}…`} />}
        {loading && ready && (
          <div className="bike-overlay">
            <BikeLoader label={`Actualizando ${periodLabel(period)}…`} />
          </div>
        )}

        {ready && data && data.vacio && !error && (
          <div className="empty banner">No hay meta ni ventas en {periodLabel(period)}.</div>
        )}

        {ready && data && !data.vacio && (
          <div className="board-enter">
            <section className="cards-grid dash" data-tour="cards">
              <KpiCard
                tour="cumplimiento"
                icon="target"
                title="Cumplimiento"
                value={formatPct(data.pct_cumpl_presupuesto)}
                delta={cumplTrend?.label || (data.pct_cumpl_presupuesto >= 1 ? 'En meta' : 'Bajo la meta')}
                spark={cumplSpark}
                subtitle={`Meta ${formatMoney(data.total_meta)}`}
                detail={`Venta int. ${formatMoney(data.venta_int)}`}
                percent={data.pct_cumpl_presupuesto}
                tone={cumplTrend?.tone || (data.pct_cumpl_presupuesto >= 1 ? 'ok' : 'bad')}
                onOpen={() => openDetail('cumplimiento')}
              />
              <KpiCard
                tour="crecimiento"
                icon="trend"
                title="Crecimiento"
                value={formatPct(data.pct_crecimiento_dinero)}
                delta={crecTrend?.label || 'vs año anterior'}
                spark={crecSpark}
                subtitle={`Ventas ${formatMoney(data.total_ventas)}`}
                detail={`Año ant. ${formatMoney(data.ventas_aa)}`}
                percent={Math.abs(data.pct_crecimiento_dinero)}
                tone={crecTrend?.tone || (data.pct_crecimiento_dinero >= 0 ? 'ok' : 'bad')}
                onOpen={() => openDetail('crecimiento')}
              />
              <KpiCard
                tour="autogestion"
                icon="people"
                title="Autogestión"
                value={formatPct(data.pct_autogestion)}
                delta={autoTrend?.label || 'sobre venta interna'}
                spark={autoSpark}
                subtitle={formatMoney(data.venta_autogestion)}
                detail={`Sobre ${formatMoney(data.venta_int)}`}
                percent={data.pct_autogestion}
                tone={autoTrend?.tone || 'neutral'}
                onOpen={() => openDetail('autogestion')}
              />
              {cartera && (
                <KpiCard
                  icon="wallet"
                  title="Cartera abierta"
                  value={formatMoney(cartera.abierta)}
                  delta={carteraTrend?.label || `Foto al ${cartera.as_of}`}
                  spark={carteraSpark}
                  subtitle={`${cartera.n_abiertas} cuotas${cartera.vendedor_nombre ? ` · ${cartera.vendedor_nombre}` : ''}`}
                  detail={`Foto al ${cartera.as_of}`}
                  tone={carteraTrend?.tone || 'neutral'}
                  onOpen={() => navigate('/detalle/cartera')}
                />
              )}
            </section>

            <section className="charts-grid dash-top" data-tour="charts">
              <TrendLineChart
                title="Ventas vs meta"
                points={
                  monthRows.length
                    ? monthRows.map((row) => ({ name: row.mes_texto.slice(0, 3), venta: row.venta_int, meta: row.total_meta }))
                    : [{ name: periodLabel(period), venta: data.venta_int, meta: data.total_meta }]
                }
                onOpen={() => openDetail('cumplimiento')}
              />
              {cartera && (
                <HorizontalBarsChart
                  title="Desempeño por cubeta"
                  items={[
                    { name: 'Al día', value: cartera.al_dia.monto },
                    { name: 'Gracia', value: cartera.gracia.monto },
                    { name: 'Vencida', value: cartera.vencida.monto },
                  ]}
                  onOpen={() => navigate('/detalle/cartera')}
                />
              )}
            </section>
            <section className="charts-grid dash-bottom">
              <MonthBarChart
                title="Ventas vs año anterior"
                points={
                  monthRows.length
                    ? monthRows.map((row) => ({
                        name: row.mes_texto.slice(0, 3),
                        actual: row.venta_actual,
                        anterior: row.ventas_aa,
                      }))
                    : [{ name: periodLabel(period), actual: data.total_ventas, anterior: data.ventas_aa }]
                }
                onOpen={() => openDetail('crecimiento')}
              />
              <StackedShareChart
                title="Composición de ventas"
                points={
                  monthRows.length
                    ? monthRows.map((row) => ({
                        name: row.mes_texto.slice(0, 3),
                        Autogestión: row.venta_autogestion,
                        Resto: Math.max(0, row.venta_int - row.venta_autogestion),
                      }))
                    : [
                        {
                          name: periodLabel(period),
                          Autogestión: data.venta_autogestion,
                          Resto: Math.max(0, (data.venta_int || data.total_ventas) - data.venta_autogestion),
                        },
                      ]
                }
                keys={[{ key: 'Autogestión' }, { key: 'Resto' }]}
                onOpen={() => openDetail('autogestion')}
              />
            </section>

            <BreakdownTable
              tour="table"
              formula="cada % sale de los montos de la fila"
              rows={[
                {
                  label: 'Cumplimiento',
                  value: formatPct(data.pct_cumpl_presupuesto),
                  hint: `${formatMoney(data.venta_int)} / ${formatMoney(data.total_meta)}`,
                },
                {
                  label: 'Crecimiento',
                  value: formatPct(data.pct_crecimiento_dinero),
                  hint: `${formatMoney(data.total_ventas)} vs ${formatMoney(data.ventas_aa)}`,
                },
                {
                  label: 'Autogestión',
                  value: formatPct(data.pct_autogestion),
                  hint: `${formatMoney(data.venta_autogestion)} / ${formatMoney(data.venta_int)}`,
                },
                ...(cartera
                  ? [
                      {
                        label: 'Cartera abierta',
                        value: formatMoney(cartera.abierta),
                        hint: `SUM(valor) ABIERTA · ${cartera.n_abiertas} cuotas`,
                      },
                    ]
                  : []),
              ]}
            />
          </div>
        )}
      </main>
    </div>
  )
}

function isoLocal(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

async function fetchCarteraBundle(): Promise<{ cartera: CarteraAbierta | null; spark: number[] }> {
  const prevEnd = isoLocal(new Date(new Date().getFullYear(), new Date().getMonth(), 0))
  const [current, previous] = await Promise.all([
    fetchCarteraAbierta().catch(() => null),
    fetchCarteraAbierta({ as_of: prevEnd }).catch(() => null),
  ])
  const spark = [previous?.abierta, current?.abierta].filter((n): n is number => n != null)
  return { cartera: current, spark }
}

function SourceBanner({ data }: { data: KpiDashboard }) {
  if (data.fuente === 'sql') {
    return (
      <div className="source-banner live" data-tour="source">
        Señal en vivo · bdhabEngineer
      </div>
    )
  }
  if (data.fuente === 'redis') {
    return (
      <div className="source-banner cache" data-tour="source">
        Último snapshot guardado
      </div>
    )
  }
  return (
    <div className="source-banner demo" data-tour="source">
      Modo demostración
    </div>
  )
}
