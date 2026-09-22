import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { CarteraAging, CarteraCanceladas, CarteraSiesaSaldo, fetchCarteraAging, fetchCarteraCanceladas, fetchCarteraSiesa } from '../api/client'
import AppHeader from '../components/AppHeader'
import BikeLoader from '../components/BikeLoader'
import BreakdownTable from '../components/BreakdownTable'
import KpiCard from '../components/KpiCard'
import { formatMoney, HorizontalBarsChart, NamedBarChart, StackedShareChart } from '../components/KpiCharts'
import TableBanner from '../components/TableBanner'
import TableCsvMenu from '../components/TableCsvMenu'
import TablePager, { pageSlice } from '../components/TablePager'
import { currentYear, yearOptions } from '../period'

const PAGE_SIZE = 12

export default function CarteraDetail() {
  const [params, setParams] = useSearchParams()
  const asOf = params.get('as_of') || new Date().toISOString().slice(0, 10)
  const anio = Number(params.get('anio') || currentYear())
  const trimestre = params.get('q') ? Number(params.get('q')) : null

  const [aging, setAging] = useState<CarteraAging | null>(null)
  const [canceladas, setCanceladas] = useState<CarteraCanceladas | null>(null)
  const [siesa, setSiesa] = useState<CarteraSiesaSaldo | null>(null)
  const [error, setError] = useState('')
  const [detallePage, setDetallePage] = useState(1)
  const [siesaPage, setSiesaPage] = useState(1)
  const [cancelPage, setCancelPage] = useState(1)

  useEffect(() => {
    setError('')
    setAging(null)
    setDetallePage(1)
    void fetchCarteraAging({ as_of: asOf })
      .then(setAging)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error'))
  }, [asOf])

  useEffect(() => {
    setSiesaPage(1)
    void fetchCarteraSiesa()
      .then(setSiesa)
      .catch(() => setSiesa(null))
  }, [])

  useEffect(() => {
    setCanceladas(null)
    setCancelPage(1)
    void fetchCarteraCanceladas(anio, trimestre)
      .then(setCanceladas)
      .catch(() => setCanceladas(null))
  }, [anio, trimestre])

  const who = aging?.resumen.vendedor_nombre
  const abierta = aging?.resumen.abierta ?? 0
  const subtitle = useMemo(() => `Foto ${asOf}${who ? ` · ${who}` : ''}`, [asOf, who])
  const ranking = useMemo(() => buildRanking(aging), [aging])
  const composition = useMemo(() => buildComposition(aging), [aging])

  function patchParams(next: Record<string, string>) {
    const merged = new URLSearchParams(params)
    Object.entries(next).forEach(([key, value]) => {
      if (value) merged.set(key, value)
      else merged.delete(key)
    })
    setParams(merged)
  }

  return (
    <div className="app-shell hud">
      <AppHeader subtitle={`Cartera · ${subtitle}`} backTo="/" />
      <main className="dashboard detail-page">
        <section className="filters neon-card">
          <label>
            Foto al
            <input type="date" value={asOf} onChange={(e) => patchParams({ as_of: e.target.value })} />
          </label>
          <label>
            Año canceladas
            <select value={anio} onChange={(e) => patchParams({ anio: e.target.value })}>
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
                onClick={() => patchParams({ q: String(q) })}
              >
                Q{q}
              </button>
            ))}
            <button type="button" className={`ghost q-btn${trimestre == null ? ' active neon' : ''}`} onClick={() => patchParams({ q: '' })}>
              Año
            </button>
          </div>
          <p className="range-hint">
            Abierta y cubetas son foto a la fecha. Canceladas van por fecha_cancelacion. Siesa es saldo, sin trimestre.
          </p>
        </section>
        {error && <div className="error banner">{error}</div>}
        {!aging && !error && <BikeLoader label="Armando el detalle de cartera…" />}

        {aging && (
          <div className="board-enter">
            <section className="cards-grid two">
              <KpiCard
                icon="check"
                title="Al día"
                value={formatMoney(aging.resumen.al_dia.monto)}
                delta={`${shareOf(aging.resumen.al_dia.monto, abierta)} de la abierta`}
                subtitle={`${aging.resumen.al_dia.n.toLocaleString('es-CO')} cuotas · d ≤ 0`}
                detail="Vence hoy o después de la foto"
                percent={ratio(aging.resumen.al_dia.monto, abierta)}
                tone="ok"
              />
              <KpiCard
                icon="clock"
                title="Gracia 30 días"
                value={formatMoney(aging.resumen.gracia.monto)}
                delta={`${shareOf(aging.resumen.gracia.monto, abierta)} de la abierta`}
                subtitle={`${aging.resumen.gracia.n.toLocaleString('es-CO')} cuotas · 1 a 30`}
                detail="Venció hace 1 a 30 días"
                percent={ratio(aging.resumen.gracia.monto, abierta)}
                tone="neutral"
              />
              <KpiCard
                icon="alert"
                title="Vencida"
                value={formatMoney(aging.resumen.vencida.monto)}
                delta={`${shareOf(aging.resumen.vencida.monto, abierta)} de la abierta`}
                subtitle={`${aging.resumen.vencida.n.toLocaleString('es-CO')} cuotas · más de 30`}
                detail="Venció hace más de 30 días"
                percent={ratio(aging.resumen.vencida.monto, abierta)}
                tone="bad"
              />
              {siesa && (
                <KpiCard
                  icon="docs"
                  title="Saldo Siesa"
                  value={formatMoney(siesa.saldo_cartera)}
                  delta={`${siesa.n_docs.toLocaleString('es-CO')} documentos`}
                  subtitle="Saldo en fact_cartera.total"
                  detail="Otra fuente · no se cruza con UnoEE"
                  tone="neutral"
                />
              )}
            </section>
            <BreakdownTable
              title="Resumen de cubetas"
              description="d = as_of − fecha_vcto. Abierta $ = al día + gracia + vencida + sin vencimiento"
              formula="d = as_of − fecha_vcto. Abierta $ = al día + gracia + vencida + sin vencimiento"
              rows={[
                { label: 'Abierta $', value: formatMoney(aging.resumen.abierta) },
                { label: 'Al día', value: formatMoney(aging.resumen.al_dia.monto), hint: `${aging.resumen.al_dia.n} cuotas` },
                { label: 'Gracia', value: formatMoney(aging.resumen.gracia.monto), hint: `${aging.resumen.gracia.n} cuotas` },
                { label: 'Vencida', value: formatMoney(aging.resumen.vencida.monto), hint: `${aging.resumen.vencida.n} cuotas` },
                { label: 'Sin vencimiento', value: formatMoney(aging.resumen.sin_vcto.monto), hint: 'Suma en abierta y no en cubetas' },
              ]}
            />
            <section className="charts-grid dash-top">
              <HorizontalBarsChart
                title="Desempeño por cubeta"
                items={[
                  { name: 'Al día', value: aging.resumen.al_dia.monto },
                  { name: 'Gracia', value: aging.resumen.gracia.monto },
                  { name: 'Vencida', value: aging.resumen.vencida.monto },
                ]}
              />
              {ranking.items.length > 0 && (
                <HorizontalBarsChart
                  title={ranking.title}
                  items={ranking.items}
                  height={260}
                  labelWidth={112}
                />
              )}
            </section>
            <section className="charts-grid dash-bottom">
              <StackedShareChart
                title="Composición de cartera"
                points={composition}
                keys={[{ key: 'Al día' }, { key: 'Gracia' }, { key: 'Vencida' }]}
                height={260}
              />
              {canceladas && (
                <NamedBarChart
                  title="Canceladas por trimestre"
                  asCount
                  items={[
                    { name: 'Q1', value: canceladas.q1 ?? 0 },
                    { name: 'Q2', value: canceladas.q2 ?? 0 },
                    { name: 'Q3', value: canceladas.q3 ?? 0 },
                    { name: 'Q4', value: canceladas.q4 ?? 0 },
                  ]}
                  height={260}
                />
              )}
            </section>
            <TableCsvMenu
              filename="por-vendedor-unoee"
              headers={['Vendedor', 'Monto', '#']}
              rows={aging.por_vendedor.map((row) => [row.nombre, row.monto, row.n])}
            >
            <section className="month-table neon-card has-banner">
              <TableBanner
                title="Por vendedor UnoEE"
                description="Saldo abierto agrupado por vendedor de fact_cartera_unoee. Es la foto a la fecha, no un trimestre. Clic derecho para exportar CSV."
              />
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
            </TableCsvMenu>
            <TableCsvMenu
              filename="top-clientes"
              headers={['Cliente', 'Monto', '#']}
              rows={aging.top_clientes.map((row) => [row.nombre, row.monto, row.n])}
            >
            <section className="month-table neon-card has-banner">
              <TableBanner
                title="Top clientes"
                description="Clientes con mayor saldo abierto en la foto. El monto es SUM(valor) de cuotas ABIERTA. Clic derecho para exportar CSV."
              />
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
            </TableCsvMenu>
            <TableCsvMenu
              filename="detalle-cuotas-abiertas"
              headers={['NIT', 'Razón social', 'Sucursal', 'Vendedor', 'Docto', 'Cuota', 'Vence', 'Cubeta', 'Días a vcto', 'Valor']}
              rows={aging.detalle.map((row) => [
                row.nit,
                row.razon_social,
                `${row.id_sucursal ?? ''} ${row.descripcion_sucursal ?? ''}`.trim(),
                row.vendedor_codigo_nombre,
                `${row.tipo_docto_cruce ?? ''} ${row.consec_docto_cruce ?? ''}`.trim(),
                row.nro_cuota_cruce,
                row.fecha_vcto,
                row.cubeta,
                row.dias_a_vcto,
                row.valor,
              ])}
            >
            <section className="month-table neon-card has-banner">
              <TableBanner
                title="Detalle de cuotas abiertas"
                description="Cada fila es una cuota ABIERTA. La cubeta sale de as_of − fecha_vcto. Clic derecho exporta todas las filas a CSV, no solo la página."
              />
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
                    {pageSlice(aging.detalle, detallePage, PAGE_SIZE).map((row, i) => (
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
              <TablePager page={detallePage} pageSize={PAGE_SIZE} total={aging.detalle.length} onPage={setDetallePage} />
            </section>
            </TableCsvMenu>
          </div>
        )}

        {siesa && (
          <TableCsvMenu
            filename="saldo-siesa"
            headers={['NIT', 'Razón', 'Número', 'Vendedor', 'Docto', 'Vence', 'Plazo', 'Días vencidos', 'Total']}
            rows={siesa.detalle.map((row) => [
              row.nit,
              row.razon_social,
              row.numero,
              row.codigo_vendedor,
              row.fecha_docto,
              row.fecha_vcto,
              row.plazo,
              row.dias_vencidos,
              row.total,
            ])}
          >
          <section className="month-table neon-card has-banner">
            <TableBanner
              title="Saldo Siesa"
              description={`Saldo ${formatMoney(siesa.saldo_cartera)} · ${siesa.n_docs} documentos · fact_cartera.total. Otra fuente, no se cruza con UnoEE.`}
            />
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
                  {pageSlice(siesa.detalle, siesaPage, PAGE_SIZE).map((row, i) => (
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
            <TablePager page={siesaPage} pageSize={PAGE_SIZE} total={siesa.detalle.length} onPage={setSiesaPage} />
          </section>
          </TableCsvMenu>
        )}

        {canceladas && (
          <TableCsvMenu
            filename="canceladas"
            headers={['NIT', 'Razón', 'Sucursal', 'Docto', 'Cuota', 'Fecha docto', 'Fecha cancelación', 'Valor']}
            rows={canceladas.detalle.map((row) => [
              row.nit,
              row.razon_social,
              `${row.id_sucursal ?? ''} ${row.descripcion_sucursal ?? ''}`.trim(),
              `${row.tipo_docto_cruce ?? ''} ${row.consec_docto_cruce ?? ''}`.trim(),
              row.nro_cuota_cruce,
              row.fecha_docto,
              row.fecha_cancelacion,
              row.valor,
            ])}
          >
          <section className="month-table neon-card has-banner">
            <TableBanner
              title="Canceladas"
              description={`Año ${canceladas.anio}${canceladas.trimestre ? ` · Q${canceladas.trimestre}` : ''} · Q1 ${canceladas.q1 ?? '—'} · Q2 ${canceladas.q2 ?? '—'} · Q3 ${canceladas.q3 ?? '—'} · Q4 ${canceladas.q4 ?? '—'} · total ${canceladas.total}. Clic derecho exporta todas las filas a CSV.`}
            />
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
                  {pageSlice(canceladas.detalle, cancelPage, PAGE_SIZE).map((row, i) => (
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
            <TablePager page={cancelPage} pageSize={PAGE_SIZE} total={canceladas.detalle.length} onPage={setCancelPage} />
          </section>
          </TableCsvMenu>
        )}
      </main>
    </div>
  )
}

function ratio(part: number, total: number) {
  return total ? part / total : 0
}

function shareOf(part: number, total: number) {
  return `${(ratio(part, total) * 100).toFixed(1)}%`
}

function shortName(name: string | null | undefined) {
  const text = (name || 'Sin nombre').trim()
  return text.length > 18 ? `${text.slice(0, 16)}…` : text
}

function cubetaKey(label: string | null): 'Al día' | 'Gracia' | 'Vencida' | null {
  if (!label) return null
  if (label.includes('Al día')) return 'Al día'
  if (label.includes('Gracia')) return 'Gracia'
  if (label.includes('Vencida')) return 'Vencida'
  return null
}

function buildRanking(aging: CarteraAging | null) {
  if (!aging) return { title: 'Desempeño', items: [] as { name: string; value: number }[] }
  const vendors = aging.por_vendedor.filter((row) => row.monto > 0)
  if (vendors.length > 1) {
    return {
      title: 'Desempeño por vendedor',
      items: vendors.slice(0, 6).map((row) => ({ name: shortName(row.nombre), value: row.monto })),
    }
  }
  return {
    title: 'Top clientes',
    items: aging.top_clientes.slice(0, 6).map((row) => ({ name: shortName(row.nombre), value: row.monto })),
  }
}

function buildComposition(aging: CarteraAging | null) {
  if (!aging) return []
  const vendorPoints = composeDetalle(aging, 'vendor')
  if (vendorPoints.length >= 2) return vendorPoints
  const clientPoints = composeDetalle(aging, 'client')
  if (clientPoints.length >= 2) return clientPoints
  return [
    {
      name: 'Cartera',
      'Al día': aging.resumen.al_dia.monto,
      Gracia: aging.resumen.gracia.monto,
      Vencida: aging.resumen.vencida.monto,
    },
  ]
}

function composeDetalle(aging: CarteraAging, by: 'vendor' | 'client') {
  const map = new Map<string, { name: string; 'Al día': number; Gracia: number; Vencida: number }>()
  for (const row of aging.detalle) {
    const raw = by === 'vendor' ? row.vendedor_codigo_nombre : row.razon_social
    const name = raw || 'Sin nombre'
    const bucket = cubetaKey(row.cubeta)
    if (!bucket) continue
    const current = map.get(name) || { name, 'Al día': 0, Gracia: 0, Vencida: 0 }
    current[bucket] += row.valor
    map.set(name, current)
  }
  return [...map.values()]
    .sort((a, b) => a['Al día'] + a.Gracia + a.Vencida < b['Al día'] + b.Gracia + b.Vencida ? 1 : -1)
    .slice(0, 5)
    .map((row) => ({ ...row, name: shortName(row.name) }))
}
