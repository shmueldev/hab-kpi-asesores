import { useEffect, useMemo, useState } from 'react'
import { Navigate, useParams, useSearchParams } from 'react-router-dom'
import {
  CarteraAging,
  CarteraCanceladas,
  CarteraSiesaSaldo,
  fetchCarteraAging,
  fetchCarteraCanceladas,
  fetchCarteraSiesa,
} from '../api/client'
import AppHeader from '../components/AppHeader'
import BikeLoader from '../components/BikeLoader'
import BreakdownTable from '../components/BreakdownTable'
import KpiCard from '../components/KpiCard'
import { formatMoney, NamedBarChart, SliceDonutChart } from '../components/KpiCharts'
import { currentYear, yearOptions } from '../period'

type Vista = 'abierta' | 'canceladas' | 'siesa'

const TITLES: Record<Vista, string> = {
  abierta: 'Cartera UnoEE abierta / aging',
  canceladas: 'Cartera UnoEE canceladas',
  siesa: 'Saldo cartera Siesa',
}

export default function CarteraDetail() {
  const { vista } = useParams<{ vista: string }>()
  const id = vista as Vista
  const [params, setParams] = useSearchParams()
  const asOf = params.get('as_of') || new Date().toISOString().slice(0, 10)
  const anio = Number(params.get('anio') || currentYear())
  const trimestre = params.get('q') ? Number(params.get('q')) : null

  const [aging, setAging] = useState<CarteraAging | null>(null)
  const [canceladas, setCanceladas] = useState<CarteraCanceladas | null>(null)
  const [siesa, setSiesa] = useState<CarteraSiesaSaldo | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    setError('')
    if (id === 'abierta') {
      void fetchCarteraAging({ as_of: asOf })
        .then(setAging)
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error'))
    } else if (id === 'canceladas') {
      void fetchCarteraCanceladas(anio, trimestre)
        .then(setCanceladas)
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error'))
    } else if (id === 'siesa') {
      void fetchCarteraSiesa()
        .then(setSiesa)
        .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error'))
    }
  }, [id, asOf, anio, trimestre])

  const vendedor = aging?.resumen.vendedor_nombre
  const subtitle = useMemo(() => {
    const who = vendedor ? ` · ${vendedor}` : ''
    if (id === 'abierta') return `Foto ${asOf}${who}`
    if (id === 'canceladas') return `Año ${anio}${trimestre ? ` · Q${trimestre}` : ''}${who}`
    return `fact_cartera.total${who}`
  }, [id, asOf, anio, trimestre, vendedor])

  if (!TITLES[id]) return <Navigate to="/cartera" replace />

  return (
    <div className="app-shell hud">
      <AppHeader subtitle={`${TITLES[id]} · ${subtitle}`} backTo="/cartera" />
      <main className="dashboard detail-page">
        {id === 'abierta' && (
          <section className="filters neon-card">
            <label>
              Foto al
              <input type="date" value={asOf} onChange={(e) => setParams({ as_of: e.target.value })} />
            </label>
            <p className="range-hint">Cubetas: d = as_of − fecha_vcto. Sin vencimiento no entra a cubeta.</p>
          </section>
        )}
        {id === 'canceladas' && (
          <section className="filters neon-card">
            <label>
              Año
              <select
                value={anio}
                onChange={(e) => {
                  const next = { anio: e.target.value }
                  if (trimestre) Object.assign(next, { q: String(trimestre) })
                  setParams(next)
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
              {[1, 2, 3, 4].map((q) => (
                <button
                  key={q}
                  type="button"
                  className={`ghost q-btn${trimestre === q ? ' active neon' : ''}`}
                  onClick={() => setParams({ anio: String(anio), q: String(q) })}
                >
                  Q{q}
                </button>
              ))}
              <button type="button" className={`ghost q-btn${trimestre == null ? ' active neon' : ''}`} onClick={() => setParams({ anio: String(anio) })}>
                Año
              </button>
            </div>
            <p className="range-hint">Solo fecha_cancelacion + dim_calendario. No uses fecha_docto.</p>
          </section>
        )}
        {error && <div className="error banner">{error}</div>}
        {id === 'abierta' && !aging && !error && <BikeLoader label="Armando aging UnoEE…" />}
        {id === 'canceladas' && !canceladas && !error && <BikeLoader label="Contando canceladas…" />}
        {id === 'siesa' && !siesa && !error && <BikeLoader label="Leyendo saldo Siesa…" />}

        {id === 'abierta' && aging && (
          <>
            <section className="cards-grid">
              <KpiCard
                title="Al día"
                value={formatMoney(aging.resumen.al_dia.monto)}
                subtitle={`${aging.resumen.al_dia.n} · d ≤ 0`}
                tone="ok"
              />
              <KpiCard
                title="Gracia 30 días"
                value={formatMoney(aging.resumen.gracia.monto)}
                subtitle={`${aging.resumen.gracia.n} · 1 a 30`}
              />
              <KpiCard
                title="Vencida"
                value={formatMoney(aging.resumen.vencida.monto)}
                subtitle={`${aging.resumen.vencida.n} · más de 30`}
                tone="bad"
              />
            </section>
            <BreakdownTable
              formula="d = as_of − fecha_vcto. Abierta $ = al día + gracia + vencida + sin vencimiento"
              rows={[
                { label: 'Abierta $', value: formatMoney(aging.resumen.abierta) },
                { label: 'Al día', value: formatMoney(aging.resumen.al_dia.monto), hint: `${aging.resumen.al_dia.n} cuotas` },
                { label: 'Gracia', value: formatMoney(aging.resumen.gracia.monto), hint: `${aging.resumen.gracia.n} cuotas` },
                { label: 'Vencida', value: formatMoney(aging.resumen.vencida.monto), hint: `${aging.resumen.vencida.n} cuotas` },
                {
                  label: 'Sin vencimiento',
                  value: formatMoney(aging.resumen.sin_vcto.monto),
                  hint: 'Suma en abierta y no en cubetas',
                },
              ]}
            />
            <section className="charts-grid two">
              <NamedBarChart
                title="Abierta por cubeta"
                items={[
                  { name: 'Al día', value: aging.resumen.al_dia.monto, color: '#168980' },
                  { name: 'Gracia', value: aging.resumen.gracia.monto, color: '#8BC7F7' },
                  { name: 'Vencida', value: aging.resumen.vencida.monto, color: '#BB4A4A' },
                ]}
              />
              <SliceDonutChart
                title="Mix de cubetas"
                slices={[
                  { name: 'Al día', value: aging.resumen.al_dia.monto, color: '#168980' },
                  { name: 'Gracia', value: aging.resumen.gracia.monto, color: '#8BC7F7' },
                  { name: 'Vencida', value: aging.resumen.vencida.monto, color: '#BB4A4A' },
                ]}
              />
            </section>
            <section className="month-table neon-card">
              <p className="formula-line">Por vendedor UnoEE</p>
              <table>
                <thead>
                  <tr>
                    <th>Vendedor</th>
                    <th className="num">Monto</th>
                    <th className="num">#</th>
                  </tr>
                </thead>
                <tbody>
                  {aging.por_vendedor.map((row) => (
                    <tr key={row.nombre}>
                      <td>{row.nombre}</td>
                      <td className="num">{formatMoney(row.monto)}</td>
                      <td className="num">{row.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="month-table neon-card">
              <p className="formula-line">Top clientes</p>
              <table>
                <thead>
                  <tr>
                    <th>Cliente</th>
                    <th className="num">Monto</th>
                    <th className="num">#</th>
                  </tr>
                </thead>
                <tbody>
                  {aging.top_clientes.map((row) => (
                    <tr key={row.nombre}>
                      <td>{row.nombre}</td>
                      <td className="num">{formatMoney(row.monto)}</td>
                      <td className="num">{row.n}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </section>
            <section className="month-table neon-card">
              <p className="formula-line">Detalle de cuotas abiertas</p>
              <div className="month-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>NIT</th>
                      <th>Razón social</th>
                      <th>Sucursal</th>
                      <th>Vendedor</th>
                      <th>Docto</th>
                      <th>Cuota</th>
                      <th>Vence</th>
                      <th>Cubeta</th>
                      <th className="num">Días a vcto</th>
                      <th className="num">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {aging.detalle.map((row, i) => (
                      <tr key={`${row.nit}-${row.consec_docto_cruce}-${row.nro_cuota_cruce}-${i}`}>
                        <td>{row.nit}</td>
                        <td>{row.razon_social}</td>
                        <td>
                          {row.id_sucursal} {row.descripcion_sucursal}
                        </td>
                        <td>{row.vendedor_codigo_nombre}</td>
                        <td>
                          {row.tipo_docto_cruce} {row.consec_docto_cruce}
                        </td>
                        <td>{row.nro_cuota_cruce}</td>
                        <td>{row.fecha_vcto}</td>
                        <td>{row.cubeta || '—'}</td>
                        <td className="num">{row.dias_a_vcto ?? '—'}</td>
                        <td className="num">{formatMoney(row.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {id === 'canceladas' && canceladas && (
          <>
            <p className="detail-lead">
              {canceladas.anio} · Q1 {canceladas.q1 ?? '—'} · Q2 {canceladas.q2 ?? '—'} · Q3 {canceladas.q3 ?? '—'} · Q4{' '}
              {canceladas.q4 ?? '—'} · total {canceladas.total}
            </p>
            <section className="month-table neon-card">
              <p className="formula-line">Documentos cancelados (fecha_cancelacion)</p>
              <div className="month-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>NIT</th>
                      <th>Razón</th>
                      <th>Sucursal</th>
                      <th>Docto</th>
                      <th>Cuota</th>
                      <th>Fecha docto</th>
                      <th>Fecha cancelación</th>
                      <th className="num">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {canceladas.detalle.map((row, i) => (
                      <tr key={`${row.consec_docto_cruce}-${row.nro_cuota_cruce}-${i}`}>
                        <td>{row.nit}</td>
                        <td>{row.razon_social}</td>
                        <td>
                          {row.id_sucursal} {row.descripcion_sucursal}
                        </td>
                        <td>
                          {row.tipo_docto_cruce} {row.consec_docto_cruce}
                        </td>
                        <td>{row.nro_cuota_cruce}</td>
                        <td>{row.fecha_docto}</td>
                        <td>{row.fecha_cancelacion}</td>
                        <td className="num">{formatMoney(row.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}

        {id === 'siesa' && siesa && (
          <>
            <p className="detail-lead">
              Saldo {formatMoney(siesa.saldo_cartera)} · {siesa.n_docs} documentos · dias_vencidos de origen
            </p>
            <section className="month-table neon-card">
              <p className="formula-line">Documentos Siesa (fact_cartera.total)</p>
              <div className="month-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>NIT</th>
                      <th>Razón</th>
                      <th>Número</th>
                      <th>Vendedor</th>
                      <th>Docto</th>
                      <th>Vence</th>
                      <th className="num">Plazo</th>
                      <th className="num">Días vencidos</th>
                      <th className="num">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {siesa.detalle.map((row, i) => (
                      <tr key={`${row.numero}-${i}`}>
                        <td>{row.nit}</td>
                        <td>{row.razon_social}</td>
                        <td>{row.numero}</td>
                        <td>{row.codigo_vendedor}</td>
                        <td>{row.fecha_docto}</td>
                        <td>{row.fecha_vcto}</td>
                        <td className="num">{row.plazo ?? '—'}</td>
                        <td className="num">{row.dias_vencidos ?? '—'}</td>
                        <td className="num">{formatMoney(row.total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </>
        )}
      </main>
    </div>
  )
}
