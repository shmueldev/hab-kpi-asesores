import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Asesor,
  CarteraAbierta,
  fetchAsesores,
  fetchCarteraAbierta,
  fetchKpis,
  KpiDashboard,
} from '../api/client'
import AppHeader from '../components/AppHeader'
import BikeLoader from '../components/BikeLoader'
import BreakdownTable from '../components/BreakdownTable'
import KpiCard from '../components/KpiCard'
import OnboardingTour from '../components/OnboardingTour'
import {
  formatMoney,
  formatPct,
  GaugeChart,
  MixDonutChart,
  NamedBarChart,
} from '../components/KpiCharts'
import { kpiCacheKey, readKpiCache, writeKpiCache } from '../kpiCache'
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

  const selectedKey = user.role === 'asesor' ? user.asesor_key ?? null : period.asesorKey === '' ? null : period.asesorKey
  const range = rangeFromPeriod(period)

  async function load(next = period, key = selectedKey) {
    const { fechaIni, fechaFin } = rangeFromPeriod(next)
    const cacheKey = kpiCacheKey(fechaIni, fechaFin, key)
    const cached = readKpiCache(cacheKey)
    setError('')
    if (cached) {
      setData(cached)
      writeKpiCache(cacheKey, cached, next)
      setLoading(false)
      try {
        const kpi = await fetchKpis(fechaIni, fechaFin, key)
        writeKpiCache(cacheKey, kpi, next)
        setData(kpi)
      } catch {
        /* se mantiene el snapshot ya visto */
      }
      return
    }
    setLoading(true)
    try {
      const kpi = await fetchKpis(fechaIni, fechaFin, key)
      setData(kpi)
      writeKpiCache(cacheKey, kpi, next)
    } catch (err) {
      setData(null)
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
    void loadCartera()
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
    void loadCartera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function loadCartera() {
    void fetchCarteraAbierta()
      .then(setCartera)
      .catch(() => {
        setCartera(null)
      })
  }

  function openDetail(kpi: string) {
    if (data) writeKpiCache(kpiCacheKey(range.fechaIni, range.fechaFin, selectedKey), data, period)
    navigate(`/detalle/${kpi}`)
  }

  const displayName =
    data?.asesor_nombre || user.nombre || (user.role === 'asesor' ? 'Tu cartera' : 'Visión consolidada')

  return (
    <div className="app-shell hud">
      <AppHeader
        subtitle={`${displayName} · ${periodLabel(period)}`}
        onReplayTour={() => setTourReplay((n) => n + 1)}
      />
      <OnboardingTour ready={Boolean(data) && !loading} isAdmin={user.role === 'admin'} replayToken={tourReplay} />

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

        {data && <SourceBanner data={data} />}
        {error && <div className="error banner">{error}</div>}
        {loading && !data && <BikeLoader label={`El asesor va por ${periodLabel(period)}…`} />}
        {loading && data && (
          <div className="bike-overlay">
            <BikeLoader label={`Actualizando ${periodLabel(period)}…`} />
          </div>
        )}

        {data && data.vacio && !error && (
          <div className="empty banner">No hay meta ni ventas en {periodLabel(period)}.</div>
        )}

        {data && !data.vacio && (
          <>
            <section className={`cards-grid${cartera ? ' two' : ''}`} data-tour="cards">
              <KpiCard
                tour="cumplimiento"
                title="Cumplimiento"
                value={formatPct(data.pct_cumpl_presupuesto)}
                subtitle={`Meta ${formatMoney(data.total_meta)}`}
                detail={`Venta int. ${formatMoney(data.venta_int)}`}
                percent={data.pct_cumpl_presupuesto}
                tone={data.pct_cumpl_presupuesto >= 1 ? 'ok' : 'bad'}
                onOpen={() => openDetail('cumplimiento')}
              />
              <KpiCard
                tour="crecimiento"
                title="Crecimiento"
                value={formatPct(data.pct_crecimiento_dinero)}
                subtitle={`Ventas ${formatMoney(data.total_ventas)}`}
                detail={`Año ant. ${formatMoney(data.ventas_aa)}`}
                percent={Math.abs(data.pct_crecimiento_dinero)}
                tone={data.pct_crecimiento_dinero >= 0 ? 'ok' : 'bad'}
                onOpen={() => openDetail('crecimiento')}
              />
              <KpiCard
                tour="autogestion"
                title="Autogestión"
                value={formatPct(data.pct_autogestion)}
                subtitle={formatMoney(data.venta_autogestion)}
                detail={`Sobre ${formatMoney(data.venta_int)}`}
                percent={data.pct_autogestion}
                tone="neutral"
                onOpen={() => openDetail('autogestion')}
              />
              {cartera && (
                <KpiCard
                  title="Cartera abierta"
                  value={formatMoney(cartera.abierta)}
                  subtitle={`${cartera.n_abiertas} cuotas${cartera.vendedor_nombre ? ` · ${cartera.vendedor_nombre}` : ''}`}
                  detail={`Foto al ${cartera.as_of}`}
                  onOpen={() => navigate('/cartera/abierta')}
                />
              )}
            </section>

            <section className={`charts-grid${cartera ? ' two' : ''}`} data-tour="charts">
              <GaugeChart
                title="Avance vs meta"
                percent={data.pct_cumpl_presupuesto}
                partLabel="Venta int."
                restLabel="Falta a meta"
                onOpen={() => openDetail('cumplimiento')}
              />
              <MixDonutChart
                title="Ventas vs año anterior"
                part={data.total_ventas}
                total={data.total_ventas + Math.max(0, data.ventas_aa)}
                partLabel="Actual"
                restLabel="Año ant."
                centerLabel={formatPct(data.pct_crecimiento_dinero)}
                onOpen={() => openDetail('crecimiento')}
              />
              <MixDonutChart
                title="Mix autogestión"
                part={data.venta_autogestion}
                total={data.venta_int || data.total_ventas}
                partLabel="Autogestión"
                onOpen={() => openDetail('autogestion')}
              />
              {cartera && (
                <NamedBarChart
                  title="Cartera por cubeta"
                  items={[
                    { name: 'Al día', value: cartera.al_dia.monto, color: '#168980' },
                    { name: 'Gracia', value: cartera.gracia.monto, color: '#8BC7F7' },
                    { name: 'Vencida', value: cartera.vencida.monto, color: '#BB4A4A' },
                  ]}
                  onOpen={() => navigate('/cartera/abierta')}
                />
              )}
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
          </>
        )}
      </main>
    </div>
  )
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
