import { useEffect, useState } from 'react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { fetchKpiMeses, fetchKpis, KpiDashboard, KpiMonthlyBreakdown } from '../api/client'
import AppHeader from '../components/AppHeader'
import BikeLoader from '../components/BikeLoader'
import BreakdownTable from '../components/BreakdownTable'
import KpiCard, { sparkDeltaPp } from '../components/KpiCard'
import KpiSkeleton from '../components/KpiSkeleton'
import ScopeBanner from '../components/ScopeBanner'
import MonthlyKpiTable, { type KpiId } from '../components/MonthlyKpiTable'
import {
  ComboMonthChart,
  formatMoney,
  formatPct,
  MixDonutChart,
  MonthBarChart,
  TrendLineChart,
} from '../components/KpiCharts'
import { kpiCacheKey, readKpiCache, readLastSnapshot, writeKpiCache } from '../kpiCache'
import { loadPeriod, periodLabel, rangeFromPeriod, selectedAsesorKey } from '../period'

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

  const monthRows = (meses?.filas || []).filter((row) => !row.es_total)
  const cumplSpark = monthRows.map((row) => row.pct_cumplimiento)
  const crecSpark = monthRows.map((row) => row.pct_crecimiento)
  const autoSpark = monthRows.map((row) => row.pct_autogestion)
  const cumplTrend = sparkDeltaPp(cumplSpark)
  const crecTrend = sparkDeltaPp(crecSpark, 'vs mes anterior')
  const autoTrend = sparkDeltaPp(autoSpark)

  return (
    <div className="app-shell hud">
      <AppHeader subtitle={`${TITLES[id]} · ${periodLabel(period)}`} backTo="/" />
      <main className="dashboard detail-page">
        <ScopeBanner
          visible={
            (JSON.parse(localStorage.getItem('kpi_user') || '{}') as { role?: string }).role === 'admin' &&
            selectedAsesorKey() == null
          }
        />
        {error && <div className="error banner">{error}</div>}
        {!data && !error && (
          <>
            <BikeLoader label={`El asesor va por ${periodLabel(period)}…`} />
            <KpiSkeleton />
          </>
        )}
        {data && (
          <div className="board-enter">
            <p className="detail-lead">
              {data.asesor_nombre || 'Consolidado'} · {periodLabel(period)}
            </p>
            {id === 'cumplimiento' && (
              <>
                <section className="cards-grid two">
                  <KpiCard
                    icon="target"
                    title="Cumplimiento"
                    value={formatPct(data.pct_cumpl_presupuesto)}
                    delta={cumplTrend?.label || (data.pct_cumpl_presupuesto >= 1 ? 'En meta' : 'Bajo la meta')}
                    spark={cumplSpark}
                    subtitle={`Venta int. ${formatMoney(data.venta_int)}`}
                    detail={`Meta ${formatMoney(data.total_meta)}`}
                    percent={data.pct_cumpl_presupuesto}
                    tone={cumplTrend?.tone || (data.pct_cumpl_presupuesto >= 1 ? 'ok' : 'bad')}
                  />
                  <KpiCard
                    icon="trophy"
                    title="Meta del periodo"
                    value={formatMoney(data.total_meta)}
                    delta={periodLabel(period)}
                    subtitle="fact_presupuesto"
                    detail="Base del cumplimiento"
                  />
                  <KpiCard
                    icon="trend"
                    title="Venta internacional"
                    value={formatMoney(data.venta_int)}
                    delta={`${formatPct(data.pct_cumpl_presupuesto)} de la meta`}
                    spark={monthRows.map((row) => row.venta_int)}
                    subtitle="fact_ventas · venta int."
                    detail={`Falta ${formatMoney(Math.max(0, data.total_meta - data.venta_int))}`}
                    percent={data.total_meta ? data.venta_int / data.total_meta : 0}
                    tone={data.pct_cumpl_presupuesto >= 1 ? 'ok' : 'bad'}
                  />
                  <KpiCard
                    icon="alert"
                    title="Brecha"
                    value={formatMoney(data.total_meta - data.venta_int)}
                    delta={data.total_meta - data.venta_int <= 0 ? 'Meta cubierta' : 'Falta por vender'}
                    subtitle="meta − venta int."
                    detail={data.asesor_nombre || 'Consolidado'}
                    percent={data.total_meta ? Math.abs(data.total_meta - data.venta_int) / data.total_meta : 0}
                    tone={data.total_meta - data.venta_int <= 0 ? 'ok' : 'bad'}
                  />
                </section>
                <BreakdownTable
                  title="Cómo se calcula"
                  description="Cumplimiento = venta internacional ÷ meta del periodo."
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
                  <TrendLineChart
                    title="Avance vs meta"
                    points={
                      (meses?.filas || []).filter((row) => !row.es_total).length
                        ? (meses?.filas || [])
                            .filter((row) => !row.es_total)
                            .map((row) => ({ name: row.mes_texto.slice(0, 3), venta: row.venta_int, meta: row.total_meta }))
                        : [{ name: periodLabel(period), venta: data.venta_int, meta: data.total_meta }]
                    }
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
                {(meses?.filas || []).some((row) => !row.es_total) && (
                  <section className="charts-grid one">
                    <ComboMonthChart
                      title="Evolución de ventas"
                      points={(meses?.filas || [])
                        .filter((row) => !row.es_total)
                        .map((row) => ({ name: row.mes_texto.slice(0, 3), venta: row.venta_int, meta: row.total_meta }))}
                      height={280}
                    />
                  </section>
                )}
              </>
            )}
            {id === 'crecimiento' && (
              <>
                <section className="cards-grid two">
                  <KpiCard
                    icon="trend"
                    title="Crecimiento"
                    value={formatPct(data.pct_crecimiento_dinero)}
                    delta={crecTrend?.label || 'vs año anterior'}
                    spark={crecSpark}
                    subtitle={`Actual ${formatMoney(data.total_ventas)}`}
                    detail={`Año ant. ${formatMoney(data.ventas_aa)}`}
                    percent={Math.abs(data.pct_crecimiento_dinero)}
                    tone={crecTrend?.tone || (data.pct_crecimiento_dinero >= 0 ? 'ok' : 'bad')}
                  />
                  <KpiCard
                    icon="wallet"
                    title="Ventas del periodo"
                    value={formatMoney(data.total_ventas)}
                    delta={periodLabel(period)}
                    spark={monthRows.map((row) => row.venta_actual)}
                    subtitle="fact_ventas"
                    detail="Mismo recorte de fechas"
                    percent={data.ventas_aa ? data.total_ventas / (data.total_ventas + data.ventas_aa) : 1}
                    tone={data.pct_crecimiento_dinero >= 0 ? 'ok' : 'bad'}
                  />
                  <KpiCard
                    icon="clock"
                    title="Año anterior"
                    value={formatMoney(data.ventas_aa)}
                    delta="mismo periodo AA"
                    spark={monthRows.map((row) => row.ventas_aa)}
                    subtitle="Ventas del año pasado"
                    detail="Base del crecimiento"
                  />
                  <KpiCard
                    icon={data.total_ventas - data.ventas_aa >= 0 ? 'check' : 'alert'}
                    title="Diferencia"
                    value={formatMoney(data.total_ventas - data.ventas_aa)}
                    delta={data.total_ventas - data.ventas_aa >= 0 ? 'Por encima del AA' : 'Por debajo del AA'}
                    subtitle="actual − año anterior"
                    detail={data.asesor_nombre || 'Consolidado'}
                    percent={data.ventas_aa ? Math.abs(data.total_ventas - data.ventas_aa) / data.ventas_aa : 0}
                    tone={data.total_ventas - data.ventas_aa >= 0 ? 'ok' : 'bad'}
                  />
                </section>
                <BreakdownTable
                  title="Cómo se calcula"
                  description="Crecimiento = (ventas actuales ÷ ventas del mismo periodo año anterior) − 1."
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
                  <MonthBarChart
                    title="Ventas vs año anterior"
                    points={
                      (meses?.filas || []).filter((row) => !row.es_total).length
                        ? (meses?.filas || [])
                            .filter((row) => !row.es_total)
                            .map((row) => ({
                              name: row.mes_texto.slice(0, 3),
                              actual: row.venta_actual,
                              anterior: row.ventas_aa,
                            }))
                        : [{ name: periodLabel(period), actual: data.total_ventas, anterior: data.ventas_aa }]
                    }
                    height={320}
                  />
                </section>
              </>
            )}
            {id === 'autogestion' && (
              <>
                <section className="cards-grid two">
                  <KpiCard
                    icon="people"
                    title="Autogestión"
                    value={formatPct(data.pct_autogestion)}
                    delta={autoTrend?.label || 'sobre venta interna'}
                    spark={autoSpark}
                    subtitle={formatMoney(data.venta_autogestion)}
                    detail={`Sobre ${formatMoney(data.venta_int)}`}
                    percent={data.pct_autogestion}
                    tone={autoTrend?.tone || 'neutral'}
                  />
                  <KpiCard
                    icon="wallet"
                    title="Venta autogestión"
                    value={formatMoney(data.venta_autogestion)}
                    delta={`${formatPct(data.pct_autogestion)} del canal`}
                    spark={monthRows.map((row) => row.venta_autogestion)}
                    subtitle="Canal autogestión"
                    detail={periodLabel(period)}
                    percent={data.pct_autogestion}
                    tone="neutral"
                  />
                  <KpiCard
                    icon="trend"
                    title="Venta internacional"
                    value={formatMoney(data.venta_int)}
                    delta="denominador del mix"
                    spark={monthRows.map((row) => row.venta_int)}
                    subtitle="fact_ventas · venta int."
                    detail="Base de la autogestión"
                  />
                  <KpiCard
                    icon="docs"
                    title="Resto"
                    value={formatMoney(Math.max(0, data.venta_int - data.venta_autogestion))}
                    delta={`${formatPct(1 - data.pct_autogestion)} no autogestión`}
                    subtitle="venta int. − autogestión"
                    detail={data.asesor_nombre || 'Consolidado'}
                    percent={1 - data.pct_autogestion}
                    tone="neutral"
                  />
                </section>
                <BreakdownTable
                  title="Cómo se calcula"
                  description="Autogestión = venta autogestión ÷ venta internacional."
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
          </div>
        )}
      </main>
    </div>
  )
}
