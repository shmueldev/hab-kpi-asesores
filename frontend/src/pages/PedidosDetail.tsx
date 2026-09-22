import { useEffect, useMemo, useState } from 'react'
import { fetchPedidos, PedidoResumen, PedidoRow } from '../api/client'
import AppHeader from '../components/AppHeader'
import BikeLoader from '../components/BikeLoader'
import BreakdownTable from '../components/BreakdownTable'
import KpiCard from '../components/KpiCard'
import { formatMoney, HorizontalBarsChart, NamedBarChart } from '../components/KpiCharts'
import RowDrawer from '../components/RowDrawer'
import ScopeBanner from '../components/ScopeBanner'
import TableBanner from '../components/TableBanner'
import TableCsvMenu from '../components/TableCsvMenu'
import TablePager, { pageSlice } from '../components/TablePager'
import TableToolbar from '../components/TableToolbar'
import { loadPeriod, periodLabel, rangeFromPeriod, selectedAsesorKey } from '../period'
import { rowMatches, uniqueSorted } from '../tableQuery'

const PAGE_SIZE = 12

export default function PedidosDetail() {
  const period = useMemo(() => loadPeriod(), [])
  const range = rangeFromPeriod(period)
  const key = selectedAsesorKey()
  const user = useMemo(() => {
    try {
      return JSON.parse(localStorage.getItem('kpi_user') || '{}') as { role?: string }
    } catch {
      return {}
    }
  }, [])

  const [data, setData] = useState<PedidoResumen | null>(null)
  const [error, setError] = useState('')
  const [query, setQuery] = useState('')
  const [canal, setCanal] = useState('')
  const [page, setPage] = useState(1)
  const [open, setOpen] = useState<PedidoRow | null>(null)

  useEffect(() => {
    setError('')
    void fetchPedidos(range.fechaIni, range.fechaFin, key)
      .then(setData)
      .catch((err: unknown) => setError(err instanceof Error ? err.message : 'Error'))
  }, [range.fechaIni, range.fechaFin, key])

  const filtered = useMemo(() => {
    if (!data) return []
    return data.detalle.filter((row) => {
      if (canal && row.canal !== canal) return false
      return rowMatches([row.nit, row.cliente, row.numero, row.canal], query)
    })
  }, [data, query, canal])

  useEffect(() => {
    setPage(1)
  }, [query, canal])

  const canales = uniqueSorted(data?.detalle.map((row) => row.canal) || [])

  return (
    <div className="app-shell hud">
      <AppHeader subtitle={`Pedidos · ${periodLabel(period)}`} backTo="/" />
      <main className="dashboard detail-page">
        <ScopeBanner visible={user.role === 'admin' && key == null} />
        {error && <div className="error banner">{error}</div>}
        {!data && !error && <BikeLoader label="Armando pedidos del periodo…" />}
        {data && (
          <div className="board-enter">
            <p className="detail-lead">
              {data.asesor_nombre || (key == null ? 'Toda la empresa' : 'Asesor')} · {periodLabel(period)} ·{' '}
              {range.fechaIni} → {range.fechaFin}
            </p>
            <section className="cards-grid two">
              <KpiCard
                icon="docs"
                title="Pedidos"
                value={data.n.toLocaleString('es-CO')}
                delta={periodLabel(period)}
                subtitle={formatMoney(data.valor)}
                detail="COUNT / SUM(curvalorpedido) en fact_pedido"
              />
              <KpiCard
                icon="wallet"
                title="Valor pedidos"
                value={formatMoney(data.valor)}
                delta={`${data.n.toLocaleString('es-CO')} documentos`}
                subtitle="curvalorpedido"
                detail="No es venta facturada"
              />
              <KpiCard
                icon="check"
                title="Con despacho"
                value={data.n_despachados.toLocaleString('es-CO')}
                delta={data.n ? `${Math.round((data.n_despachados / data.n) * 100)}%` : '—'}
                subtitle="fecha_despacho llena"
                detail="Flag real, no etapa inventada"
                percent={data.n ? data.n_despachados / data.n : 0}
                tone="ok"
              />
              <KpiCard
                icon="alert"
                title="Anulados / espera"
                value={`${data.n_anulados} / ${data.n_espera}`}
                delta="intanulado · intespera"
                subtitle="No hay catálogo de estados"
                detail="idestado no se nombra: no hay dim"
                tone="neutral"
              />
            </section>
            <BreakdownTable
              title="Cómo se calcula"
              description="Pedidos del periodo por fecha_pedido. El canal sale de dim_canal_pedido. No es un embudo de prospectos."
              formula="fecha_pedido entre el recorte · intidvendedor = asesor_key"
              rows={[
                { label: 'Pedidos', value: data.n.toLocaleString('es-CO') },
                { label: 'Valor', value: formatMoney(data.valor) },
                { label: 'Con despacho', value: String(data.n_despachados) },
                { label: 'Anulados', value: String(data.n_anulados) },
                { label: 'En espera', value: String(data.n_espera) },
              ]}
            />
            <section className="charts-grid two">
              <HorizontalBarsChart
                title="Valor por canal"
                items={data.por_canal.map((row) => ({ name: row.canal, value: row.valor }))}
                height={260}
              />
              <NamedBarChart
                title="Pedidos por canal"
                asCount
                items={data.por_canal.map((row) => ({ name: row.canal, value: row.n }))}
                height={260}
              />
            </section>
            <TableCsvMenu
              filename="pedidos-detalle"
              headers={['Fecha', 'Número', 'NIT', 'Cliente', 'Canal', 'Valor', 'Anulado', 'Espera', 'Despacho']}
              rows={filtered.map((row) => [
                row.fecha_pedido,
                row.numero,
                row.nit,
                row.cliente,
                row.canal,
                row.valor,
                row.anulado ? 1 : 0,
                row.espera ? 1 : 0,
                row.fecha_despacho,
              ])}
            >
              <section className="month-table neon-card has-banner">
                <TableBanner
                  title="Últimos pedidos"
                  description={`Tope ${data.detalle_tope} filas más recientes. Busca NIT o cliente. Clic en la fila abre el documento. Clic derecho exporta el filtro actual.`}
                />
                <TableToolbar
                  query={query}
                  onQuery={setQuery}
                  placeholder="NIT, cliente o número"
                  facetLabel="Canal"
                  facet={canal}
                  facets={canales}
                  onFacet={setCanal}
                  count={filtered.length}
                  total={data.detalle.length}
                />
                <div className="month-table-wrap">
                  <table>
                    <thead>
                      <tr>
                        <th>Fecha</th>
                        <th className="hide-sm">Número</th>
                        <th>NIT</th>
                        <th>Cliente</th>
                        <th>Canal</th>
                        <th className="num">Valor</th>
                      </tr>
                    </thead>
                    <tbody>
                      {pageSlice(filtered, page, PAGE_SIZE).map((row, i) => (
                        <tr
                          key={`${row.numero}-${row.nit}-${i}`}
                          className="is-clickable"
                          onClick={() => setOpen(row)}
                        >
                          <td>{row.fecha_pedido || '—'}</td>
                          <td className="hide-sm">{row.numero ?? '—'}</td>
                          <td>{row.nit}</td>
                          <td>{row.cliente}</td>
                          <td>{row.canal}</td>
                          <td className="num">{formatMoney(row.valor)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <TablePager page={page} pageSize={PAGE_SIZE} total={filtered.length} onPage={setPage} />
              </section>
            </TableCsvMenu>
          </div>
        )}
        {open && (
          <RowDrawer
            title={open.cliente || 'Pedido'}
            subtitle={`${open.nit || ''} · ${open.numero ?? ''}`}
            fields={[
              { label: 'Fecha pedido', value: open.fecha_pedido || '' },
              { label: 'Número', value: open.numero != null ? String(open.numero) : '' },
              { label: 'NIT', value: open.nit || '' },
              { label: 'Cliente', value: open.cliente || '' },
              { label: 'Canal', value: open.canal || '' },
              { label: 'Valor', value: formatMoney(open.valor) },
              { label: 'Anulado', value: open.anulado ? 'Sí' : 'No' },
              { label: 'Espera', value: open.espera ? 'Sí' : 'No' },
              { label: 'Despacho', value: open.fecha_despacho || '' },
            ]}
            onClose={() => setOpen(null)}
            onFilter={() => {
              if (open.nit) setQuery(open.nit)
              setOpen(null)
            }}
            filterLabel="Buscar este NIT"
          />
        )}
      </main>
    </div>
  )
}
