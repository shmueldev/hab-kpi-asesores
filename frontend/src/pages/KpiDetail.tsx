import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { fetchKpiMeses, fetchKpis, KpiDashboard, KpiMonthlyBreakdown } from '../api/client'
import AppHeader from '../components/AppHeader'
import BikeLoader from '../components/BikeLoader'
import BreakdownTable from '../components/BreakdownTable'
import MonthlyKpiTable, { type KpiId } from '../components/MonthlyKpiTable'
import {
  formatMoney,
  formatPct,
  GaugeChart,
  MixDonutChart,
} from '../components/KpiCharts'
import { kpiCacheKey, readKpiCache, readLastSnapshot, writeKpiCache } from '../kpiCache'
import { loadPeriod, periodLabel, rangeFromPeriod } from '../period'
import { theme } from '../theme'

const TITLES: Record<KpiId, string> = {
  cumplimiento: 'Cumplimiento de presupuesto',
  crecimiento: 'Crecimiento en dinero',
  autogestion: 'Autogestión',
}

export default function KpiDetail() {
  const { kpi } = useParams<{ kpi: string }>()
  const navigate = useNavigate()
  const id = kpi as KpiId
  const [period] = useState(() => loadPeriod())
  const [data, setData] = useState<KpiDashboard | null>(null)
  const [meses, setMeses] = useState<KpiMonthlyBreakdown | null>(null)
  const [mesesError, setMesesError] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    const { fechaIni, fechaFin } = rangeFromPeriod(period)
    const user = JSON.parse(localStorage.getItem('kpi_user') || '{}') as {
      role?: string
      asesor_key?: number | null
    }
    const key = user.role === 'asesor' ? user.asesor_key : period.asesorKey === '' ? null : period.asesorKey
    const cacheKey = kpiCacheKey(fechaIni, fechaFin, key)
    const cached = readKpiCache(cacheKey) || readLastSnapshot()?.data || null
    if (cached) {
      setData(cached)
    } else {
      void fetchKpis(fechaIni, fechaFin, key)
        .then((kpi) => {
          writeKpiCache(cacheKey, kpi, period)
          setData(kpi)
        })
        .catch((err: unknown) => {
          setError(err instanceof Error ? err.message : 'Error')
          if (String(err).includes('Sesión')) navigate('/login')
        })
    }
    void fetchKpiMeses(fechaIni, fechaFin, key)
      .then(setMeses)
      .catch((err: unknown) => {
        setMesesError(err instanceof Error ? err.message : 'No se pudo armar la tabla mensual')
      })
  }, [navigate, period])

  if (!TITLES[id]) return <Navigate to="/" replace />

  return (
    <div className="app-shell hud">
      <AppHeader subtitle={`${TITLES[id]} · ${periodLabel(period)}`} backTo="/" />
      <main className="dashboard detail-page">
        {error && <div className="error banner">{error}</div>}
        {!data && !error && <BikeLoader label={`El asesor va por ${periodLabel(period)}…`} />}
        {data && (
          <>
            <p className="detail-lead">
              {data.asesor_nombre || 'Consolidado'} · {periodLabel(period)}
            </p>
            {id === 'cumplimiento' && (
              <>
                <section className="cards-grid two">
                  <article className="kpi-card neon-card">
                    <div className="kpi-card-title">Cumplimiento</div>
                    <div className="kpi-card-value" style={{ color: data.pct_cumpl_presupuesto >= 1 ? theme.ok : theme.bad }}>
                      {formatPct(data.pct_cumpl_presupuesto)}
                    </div>
                    <div className="kpi-card-sub">Venta int. / meta</div>
                  </article>
                  <article className="kpi-card neon-card">
                    <div className="kpi-card-title">Montos</div>
                    <div className="kpi-card-sub">Meta {formatMoney(data.total_meta)}</div>
                    <div className="kpi-card-sub">Venta int. {formatMoney(data.venta_int)}</div>
                  </article>
                </section>
                <BreakdownTable
                  formula="venta internacional ÷ meta"
                  rows={[
                    { label: 'Meta del periodo', value: formatMoney(data.total_meta) },
                    { label: 'Venta internacional', value: formatMoney(data.venta_int) },
                    { label: 'Brecha (meta − venta)', value: formatMoney(data.total_meta - data.venta_int) },
                    { label: 'Cumplimiento', value: formatPct(data.pct_cumpl_presupuesto) },
                  ]}
                />
                {mesesError && <div className="error banner">{mesesError}</div>}
                {!meses && !mesesError && <BikeLoader compact label="Armando la tabla mes a mes…" />}
                {meses && <MonthlyKpiTable kpi="cumplimiento" data={meses} />}
                <section className="charts-grid two">
                  <GaugeChart
                    title="Avance vs meta"
                    percent={data.pct_cumpl_presupuesto}
                    color={data.pct_cumpl_presupuesto >= 1 ? theme.ok : theme.highlight}
                    partLabel="Venta int."
                    restLabel="Falta a meta"
                    height={280}
                  />
                  <MixDonutChart
                    title="Venta vs meta"
                    part={data.venta_int}
                    total={Math.max(data.total_meta, data.venta_int)}
                    partLabel="Venta int."
                    restLabel="Falta a meta"
                    centerLabel={formatPct(data.pct_cumpl_presupuesto)}
                    height={280}
                  />
                </section>
              </>
            )}
            {id === 'crecimiento' && (
              <>
                <section className="cards-grid two">
                  <article className="kpi-card neon-card">
                    <div className="kpi-card-title">Crecimiento</div>
                    <div className="kpi-card-value" style={{ color: data.pct_crecimiento_dinero >= 0 ? theme.ok : theme.bad }}>
                      {formatPct(data.pct_crecimiento_dinero)}
                    </div>
                    <div className="kpi-card-sub">Actual vs mismo periodo año anterior</div>
                  </article>
                  <article className="kpi-card neon-card">
                    <div className="kpi-card-title">Ventas</div>
                    <div className="kpi-card-sub">Actual {formatMoney(data.total_ventas)}</div>
                    <div className="kpi-card-sub">Año ant. {formatMoney(data.ventas_aa)}</div>
                  </article>
                </section>
                <BreakdownTable
                  formula="(ventas actuales ÷ ventas año anterior) − 1"
                  rows={[
                    { label: 'Ventas del periodo', value: formatMoney(data.total_ventas) },
                    { label: 'Ventas mismo periodo año anterior', value: formatMoney(data.ventas_aa) },
                    { label: 'Diferencia en dinero', value: formatMoney(data.total_ventas - data.ventas_aa) },
                    { label: 'Crecimiento', value: formatPct(data.pct_crecimiento_dinero) },
                  ]}
                />
                {mesesError && <div className="error banner">{mesesError}</div>}
                {!meses && !mesesError && <BikeLoader compact label="Armando la tabla mes a mes…" />}
                {meses && <MonthlyKpiTable kpi="crecimiento" data={meses} />}
                <section className="charts-grid one">
                  <MixDonutChart
                    title="Ventas actual vs año anterior"
                    part={data.total_ventas}
                    total={data.total_ventas + Math.max(0, data.ventas_aa)}
                    partLabel="Actual"
                    restLabel="Año ant."
                    centerLabel={formatPct(data.pct_crecimiento_dinero)}
                    height={320}
                  />
                </section>
              </>
            )}
            {id === 'autogestion' && (
              <>
                <section className="cards-grid two">
                  <article className="kpi-card neon-card">
                    <div className="kpi-card-title">Autogestión</div>
                    <div className="kpi-card-value" style={{ color: theme.highlight }}>
                      {formatPct(data.pct_autogestion)}
                    </div>
                    <div className="kpi-card-sub">Sobre venta internacional</div>
                  </article>
                  <article className="kpi-card neon-card">
                    <div className="kpi-card-title">Canal</div>
                    <div className="kpi-card-sub">Autogestión {formatMoney(data.venta_autogestion)}</div>
                    <div className="kpi-card-sub">Venta int. {formatMoney(data.venta_int)}</div>
                  </article>
                </section>
                <BreakdownTable
                  formula="venta autogestión ÷ venta internacional"
                  rows={[
                    { label: 'Venta autogestión', value: formatMoney(data.venta_autogestion) },
                    { label: 'Venta internacional', value: formatMoney(data.venta_int) },
                    {
                      label: 'Resto (no autogestión)',
                      value: formatMoney(Math.max(0, data.venta_int - data.venta_autogestion)),
                    },
                    { label: 'Autogestión', value: formatPct(data.pct_autogestion) },
                  ]}
                />
                {mesesError && <div className="error banner">{mesesError}</div>}
                {!meses && !mesesError && <BikeLoader compact label="Armando la tabla mes a mes…" />}
                {meses && <MonthlyKpiTable kpi="autogestion" data={meses} />}
                <section className="charts-grid one">
                  <MixDonutChart
                    title="Mix autogestión vs resto"
                    part={data.venta_autogestion}
                    total={data.venta_int || data.total_ventas}
                    partLabel="Autogestión"
                    height={320}
                  />
                </section>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}
