import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  CarteraAging,
  CarteraAgingRow,
  CarteraCanceladaRow,
  CarteraCanceladas,
  CarteraSiesaRow,
  CarteraSiesaSaldo,
  fetchCarteraAging,
  fetchCarteraCanceladas,
  fetchCarteraSiesa,
} from '../api/client'
import AppHeader from '../components/AppHeader'
import BikeLoader from '../components/BikeLoader'
import BreakdownTable from '../components/BreakdownTable'
import KpiCard from '../components/KpiCard'
import KpiSkeleton from '../components/KpiSkeleton'
import { formatMoney, HorizontalBarsChart, NamedBarChart, StackedShareChart } from '../components/KpiCharts'
import RowDrawer from '../components/RowDrawer'
import ScopeBanner from '../components/ScopeBanner'
import TableBanner from '../components/TableBanner'
import TableCsvMenu from '../components/TableCsvMenu'
import TablePager, { pageSlice } from '../components/TablePager'
import TableToolbar from '../components/TableToolbar'
import { carteraCacheKey, readCarteraPack, writeCarteraPack } from '../kpiCache'
import { currentYear, selectedAsesorKey, yearOptions } from '../period'
import { rowMatches, uniqueSorted } from '../tableQuery'

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
  const [qDetalle, setQDetalle] = useState('')
  const [cubeta, setCubeta] = useState('')
  const [qSiesa, setQSiesa] = useState('')
  const [qCancel, setQCancel] = useState('')
  const [openAging, setOpenAging] = useState<CarteraAgingRow | null>(null)
  const [openSiesa, setOpenSiesa] = useState<CarteraSiesaRow | null>(null)
  const [openCancel, setOpenCancel] = useState<CarteraCanceladaRow | null>(null)
  const asesorKey = selectedAsesorKey()
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('kpi_user') || '{}') as { role?: string }
    } catch {
      return {}
    }
  }, [])

  useEffect(() => {
    const cacheKey = carteraCacheKey(asOf, anio, trimestre, asesorKey)
    const cached = readCarteraPack(cacheKey)
    setError('')
    setDetallePage(1)
    setSiesaPage(1)
    setCancelPage(1)
    if (cached?.aging) {
      setAging(cached.aging)
      setSiesa(cached.siesa)
      setCanceladas(cached.canceladas)
    } else {
      setAging(null)
    }
    void (async () => {
      try {
        const [agingRes, siesaRes, cancelRes] = await Promise.all([
          fetchCarteraAging({ as_of: asOf, anio }),
          fetchCarteraSiesa({ anio }).catch(() => null),
          fetchCarteraCanceladas(anio, trimestre).catch(() => null),
        ])
        setAging(agingRes)
        setSiesa(siesaRes)
        setCanceladas(cancelRes)
        writeCarteraPack(cacheKey, { aging: agingRes, siesa: siesaRes, canceladas: cancelRes })
      } catch (err) {
        if (!cached?.aging) setError(err instanceof Error ? err.message : 'Error')
      }
    })()
  }, [asOf, anio, trimestre, asesorKey])

  const who = aging?.resumen.vendedor_nombre
  const abierta = aging?.resumen.abierta ?? 0
  const subtitle = useMemo(() => `Año ${anio} · foto ${asOf}${who ? ` · ${who}` : ''}`, [anio, asOf, who])
  const ranking = useMemo(() => buildRanking(aging), [aging])
  const composition = useMemo(() => buildComposition(aging), [aging])
  const cubetas = uniqueSorted(aging?.detalle.map((row) => row.cubeta) || [])
  const detalleFiltrado = useMemo(() => {
    if (!aging) return []
    return aging.detalle.filter((row) => {
      if (cubeta && row.cubeta !== cubeta) return false
      return rowMatches(
        [row.nit, row.razon_social, row.consec_docto_cruce, row.vendedor_codigo_nombre, row.cubeta],
        qDetalle,
      )
    })
  }, [aging, qDetalle, cubeta])
  const siesaFiltrado = useMemo(() => {
    if (!siesa) return []
    return siesa.detalle.filter((row) =>
      rowMatches([row.nit, row.razon_social, row.numero, row.codigo_vendedor], qSiesa),
    )
  }, [siesa, qSiesa])
  const cancelFiltrado = useMemo(() => {
    if (!canceladas) return []
    return canceladas.detalle.filter((row) =>
      rowMatches([row.nit, row.razon_social, row.consec_docto_cruce], qCancel),
    )
  }, [canceladas, qCancel])

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
            Año
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
            Abierta, cubetas y Siesa recortan por fecha_docto del año. Canceladas van por fecha_cancelacion del año. La foto solo arma las cubetas.
          </p>
        </section>
        <ScopeBanner visible={user.role === 'admin' && asesorKey == null} />
        {error && <div className="error banner">{error}</div>}
        {!aging && !error && (
          <>
            <BikeLoader label="Armando el detalle de cartera…" />
            <KpiSkeleton />
          </>
        )}

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
              description={`Solo documentos con fecha_docto en ${anio}. Cubetas: d = as_of − fecha_vcto.`}
              formula="YEAR(fecha_docto) = año · d = as_of − fecha_vcto"
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
              rows={detalleFiltrado.map((row) => [
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
                description="Cada fila es una cuota ABIERTA. La cubeta sale de as_of − fecha_vcto. Busca NIT o cliente. Clic abre el documento. Clic derecho exporta el filtro actual."
              />
              <TableToolbar
                query={qDetalle}
                onQuery={(value) => {
                  setQDetalle(value)
                  setDetallePage(1)
                }}
                facetLabel="Cubeta"
                facet={cubeta}
                facets={cubetas}
                onFacet={(value) => {
                  setCubeta(value)
                  setDetallePage(1)
                }}
                count={detalleFiltrado.length}
                total={aging.detalle.length}
              />
              <div className="month-table-wrap">
                <table>
                  <thead>
                    <tr>
                      <th>NIT</th>
                      <th>Razón social</th>
                      <th className="hide-sm">Sucursal</th>
                      <th className="hide-sm">Vendedor</th>
                      <th>Docto</th>
                      <th className="hide-sm">Cuota</th>
                      <th>Vence</th>
                      <th>Cubeta</th>
                      <th className="num hide-sm">Días a vcto</th>
                      <th className="num">Valor</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pageSlice(detalleFiltrado, detallePage, PAGE_SIZE).map((row, i) => (
                      <tr
                        key={`${row.nit}-${row.consec_docto_cruce}-${row.nro_cuota_cruce}-${i}`}
                        className="is-clickable"
                        onClick={() => setOpenAging(row)}
                      >
                        <td>{row.nit}</td>
                        <td>{row.razon_social}</td>
                        <td className="hide-sm">
                          {row.id_sucursal} {row.descripcion_sucursal}
                        </td>
                        <td className="hide-sm">{row.vendedor_codigo_nombre}</td>
                        <td>
                          {row.tipo_docto_cruce} {row.consec_docto_cruce}
                        </td>
                        <td className="hide-sm">{row.nro_cuota_cruce}</td>
                        <td>{row.fecha_vcto}</td>
                        <td>{row.cubeta || '—'}</td>
                        <td className="num hide-sm">{row.dias_a_vcto ?? '—'}</td>
                        <td className="num">{formatMoney(row.valor)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <TablePager page={detallePage} pageSize={PAGE_SIZE} total={detalleFiltrado.length} onPage={setDetallePage} />
            </section>
            </TableCsvMenu>
          </div>
        )}

        {siesa && (
          <TableCsvMenu
            filename="saldo-siesa"
            headers={['NIT', 'Razón', 'Número', 'Vendedor', 'Docto', 'Vence', 'Plazo', 'Días vencidos', 'Total']}
            rows={siesaFiltrado.map((row) => [
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
            <TableToolbar
              query={qSiesa}
              onQuery={(value) => {
                setQSiesa(value)
                setSiesaPage(1)
              }}
              count={siesaFiltrado.length}
              total={siesa.detalle.length}
            />
            <div className="month-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>NIT</th>
                    <th>Razón</th>
                    <th>Número</th>
                    <th className="hide-sm">Vendedor</th>
                    <th className="hide-sm">Docto</th>
                    <th>Vence</th>
                    <th className="num hide-sm">Plazo</th>
                    <th className="num hide-sm">Días vencidos</th>
                    <th className="num">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice(siesaFiltrado, siesaPage, PAGE_SIZE).map((row, i) => (
                    <tr key={`${row.numero}-${i}`} className="is-clickable" onClick={() => setOpenSiesa(row)}>
                      <td>{row.nit}</td>
                      <td>{row.razon_social}</td>
                      <td>{row.numero}</td>
                      <td className="hide-sm">{row.codigo_vendedor}</td>
                      <td className="hide-sm">{row.fecha_docto}</td>
                      <td>{row.fecha_vcto}</td>
                      <td className="num hide-sm">{row.plazo ?? '—'}</td>
                      <td className="num hide-sm">{row.dias_vencidos ?? '—'}</td>
                      <td className="num">{formatMoney(row.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePager page={siesaPage} pageSize={PAGE_SIZE} total={siesaFiltrado.length} onPage={setSiesaPage} />
          </section>
          </TableCsvMenu>
        )}

        {canceladas && (
          <TableCsvMenu
            filename="canceladas"
            headers={['NIT', 'Razón', 'Sucursal', 'Docto', 'Cuota', 'Fecha docto', 'Fecha cancelación', 'Valor']}
            rows={cancelFiltrado.map((row) => [
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
              description={`Año ${canceladas.anio}${canceladas.trimestre ? ` · Q${canceladas.trimestre}` : ''} · Q1 ${canceladas.q1 ?? '—'} · Q2 ${canceladas.q2 ?? '—'} · Q3 ${canceladas.q3 ?? '—'} · Q4 ${canceladas.q4 ?? '—'} · total ${canceladas.total}. Busca NIT o cliente. Clic abre el documento.`}
            />
            <TableToolbar
              query={qCancel}
              onQuery={(value) => {
                setQCancel(value)
                setCancelPage(1)
              }}
              count={cancelFiltrado.length}
              total={canceladas.detalle.length}
            />
            <div className="month-table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>NIT</th>
                    <th>Razón</th>
                    <th className="hide-sm">Sucursal</th>
                    <th>Docto</th>
                    <th className="hide-sm">Cuota</th>
                    <th className="hide-sm">Fecha docto</th>
                    <th>Fecha cancelación</th>
                    <th className="num">Valor</th>
                  </tr>
                </thead>
                <tbody>
                  {pageSlice(cancelFiltrado, cancelPage, PAGE_SIZE).map((row, i) => (
                    <tr
                      key={`${row.consec_docto_cruce}-${row.nro_cuota_cruce}-${i}`}
                      className="is-clickable"
                      onClick={() => setOpenCancel(row)}
                    >
                      <td>{row.nit}</td>
                      <td>{row.razon_social}</td>
                      <td className="hide-sm">
                        {row.id_sucursal} {row.descripcion_sucursal}
                      </td>
                      <td>
                        {row.tipo_docto_cruce} {row.consec_docto_cruce}
                      </td>
                      <td className="hide-sm">{row.nro_cuota_cruce}</td>
                      <td className="hide-sm">{row.fecha_docto}</td>
                      <td>{row.fecha_cancelacion}</td>
                      <td className="num">{formatMoney(row.valor)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <TablePager page={cancelPage} pageSize={PAGE_SIZE} total={cancelFiltrado.length} onPage={setCancelPage} />
          </section>
          </TableCsvMenu>
        )}
        {openAging && (
          <RowDrawer
            title={openAging.razon_social || 'Cliente'}
            subtitle={`${openAging.tipo_docto_cruce || ''} ${openAging.consec_docto_cruce ?? ''}`.trim()}
            fields={[
              { label: 'NIT', value: openAging.nit || '' },
              { label: 'Razón social', value: openAging.razon_social || '' },
              { label: 'Sucursal', value: `${openAging.id_sucursal ?? ''} ${openAging.descripcion_sucursal ?? ''}`.trim() },
              { label: 'Vendedor', value: openAging.vendedor_codigo_nombre || '' },
              { label: 'Documento', value: `${openAging.tipo_docto_cruce || ''} ${openAging.consec_docto_cruce ?? ''}`.trim() },
              { label: 'Cuota', value: openAging.nro_cuota_cruce != null ? String(openAging.nro_cuota_cruce) : '' },
              { label: 'Vence', value: openAging.fecha_vcto || '' },
              { label: 'Cubeta', value: openAging.cubeta || '' },
              { label: 'Días a vcto', value: openAging.dias_a_vcto != null ? String(openAging.dias_a_vcto) : '' },
              { label: 'Valor', value: formatMoney(openAging.valor) },
            ]}
            onClose={() => setOpenAging(null)}
            onFilter={() => {
              if (openAging.nit) setQDetalle(openAging.nit)
              setOpenAging(null)
            }}
            filterLabel="Buscar este NIT"
          />
        )}
        {openSiesa && (
          <RowDrawer
            title={openSiesa.razon_social || 'Documento Siesa'}
            subtitle={openSiesa.numero || ''}
            fields={[
              { label: 'NIT', value: openSiesa.nit || '' },
              { label: 'Razón', value: openSiesa.razon_social || '' },
              { label: 'Número', value: openSiesa.numero || '' },
              { label: 'Vendedor', value: openSiesa.codigo_vendedor || '' },
              { label: 'Fecha docto', value: openSiesa.fecha_docto || '' },
              { label: 'Vence', value: openSiesa.fecha_vcto || '' },
              { label: 'Plazo', value: openSiesa.plazo != null ? String(openSiesa.plazo) : '' },
              { label: 'Días vencidos', value: openSiesa.dias_vencidos != null ? String(openSiesa.dias_vencidos) : '' },
              { label: 'Total', value: formatMoney(openSiesa.total) },
            ]}
            onClose={() => setOpenSiesa(null)}
            onFilter={() => {
              if (openSiesa.nit) setQSiesa(openSiesa.nit)
              setOpenSiesa(null)
            }}
            filterLabel="Buscar este NIT"
          />
        )}
        {openCancel && (
          <RowDrawer
            title={openCancel.razon_social || 'Cancelada'}
            subtitle={`${openCancel.tipo_docto_cruce || ''} ${openCancel.consec_docto_cruce ?? ''}`.trim()}
            fields={[
              { label: 'NIT', value: openCancel.nit || '' },
              { label: 'Razón', value: openCancel.razon_social || '' },
              { label: 'Sucursal', value: `${openCancel.id_sucursal ?? ''} ${openCancel.descripcion_sucursal ?? ''}`.trim() },
              { label: 'Documento', value: `${openCancel.tipo_docto_cruce || ''} ${openCancel.consec_docto_cruce ?? ''}`.trim() },
              { label: 'Cuota', value: openCancel.nro_cuota_cruce != null ? String(openCancel.nro_cuota_cruce) : '' },
              { label: 'Fecha docto', value: openCancel.fecha_docto || '' },
              { label: 'Fecha cancelación', value: openCancel.fecha_cancelacion || '' },
              { label: 'Valor', value: formatMoney(openCancel.valor) },
            ]}
            onClose={() => setOpenCancel(null)}
            onFilter={() => {
              if (openCancel.nit) setQCancel(openCancel.nit)
              setOpenCancel(null)
            }}
            filterLabel="Buscar este NIT"
          />
        )}
      </main>
    </div>
  )
}

function ratio(part: number, total: number) {
  return total ? part / total : 0
}

function shareOf(part: number, total: number) {
  return `${Math.round(ratio(part, total) * 100)}%`
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
